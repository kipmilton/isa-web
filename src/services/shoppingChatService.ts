import { supabase } from '@/integrations/supabase/client';

interface ProductQuery {
  query_type: 'product_search';
  filters: {
    main_category?: string;
    sub_category?: string;
    sub_sub_category?: string;
    min_price?: number;
    max_price?: number;
    additional_filters?: Record<string, any>;
  };
  limit: number;
  sort_by: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

interface UserContext {
  firstName: string;
  adjustedAge: number;
  gender?: string;
  preferredLanguage: string;
  stylePreferences?: string[];
  cartSummary: string;
  likedSummary: string;
}

export class ShoppingChatService {
  private static readonly GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  private static readonly GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  static async getUserContext(userId: string): Promise<UserContext> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, age, gender, preferences')
      .eq('id', userId)
      .single();

    const { count: cartCount } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: likedCount } = await supabase
      .from('wishlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const firstName = profile?.first_name?.split(' ')[0] || 'Customer';
    const baseAge = profile?.age || 25;
    const randomOffset = Math.floor(Math.random() * 11) - 5;
    const adjustedAge = Math.max(18, baseAge + randomOffset);

    return {
      firstName,
      adjustedAge,
      gender: profile?.gender,
      preferredLanguage: 'English',
      stylePreferences: profile?.preferences?.style_preferences || [],
      cartSummary: cartCount ? `${cartCount} items in cart` : 'Empty cart',
      likedSummary: likedCount ? `${likedCount} liked items` : 'No liked items yet'
    };
  }

  static async queryProducts(productQuery: ProductQuery) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true);

    if (productQuery.filters.main_category) {
      query = query.eq('main_category', productQuery.filters.main_category);
    }
    if (productQuery.filters.sub_category) {
      query = query.eq('subcategory', productQuery.filters.sub_category);
    }
    if (productQuery.filters.sub_sub_category) {
      query = query.eq('sub_subcategory', productQuery.filters.sub_sub_category);
    }
    if (productQuery.filters.min_price) {
      query = query.gte('price', productQuery.filters.min_price);
    }
    if (productQuery.filters.max_price) {
      query = query.lte('price', productQuery.filters.max_price);
    }

    if (productQuery.filters.additional_filters?.brand) {
      query = query.eq('brand', productQuery.filters.additional_filters.brand);
    }

    switch (productQuery.sort_by) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('review_count', { ascending: false });
        break;
    }

    query = query.limit(productQuery.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static extractProductQuery(aiResponse: string): ProductQuery | null {
    const startMarker = 'PRODUCT_QUERY_START';
    const endMarker = 'PRODUCT_QUERY_END';
    
    const startIndex = aiResponse.indexOf(startMarker);
    const endIndex = aiResponse.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      return null;
    }
    
    const jsonStr = aiResponse.substring(startIndex + startMarker.length, endIndex).trim();
    
    try {
      const query = JSON.parse(jsonStr);
      return query as ProductQuery;
    } catch (error) {
      console.error('Failed to parse product query:', error);
      return null;
    }
  }

  static async callGeminiAPI(
    userMessage: string,
    userContext: UserContext,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    const systemPrompt = `You are MyPlug Shopping Assistant, an intelligent e-commerce chatbot for Kenya. 

USER PROFILE:
- Name: ${userContext.firstName}
- Age: ${userContext.adjustedAge}
- Gender: ${userContext.gender || 'Not specified'}
- Language: ${userContext.preferredLanguage}
- Cart Status: ${userContext.cartSummary}
- Liked Items: ${userContext.likedSummary}

YOUR ROLE:
Help customers find products by understanding their needs and generating precise product queries.

WHEN YOU IDENTIFY A PRODUCT REQUEST:
1. Generate a JSON query wrapped in markers: PRODUCT_QUERY_START{json}PRODUCT_QUERY_END
2. Use EXACT category names from the hierarchy
3. Extract price range, brand, and attributes from conversation
4. Provide friendly response explaining what you're showing them

EXAMPLE:
User: "Show me Samsung phones under 50000"
Your response: "I'll show you Samsung smartphones under KES 50,000! PRODUCT_QUERY_START{"query_type":"product_search","filters":{"main_category":"Electronics","sub_category":"Mobile Phones & Tablets","sub_sub_category":"Smartphones","max_price":50000,"additional_filters":{"brand":"Samsung"}},"limit":10,"sort_by":"price_asc"}PRODUCT_QUERY_END"

Be conversational, helpful, and guide customers toward checkout when they're satisfied.`;

    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await fetch(`${this.GEMINI_ENDPOINT}?key=${this.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

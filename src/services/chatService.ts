interface ChatResponse {
  success: boolean;
  message: string;
  products?: Array<{
    product_id: string;
    name: string;
    price: number;
    image_url: string;
    main_category: string;
    sub_category: string;
    sub_sub_category: string;
    brand?: string;
    attributes?: any;
  }>;
  hasProducts: boolean;
  error?: string;
}

export class ChatService {
  private static API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  static async sendMessage(customerId: string, message: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chat API error:', error);
      return {
        success: false,
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        hasProducts: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

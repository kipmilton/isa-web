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
  static async sendMessage(customerId: string, message: string): Promise<ChatResponse> {
    try {
      // Call Supabase Edge Function
      const response = await fetch(
        'https://cwaeldxeuqxzcohnflun.supabase.co/functions/v1/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YWVsZHhldXF4emNvaG5mbHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTQyNjYsImV4cCI6MjA2NjQzMDI2Nn0.Mq1BIhsvpT78f5TNqXaejRSnERehVfo9teJ_lk-UllY`
          },
          body: JSON.stringify({
            customerId,
            message
          })
        }
      );

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

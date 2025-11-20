import { supabase } from '@/integrations/supabase/client';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  preview?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'myplug' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

export class ConversationService {
  static async createConversation(
    userId: string,
    title: string,
    preview?: string
  ): Promise<ChatConversation> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title,
          preview
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  static async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  static async getConversation(conversationId: string, userId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  static async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'myplug' | 'system'
      }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  static async addMessage(
    conversationId: string,
    userId: string,
    role: 'user' | 'myplug' | 'system',
    content: string,
    metadata?: any
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          metadata
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        role: data.role as 'user' | 'myplug' | 'system'
      };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  static async updateConversation(
    conversationId: string,
    userId: string,
    updates: { title?: string; preview?: string }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update(updates)
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  static async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  static async getSharedConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting shared conversation:', error);
      throw error;
    }
  }

  static generateConversationTitle(firstMessage: string): string {
    // Generate a title from the first message
    const words = firstMessage.split(' ').slice(0, 6);
    return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '');
  }
}

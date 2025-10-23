export interface ModerationResult {
  isBlocked: boolean;
  isMasked: boolean;
  originalMessage: string;
  moderatedMessage: string;
  violations: string[];
  warningMessage?: string;
}

export interface ModerationLog {
  id: string;
  user_id: string;
  order_id: string;
  original_message: string;
  moderated_message: string;
  violations: string[];
  action_taken: 'blocked' | 'masked';
  created_at: string;
}

export interface UserViolation {
  id: string;
  user_id: string;
  violation_type: string;
  violation_count: number;
  last_violation: string;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export class ChatModerationService {
  // Regex patterns for detecting sensitive information
  private static readonly PHONE_PATTERNS = [
    // International formats
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
    /(\+?44[-.\s]?)?\(?([0-9]{4})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{3})/g, // UK format
    /(\+?254[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{3})/g, // Kenya format
    /(\+?[1-9]\d{1,3}[-.\s]?)?\(?([0-9]{2,4})\)?[-.\s]?([0-9]{2,4})[-.\s]?([0-9]{2,4})/g, // Generic international
    // Simple digit patterns
    /\b\d{10,11}\b/g, // 10-11 digit numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Common US format
  ];

  private static readonly EMAIL_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Standard email
    /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g, // Email with spaces
  ];

  private static readonly URL_PATTERNS = [
    /https?:\/\/[^\s]+/g, // HTTP/HTTPS URLs
    /www\.[^\s]+/g, // www URLs
    /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g, // Domain names
  ];

  private static readonly SOCIAL_PLATFORMS = [
    'whatsapp', 'telegram', 'instagram', 'facebook', 'skype', 'twitter', 'x.com',
    'linkedin', 'snapchat', 'tiktok', 'youtube', 'discord', 'signal', 'viber',
    'wechat', 'line', 'kakao', 'telegram.me', 'wa.me', 't.me'
  ];

  private static readonly SOCIAL_PATTERNS = [
    // Social platform mentions
    new RegExp(`\\b(${this.SOCIAL_PLATFORMS.join('|')})\\b`, 'gi'),
    // Social media handles
    /@[a-zA-Z0-9_]+/g,
    // Social media URLs
    /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|youtube\.com|snapchat\.com|discord\.gg|telegram\.me|wa\.me|t\.me)\/[^\s]*/gi,
  ];

  /**
   * Moderate a message for sensitive content
   */
  static moderateMessage(message: string): ModerationResult {
    const violations: string[] = [];
    let moderatedMessage = message;
    let isBlocked = false;
    let isMasked = false;

    // Check for phone numbers
    const phoneMatches = this.detectPhoneNumbers(message);
    if (phoneMatches.length > 0) {
      violations.push('phone_number');
      moderatedMessage = this.maskPhoneNumbers(moderatedMessage);
      isMasked = true;
    }

    // Check for emails
    const emailMatches = this.detectEmails(message);
    if (emailMatches.length > 0) {
      violations.push('email');
      isBlocked = true;
    }

    // Check for URLs
    const urlMatches = this.detectUrls(message);
    if (urlMatches.length > 0) {
      violations.push('url');
      isBlocked = true;
    }

    // Check for social platforms
    const socialMatches = this.detectSocialPlatforms(message);
    if (socialMatches.length > 0) {
      violations.push('social_platform');
      isBlocked = true;
    }

    const warningMessage = isBlocked ? 
      "This message contains restricted information and cannot be sent. For your safety and to ensure all transactions are protected by our Guarantee, please do not share personal contact details, emails, or external links." :
      undefined;

    return {
      isBlocked,
      isMasked,
      originalMessage: message,
      moderatedMessage,
      violations,
      warningMessage
    };
  }

  /**
   * Detect phone numbers in text
   */
  private static detectPhoneNumbers(text: string): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    for (const pattern of this.PHONE_PATTERNS) {
      const patternMatches = text.matchAll(pattern);
      for (const match of patternMatches) {
        matches.push(match);
      }
    }
    return matches;
  }

  /**
   * Detect email addresses in text
   */
  private static detectEmails(text: string): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    for (const pattern of this.EMAIL_PATTERNS) {
      const patternMatches = text.matchAll(pattern);
      for (const match of patternMatches) {
        matches.push(match);
      }
    }
    return matches;
  }

  /**
   * Detect URLs in text
   */
  private static detectUrls(text: string): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    for (const pattern of this.URL_PATTERNS) {
      const patternMatches = text.matchAll(pattern);
      for (const match of patternMatches) {
        matches.push(match);
      }
    }
    return matches;
  }

  /**
   * Detect social platform mentions in text
   */
  private static detectSocialPlatforms(text: string): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    for (const pattern of this.SOCIAL_PATTERNS) {
      const patternMatches = text.matchAll(pattern);
      for (const match of patternMatches) {
        matches.push(match);
      }
    }
    return matches;
  }

  /**
   * Mask phone numbers in text
   */
  private static maskPhoneNumbers(text: string): string {
    let maskedText = text;
    
    for (const pattern of this.PHONE_PATTERNS) {
      maskedText = maskedText.replace(pattern, (match) => {
        // Count digits in the match
        const digits = match.replace(/\D/g, '');
        if (digits.length >= 10) {
          // Mask all but last 4 digits
          const masked = '*'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
          return match.replace(/\d/g, (char, index) => {
            const digitIndex = match.substring(0, index).replace(/\D/g, '').length;
            return digitIndex < digits.length - 4 ? '*' : char;
          });
        }
        return match;
      });
    }
    
    return maskedText;
  }

  /**
   * Log a moderated message to the database
   */
  static async logModeratedMessage(
    userId: string,
    orderId: string,
    result: ModerationResult
  ): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('moderation_logs')
        .insert({
          user_id: userId,
          order_id: orderId,
          original_message: result.originalMessage,
          moderated_message: result.moderatedMessage,
          violations: result.violations,
          action_taken: result.isBlocked ? 'blocked' : 'masked'
        });

      if (error) {
        console.error('Error logging moderated message:', error);
      }
    } catch (error) {
      console.error('Error logging moderated message:', error);
    }
  }

  /**
   * Record a user violation
   */
  static async recordViolation(
    userId: string,
    violationType: string
  ): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check if user already has violations
      const { data: existingViolation } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .eq('violation_type', violationType)
        .single();

      if (existingViolation) {
        // Update existing violation count
        const newCount = existingViolation.violation_count + 1;
        const isSuspended = newCount >= 3; // Suspend after 3 violations

        await supabase
          .from('user_violations')
          .update({
            violation_count: newCount,
            last_violation: new Date().toISOString(),
            is_suspended: isSuspended,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingViolation.id);
      } else {
        // Create new violation record
        await supabase
          .from('user_violations')
          .insert({
            user_id: userId,
            violation_type: violationType,
            violation_count: 1,
            last_violation: new Date().toISOString(),
            is_suspended: false
          });
      }
    } catch (error) {
      console.error('Error recording violation:', error);
    }
  }

  /**
   * Check if user is suspended
   */
  static async isUserSuspended(userId: string): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data } = await supabase
        .from('user_violations')
        .select('is_suspended')
        .eq('user_id', userId)
        .eq('is_suspended', true)
        .single();

      return !!data;
    } catch (error) {
      console.error('Error checking user suspension status:', error);
      return false;
    }
  }

  /**
   * Get user violation history
   */
  static async getUserViolations(userId: string): Promise<UserViolation[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .order('last_violation', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user violations:', error);
      return [];
    }
  }

  /**
   * Get moderation logs for admin review
   */
  static async getModerationLogs(
    limit: number = 50,
    offset: number = 0
  ): Promise<ModerationLog[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching moderation logs:', error);
      return [];
    }
  }
}

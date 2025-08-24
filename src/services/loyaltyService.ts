import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "./notificationService";

export class LoyaltyService {
  // Get user points balance
  static async getUserPoints(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Initialize user points if not exists
        const { data: newPoints, error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            total_points: 0,
            available_points: 0,
            lifetime_earned: 0,
            lifetime_redeemed: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPoints;
      }

      return data;
    } catch (error) {
      console.error('Error getting user points:', error);
      throw error;
    }
  }

  // Get points transactions
  static async getPointsTransactions(userId: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting points transactions:', error);
      throw error;
    }
  }

  // Get points configuration
  static async getPointsConfig() {
    try {
      const { data, error } = await supabase
        .from('points_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting points config:', error);
      throw error;
    }
  }

  // Award points for spending
  static async awardSpendingPoints(userId: string, amountSpent: number) {
    try {
      const { data, error } = await supabase.rpc('award_spending_points', {
        user_id_param: userId,
        amount_spent: amountSpent
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error awarding spending points:', error);
      throw error;
    }
  }

  // Award points for quiz completion
  static async awardQuizPoints(userId: string) {
    try {
      const config = await this.getPointsConfig();
      const pointsToAward = config?.quiz_completion_points || 20;

      const { error } = await supabase
        .from('points_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'earned',
          points: pointsToAward,
          reason: 'Style quiz completion'
        });

      if (error) throw error;

      // Update user points balance
      const { error: updateError } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          total_points: pointsToAward,
          available_points: pointsToAward,
          lifetime_earned: pointsToAward,
          lifetime_redeemed: 0
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (updateError) throw updateError;
      
      // Send notification about points earned
      try {
        await NotificationService.notifyPointsEarned(userId, pointsToAward, 'completing the style quiz');
        
        // Check for milestone achievements
        const userPoints = await this.getUserPoints(userId);
        if (userPoints) {
          await this.checkMilestones(userId, userPoints.available_points);
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't throw error for notification failure
      }
      
      return pointsToAward;
    } catch (error) {
      console.error('Error awarding quiz points:', error);
      throw error;
    }
  }

  // Award points for first purchase
  static async awardFirstPurchasePoints(userId: string) {
    try {
      const config = await this.getPointsConfig();
      const pointsToAward = config?.first_purchase_points || 100;

      const { error } = await supabase
        .from('points_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'earned',
          points: pointsToAward,
          reason: 'First purchase bonus'
        });

      if (error) throw error;

      // Update user points balance
      const { error: updateError } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          total_points: pointsToAward,
          available_points: pointsToAward,
          lifetime_earned: pointsToAward,
          lifetime_redeemed: 0
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (updateError) throw updateError;
      
      // Send notification about points earned
      try {
        await NotificationService.notifyPointsEarned(userId, pointsToAward, 'your first purchase');
        
        // Check for milestone achievements
        const userPoints = await this.getUserPoints(userId);
        if (userPoints) {
          await this.checkMilestones(userId, userPoints.available_points);
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't throw error for notification failure
      }
      
      return pointsToAward;
    } catch (error) {
      console.error('Error awarding first purchase points:', error);
      throw error;
    }
  }

  // Redeem points
  static async redeemPoints(userId: string, pointsToRedeem: number, orderId?: string) {
    try {
      const { data, error } = await supabase.rpc('redeem_points', {
        user_id_param: userId,
        points_to_redeem: pointsToRedeem,
        order_id_param: orderId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  }

  // Check and notify milestone achievements
  static async checkMilestones(userId: string, currentPoints: number) {
    try {
      const milestones = [
        { points: 100, name: '100 Points' },
        { points: 500, name: '500 Points' },
        { points: 1000, name: '1,000 Points' },
        { points: 2500, name: '2,500 Points' },
        { points: 5000, name: '5,000 Points' },
        { points: 10000, name: '10,000 Points' }
      ];

      for (const milestone of milestones) {
        if (currentPoints >= milestone.points) {
          // Check if we've already notified for this milestone
          const { data: existingNotification } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('title', `🏆 Milestone Achieved: ${milestone.name}!`)
            .limit(1);

          if (!existingNotification || existingNotification.length === 0) {
            // Send milestone notification
            await NotificationService.notifyMilestone(userId, milestone.name, currentPoints);
          }
        }
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
      // Don't throw error for milestone checking failure
    }
  }

  // Create referral
  static async createReferral(referrerId: string, referredId: string, referralCode: string) {
    try {
      const { error } = await supabase
        .from('user_referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: referredId,
          referral_code: referralCode
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  // Award referral signup points
  static async awardReferralSignupPoints(referrerId: string) {
    try {
      const config = await this.getPointsConfig();
      const pointsToAward = config?.referral_signup_points || 200;

      const { error } = await supabase
        .from('points_transactions')
        .insert({
          user_id: referrerId,
          transaction_type: 'earned',
          points: pointsToAward,
          reason: 'Referral signup bonus'
        });

      if (error) throw error;

      // Update user points balance
      const { error: updateError } = await supabase
        .from('user_points')
        .upsert({
          user_id: referrerId,
          total_points: pointsToAward,
          available_points: pointsToAward,
          lifetime_earned: pointsToAward,
          lifetime_redeemed: 0
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (updateError) throw updateError;
      return pointsToAward;
    } catch (error) {
      console.error('Error awarding referral signup points:', error);
      throw error;
    }
  }

  // Award referral purchase points
  static async awardReferralPurchasePoints(referrerId: string) {
    try {
      const config = await this.getPointsConfig();
      const pointsToAward = config?.referral_purchase_points || 200;

      const { error } = await supabase
        .from('points_transactions')
        .insert({
          user_id: referrerId,
          transaction_type: 'earned',
          points: pointsToAward,
          reason: 'Referral purchase bonus'
        });

      if (error) throw error;

      // Update user points balance
      const { error: updateError } = await supabase
        .from('user_points')
        .upsert({
          user_id: referrerId,
          total_points: pointsToAward,
          available_points: pointsToAward,
          lifetime_earned: pointsToAward,
          lifetime_redeemed: 0
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (updateError) throw updateError;
      return pointsToAward;
    } catch (error) {
      console.error('Error awarding referral purchase points:', error);
      throw error;
    }
  }

  // Get user referrals
  static async getUserReferrals(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          *,
          referred:profiles!referred_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('referrer_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user referrals:', error);
      throw error;
    }
  }

  // Check if user has completed quiz
  static async hasCompletedQuiz(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_quiz_responses')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking quiz completion:', error);
      throw error;
    }
  }

  // Save quiz responses
  static async saveQuizResponses(userId: string, responses: any[]) {
    try {
      const { error } = await supabase
        .from('user_quiz_responses')
        .upsert(responses, { onConflict: 'user_id,question_id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving quiz responses:', error);
      throw error;
    }
  }

  // Get quiz questions
  static async getQuizQuestions(gender: string) {
    try {
      const { data, error } = await supabase
        .from('style_quiz_questions')
        .select('*')
        .eq('gender', gender)
        .eq('is_active', true)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting quiz questions:', error);
      throw error;
    }
  }

  // Get commission rates
  static async getCommissionRates() {
    try {
      const { data, error } = await supabase
        .from('vendor_commissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting commission rates:', error);
      throw error;
    }
  }

  // Get user subscription
  static async getUserSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  // Get vendor subscription
  static async getVendorSubscription(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting vendor subscription:', error);
      throw error;
    }
  }
} 
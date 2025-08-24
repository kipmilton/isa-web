import { supabase } from "@/integrations/supabase/client";

export interface CommissionInfo {
  rate: number;
  plan: 'freemium' | 'premium';
  category_path: string;
  estimated_earnings: number;
  vendor_earnings: number; // Amount vendor will receive after commission
  isa_commission: number; // Amount ISA will take as commission
}

export class CommissionService {
  // Get vendor's current subscription plan
  static async getVendorSubscriptionPlan(vendorId: string): Promise<'freemium' | 'premium_weekly' | 'premium_monthly' | 'premium_yearly' | 'pro'> {
    try {
      const { data, error } = await supabase
        .from('vendor_subscriptions')
        .select('plan_type')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return 'freemium'; // Default to freemium if no active subscription
      }

      return data.plan_type as 'freemium' | 'premium_weekly' | 'premium_monthly' | 'premium_yearly' | 'pro';
    } catch (error) {
      console.error('Error getting vendor subscription plan:', error);
      return 'freemium';
    }
  }

  // Get commission rate for a specific category and vendor
  static async getCommissionRate(vendorId: string, categoryPath: string): Promise<number> {
    try {
      const plan = await this.getVendorSubscriptionPlan(vendorId);
      
      const { data, error } = await supabase
        .from('vendor_commissions')
        .select('freemium_commission_rate, premium_commission_rate')
        .eq('category_path', categoryPath)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        // Return default rates if no specific rate found
        return plan !== 'freemium' ? 5.0 : 10.0;
      }

      return plan !== 'freemium' ? data.premium_commission_rate : data.freemium_commission_rate;
    } catch (error) {
      console.error('Error getting commission rate:', error);
      const plan = await this.getVendorSubscriptionPlan(vendorId);
      return plan !== 'freemium' ? 5.0 : 10.0;
    }
  }

  // Get commission information for a product
  static async getCommissionInfo(vendorId: string, categoryPath: string, price: number): Promise<CommissionInfo> {
    try {
      const plan = await this.getVendorSubscriptionPlan(vendorId);
      const rate = await this.getCommissionRate(vendorId, categoryPath);
      const isa_commission = (price * rate) / 100;
      const vendor_earnings = price - isa_commission;

      return {
        rate,
        plan,
        category_path: categoryPath,
        estimated_earnings: isa_commission, // Keep for backward compatibility
        vendor_earnings,
        isa_commission
      };
    } catch (error) {
      console.error('Error getting commission info:', error);
      const rate = 10.0;
      const isa_commission = (price * rate) / 100;
      const vendor_earnings = price - isa_commission;
      
      return {
        rate,
        plan: 'freemium',
        category_path: categoryPath,
        estimated_earnings: isa_commission,
        vendor_earnings,
        isa_commission
      };
    }
  }

  // Get all commission rates for a vendor (for display purposes)
  static async getAllCommissionRates(vendorId: string) {
    try {
      const plan = await this.getVendorSubscriptionPlan(vendorId);
      
      const { data, error } = await supabase
        .from('vendor_commissions')
        .select('*')
        .eq('is_active', true)
        .order('main_category', { ascending: true })
        .order('subcategory', { ascending: true });

      if (error) throw error;

      return data?.map(rate => ({
        ...rate,
        current_rate: plan === 'premium' ? rate.premium_commission_rate : rate.freemium_commission_rate,
        plan
      })) || [];
    } catch (error) {
      console.error('Error getting all commission rates:', error);
      return [];
    }
  }

  // Build category path from category selections
  static buildCategoryPath(mainCategory: string, subcategory?: string, subSubcategory?: string): string {
    const parts = [mainCategory];
    if (subcategory) parts.push(subcategory);
    if (subSubcategory) parts.push(subSubcategory);
    return parts.join('/');
  }

  // Get commission rates grouped by main category
  static async getCommissionRatesByCategory(vendorId: string) {
    try {
      const rates = await this.getAllCommissionRates(vendorId);
      const grouped = rates.reduce((acc, rate) => {
        if (!acc[rate.main_category]) {
          acc[rate.main_category] = [];
        }
        acc[rate.main_category].push(rate);
        return acc;
      }, {} as Record<string, any[]>);

      return grouped;
    } catch (error) {
      console.error('Error getting commission rates by category:', error);
      return {};
    }
  }
}

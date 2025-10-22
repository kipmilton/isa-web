import { supabase } from "@/integrations/supabase/client";

export interface DeliveryCostCalculation {
  baseCost: number;
  countyCost: number;
  constituencyCost: number;
  wardCost: number;
  totalCost: number;
  breakdown: {
    base: number;
    county: number;
    constituency: number;
    ward: number;
  };
}

export interface LocationInfo {
  county: string;
  constituency?: string;
  ward?: string;
}

export class DeliveryCostService {
  /**
   * Calculate delivery cost between two locations
   * Formula: Total Cost = Base Cost + County Cost + Constituency Cost + Ward Cost
   */
  static async calculateDeliveryCost(
    fromLocation: LocationInfo,
    toLocation: LocationInfo
  ): Promise<DeliveryCostCalculation> {
    try {
      // Get base cost
      const { data: baseCostData } = await supabase
        .from('delivery_base_cost')
        .select('base_cost')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      const baseCost = baseCostData?.[0]?.base_cost || 200;

      // Get county IDs
      const { data: fromCounty } = await supabase
        .from('counties')
        .select('id')
        .eq('name', fromLocation.county)
        .single();

      const { data: toCounty } = await supabase
        .from('counties')
        .select('id')
        .eq('name', toLocation.county)
        .single();

      let countyCost = 0;
      if (fromCounty?.id && toCounty?.id && fromCounty.id !== toCounty.id) {
        const { data: countyCostData } = await supabase
          .from('delivery_county_costs')
          .select('cost')
          .eq('from_county_id', fromCounty.id)
          .eq('to_county_id', toCounty.id)
          .eq('is_active', true)
          .single();

        countyCost = countyCostData?.cost || 0;
      }

      let constituencyCost = 0;
      if (fromLocation.constituency && toLocation.constituency && 
          fromLocation.county === toLocation.county) {
        // Get constituency IDs
        const { data: fromConstituency } = await supabase
          .from('constituencies')
          .select('id')
          .eq('name', fromLocation.constituency)
          .eq('county_id', fromCounty?.id)
          .single();

        const { data: toConstituency } = await supabase
          .from('constituencies')
          .select('id')
          .eq('name', toLocation.constituency)
          .eq('county_id', toCounty?.id)
          .single();

        if (fromConstituency?.id && toConstituency?.id && fromConstituency.id !== toConstituency.id) {
          const { data: constituencyCostData } = await supabase
            .from('delivery_constituency_costs')
            .select('cost')
            .eq('from_constituency_id', fromConstituency.id)
            .eq('to_constituency_id', toConstituency.id)
            .eq('is_active', true)
            .single();

          constituencyCost = constituencyCostData?.cost || 0;
        }
      }

      let wardCost = 0;
      if (fromLocation.ward && toLocation.ward && 
          fromLocation.constituency === toLocation.constituency) {
        // Get ward IDs
        const { data: fromWard } = await supabase
          .from('wards')
          .select('id')
          .eq('name', fromLocation.ward)
          .eq('constituency_id', fromConstituency?.id)
          .single();

        const { data: toWard } = await supabase
          .from('wards')
          .select('id')
          .eq('name', toLocation.ward)
          .eq('constituency_id', toConstituency?.id)
          .single();

        if (fromWard?.id && toWard?.id && fromWard.id !== toWard.id) {
          const { data: wardCostData } = await supabase
            .from('delivery_ward_costs')
            .select('cost')
            .eq('from_ward_id', fromWard.id)
            .eq('to_ward_id', toWard.id)
            .eq('is_active', true)
            .single();

          wardCost = wardCostData?.cost || 0;
        }
      }

      const totalCost = baseCost + countyCost + constituencyCost + wardCost;

      return {
        baseCost,
        countyCost,
        constituencyCost,
        wardCost,
        totalCost,
        breakdown: {
          base: baseCost,
          county: countyCost,
          constituency: constituencyCost,
          ward: wardCost
        }
      };
    } catch (error) {
      console.error('Error calculating delivery cost:', error);
      // Return default cost if calculation fails
      return {
        baseCost: 200,
        countyCost: 0,
        constituencyCost: 0,
        wardCost: 0,
        totalCost: 200,
        breakdown: {
          base: 200,
          county: 0,
          constituency: 0,
          ward: 0
        }
      };
    }
  }

  /**
   * Calculate delivery cost for a product to a customer location
   */
  static async calculateProductDeliveryCost(
    productId: string,
    customerLocation: LocationInfo
  ): Promise<DeliveryCostCalculation | null> {
    try {
      // Get product pickup location
      const { data: product } = await supabase
        .from('products')
        .select('pickup_county, pickup_constituency, pickup_ward')
        .eq('id', productId)
        .single();

      if (!product) {
        return null;
      }

      const pickupLocation: LocationInfo = {
        county: product.pickup_county || '',
        constituency: product.pickup_constituency || undefined,
        ward: product.pickup_ward || undefined
      };

      return await this.calculateDeliveryCost(pickupLocation, customerLocation);
    } catch (error) {
      console.error('Error calculating product delivery cost:', error);
      return null;
    }
  }

  /**
   * Get all counties for location selection
   */
  static async getCounties(): Promise<Array<{id: string, name: string, is_hotspot: boolean}>> {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('id, name, is_hotspot')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching counties:', error);
      return [];
    }
  }

  /**
   * Get constituencies for a specific county
   */
  static async getConstituencies(countyId: string): Promise<Array<{id: string, name: string}>> {
    try {
      const { data, error } = await supabase
        .from('constituencies')
        .select('id, name')
        .eq('county_id', countyId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      return [];
    }
  }

  /**
   * Get wards for a specific constituency
   */
  static async getWards(constituencyId: string): Promise<Array<{id: string, name: string}>> {
    try {
      const { data, error } = await supabase
        .from('wards')
        .select('id, name')
        .eq('constituency_id', constituencyId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wards:', error);
      return [];
    }
  }

  /**
   * Calculate delivery costs for multiple products, grouping by vendor
   * Only charges delivery fee once per vendor
   */
  static async calculateVendorGroupedDeliveryCosts(
    cartItems: Array<{ product: { id: string; vendor_id?: string; name: string } }>,
    customerLocation: LocationInfo
  ): Promise<{
    vendorGroups: Array<{
      vendorId: string;
      vendorName?: string;
      products: Array<{ product: { id: string; name: string } }>;
      deliveryCost: DeliveryCostCalculation;
    }>;
    totalDeliveryCost: number;
  }> {
    try {
      // Group cart items by vendor
      const vendorGroups = new Map<string, Array<{ product: { id: string; name: string } }>>();
      
      for (const item of cartItems) {
        const vendorId = item.product.vendor_id || 'unknown';
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, []);
        }
        vendorGroups.get(vendorId)!.push(item);
      }

      // Calculate delivery cost for each vendor group
      const vendorDeliveryCosts = await Promise.all(
        Array.from(vendorGroups.entries()).map(async ([vendorId, products]) => {
          // Use the first product from the vendor to calculate delivery cost
          const firstProduct = products[0];
          const deliveryCost = await this.calculateProductDeliveryCost(
            firstProduct.product.id,
            customerLocation
          );

          // Get vendor name if available
          let vendorName: string | undefined;
          if (vendorId !== 'unknown') {
            try {
              const { data: vendor } = await supabase
                .from('profiles')
                .select('first_name, last_name, vendor_serial_number')
                .eq('id', vendorId)
                .single();
              
              if (vendor) {
                vendorName = vendor.vendor_serial_number || 
                  `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() || 
                  'Vendor';
              }
            } catch (error) {
              console.error('Error fetching vendor name:', error);
            }
          }

          return {
            vendorId,
            vendorName: vendorName || 'Unknown Vendor',
            products,
            deliveryCost: deliveryCost || {
              baseCost: 200,
              countyCost: 0,
              constituencyCost: 0,
              wardCost: 0,
              totalCost: 200,
              breakdown: { base: 200, county: 0, constituency: 0, ward: 0 }
            }
          };
        })
      );

      const totalDeliveryCost = vendorDeliveryCosts.reduce(
        (sum, group) => sum + group.deliveryCost.totalCost, 
        0
      );

      return {
        vendorGroups: vendorDeliveryCosts,
        totalDeliveryCost
      };
    } catch (error) {
      console.error('Error calculating vendor grouped delivery costs:', error);
      // Return fallback structure
      return {
        vendorGroups: [],
        totalDeliveryCost: 0
      };
    }
  }

  /**
   * Format delivery cost for display
   */
  static formatDeliveryCost(cost: DeliveryCostCalculation): string {
    return `Ksh ${cost.totalCost.toFixed(0)}`;
  }

  /**
   * Get delivery cost breakdown for display
   */
  static getDeliveryCostBreakdown(cost: DeliveryCostCalculation): string {
    const parts = [];
    
    if (cost.breakdown.base > 0) {
      parts.push(`Base: Ksh ${cost.breakdown.base}`);
    }
    if (cost.breakdown.county > 0) {
      parts.push(`County: Ksh ${cost.breakdown.county}`);
    }
    if (cost.breakdown.constituency > 0) {
      parts.push(`Constituency: Ksh ${cost.breakdown.constituency}`);
    }
    if (cost.breakdown.ward > 0) {
      parts.push(`Ward: Ksh ${cost.breakdown.ward}`);
    }

    return parts.join(' + ');
  }
}

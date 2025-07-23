export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  county: string;
}

export interface DeliveryItem {
  weight: number;
  quantity: number;
  isFragile: boolean;
}

export interface DeliveryFeeRequest {
  pickupLocation: DeliveryLocation;
  deliveryLocation: DeliveryLocation;
  items: DeliveryItem[];
  deliveryType: 'standard' | 'express';
}

export interface DeliveryFeeResponse {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  fragileFee: number;
  totalFee: number;
  distance: number;
  estimatedDeliveryTime: string;
}

export class DeliveryFeeService {
  static async calculateDeliveryFee(request: DeliveryFeeRequest): Promise<DeliveryFeeResponse> {
    // Simulate delivery fee calculation
    const baseFee = 200;
    const distance = Math.random() * 20 + 5; // 5-25km
    const distanceFee = distance * 10;
    const totalWeight = request.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const weightFee = totalWeight * 50;
    const fragileFee = request.items.some(item => item.isFragile) ? 100 : 0;
    
    return {
      baseFee,
      distanceFee,
      weightFee,
      fragileFee,
      totalFee: baseFee + distanceFee + weightFee + fragileFee,
      distance: Math.round(distance * 10) / 10,
      estimatedDeliveryTime: request.deliveryType === 'express' ? '2-4 hours' : '1-2 days'
    };
  }
}
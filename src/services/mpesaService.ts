export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  orderId: string;
  description: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export class MpesaService {
  static async initiatePayment(request: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
    // Simulate M-Pesa payment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Payment request sent to ${request.phoneNumber}. Please complete on your phone.`,
      transactionId: `MP${Date.now()}`
    };
  }
}
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, CreditCard, Check, MapPin, Download, Lock, Truck, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderService } from '@/services/orderService';
import { MpesaService } from '@/services/mpesaService';
// import { AirtelMoneyService } from '@/services/airtelMoneyService'; // Uncomment if you have this service
import { CartItemWithProduct, Address, PaymentMethod, DeliveryDetails } from '@/types/order';
import { Product } from '@/types/product';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  cartItems: CartItemWithProduct[];
  onOrderComplete: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  user,
  cartItems,
  onOrderComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [currentStep, setCurrentStep] = useState<'delivery' | 'payment' | 'pay' | 'complete'>('delivery');

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
    whatsapp: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'airtel_money'>('mpesa');
  const [mobileNumber, setMobileNumber] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = 500; // Fixed delivery fee
  const totalAmount = subtotal + deliveryFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };


  const handleNextStep = () => {
    if (currentStep === 'delivery') {
      if (!contactInfo.email || !contactInfo.phone || !contactInfo.whatsapp) {
        toast({ title: 'Missing Information', description: 'Please provide your email, phone number and WhatsApp number.', variant: 'destructive' });
        return;
      }
      if (!deliveryAddress.trim()) {
        toast({ title: 'Missing Information', description: 'Please enter your delivery address.', variant: 'destructive' });
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('pay');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'payment') setCurrentStep('delivery');
    else if (currentStep === 'pay') setCurrentStep('payment');
  };

  const handlePayment = async () => {
    if (!mobileNumber) {
      toast({ title: 'Missing Information', description: 'Please enter your mobile number.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      // Create order first
      const order = await OrderService.createOrder(user.id, {
        items: cartItems.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        shipping_address: {
          street: deliveryAddress,
          city: 'Nairobi',
          state: 'Nairobi',
          zip: '',
          country: 'Kenya'
        },
        billing_address: {
          street: deliveryAddress,
          city: 'Nairobi',
          state: 'Nairobi',
          zip: '',
          country: 'Kenya'
        },
        customer_email: contactInfo.email,
        customer_phone: contactInfo.phone,
        notes: `ISA Delivery - WhatsApp: ${contactInfo.whatsapp}\nDelivery Address: ${deliveryAddress}\n${notes}`,
        payment_method: paymentMethod,
        delivery_type: 'delivery',
        delivery_location_lat: null,
        delivery_location_lng: null,
        delivery_location_address: deliveryAddress,
        delivery_fee: deliveryFee
      });
      let paymentResponse;
      if (paymentMethod === 'mpesa') {
        paymentResponse = await MpesaService.initiatePayment({
          phoneNumber: mobileNumber,
          amount: totalAmount,
          orderId: order.id,
          description: `ISA Order #${order.order_number}`
        });
      } else if (paymentMethod === 'airtel_money') {
        // paymentResponse = await AirtelMoneyService.initiatePayment({ ... });
        paymentResponse = { success: true, message: 'Airtel Money payment simulated.' };
      }
      if (paymentResponse.success) {
        setOrderNumber(order.order_number);
        setCurrentStep('complete');
        onOrderComplete();
        toast({ title: 'Payment Request Sent!', description: paymentResponse.message });
      } else {
        throw new Error(paymentResponse.message);
      }
    } catch (error: any) {
      toast({ title: 'Payment Failed', description: error instanceof Error ? error.message : 'Payment failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReceipt = () => {
    const receiptContent = `Order Receipt\nOrder #: ${orderNumber}\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${contactInfo.email}\nPhone: ${contactInfo.phone}\nWhatsApp: ${contactInfo.whatsapp}\n\nItems:\n${cartItems.map(item => `${item.product.name} x${item.quantity} - ${formatPrice(item.product.price * item.quantity)}`).join('\n')}\n\nSubtotal: ${formatPrice(subtotal)}\nDelivery Fee: ${formatPrice(deliveryFee)}\nTotal: ${formatPrice(totalAmount)}\n\nDelivery Address: ${deliveryAddress}\nDelivery Method: ISA Delivery\nPayment Method: ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}\n    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  if (currentStep === 'complete') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Order #{orderNumber}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your order will be delivered to your address.</p>
            <div className="space-y-2">
              <Button onClick={downloadReceipt} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button onClick={onClose} className="w-full">Continue Shopping</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative border-b border-gray-200 dark:border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</CardTitle>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'delivery' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
            <div className={`flex-1 h-1 ${currentStep === 'payment' || currentStep === 'pay' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'payment' || currentStep === 'pay' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            <div className={`flex-1 h-1 ${currentStep === 'pay' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'pay' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {currentStep === 'delivery' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Delivery Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deliveryAddress">Where do you want the item to be delivered to? (include WhatsApp number a delivery guy may contact you with for location)</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Please provide detailed delivery address (e.g., 3KM off Limuru Road, near Shell Petrol Station, blue gate house)"
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 min-h-[100px]"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsappNumber">WhatsApp Number for Delivery Contact</Label>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      value={contactInfo.whatsapp}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="Enter WhatsApp number (e.g., +254712345678)"
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                      required
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Delivery personnel will contact you on this number for location details
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryNotes">Additional Comments for Delivery</Label>
                    <Textarea
                      id="deliveryNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information to help the delivery person find you (landmarks, building details, etc.)"
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Fee</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Standard Delivery:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFee)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estimated delivery: 1-2 business days</p>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={contactInfo.email} onChange={e => setContactInfo(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={contactInfo.phone} onChange={e => setContactInfo(prev => ({ ...prev, phone: e.target.value }))} placeholder="+254700000000" className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600" />
                  </div>
                </div>
              </div>
            </>
          )}
          {currentStep === 'payment' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </h3>
                <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as 'mpesa' | 'airtel_money')}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
                <div className="space-y-2 bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{item.product.name} x {item.quantity}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Delivery Fee:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions or notes..." className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600" rows={3} />
              </div>
            </>
          )}
          {currentStep === 'pay' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  {paymentMethod === 'mpesa' ? 'M-Pesa Payment' : 'Airtel Money Payment'}
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    You will receive a {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} prompt on your phone to complete the payment of {formatPrice(totalAmount)}.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mobile_number">{paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} Phone Number</Label>
                    <Input id="mobile_number" type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="254700000000" className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter your {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} registered phone number. You will receive a payment prompt on your phone.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="flex justify-between gap-2">
            {currentStep !== 'delivery' && (
              <Button onClick={handleBackStep} variant="outline">Back</Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button onClick={onClose} variant="outline">Cancel</Button>
              {currentStep === 'delivery' && (
                <Button onClick={handleNextStep}>Continue to Payment</Button>
              )}
              {currentStep === 'payment' && (
                <Button onClick={handleNextStep}>Continue to {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}</Button>
              )}
              {currentStep === 'pay' && (
                <Button onClick={handlePayment} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                  {isProcessing ? 'Processing...' : `Pay ${formatPrice(totalAmount)}`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutModal; 
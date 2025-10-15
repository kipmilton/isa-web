import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Check, Download, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderService } from '@/services/orderService';
import IsaPayModal from '@/components/payments/IsaPayModal';
// import { AirtelMoneyService } from '@/services/airtelMoneyService'; // Uncomment if you have this service
import { CartItemWithProduct, Address, PaymentMethod, DeliveryDetails } from '@/types/order';
import { Product } from '@/types/product';
import { useUISound } from '@/contexts/SoundContext';

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
  const [currentStep, setCurrentStep] = useState<'delivery' | 'pay' | 'complete'>('delivery');

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
    whatsapp: ''
  });
  const [showIsaPay, setShowIsaPay] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const playCheckoutSuccess = useUISound('checkout_success');

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
      setCurrentStep('pay');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'pay') setCurrentStep('delivery');
  };

  const createOrder = async () => {
    return OrderService.createOrder(user.id, {
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
        notes: `MyPlug Delivery - WhatsApp: ${contactInfo.whatsapp}\nDelivery Address: ${deliveryAddress}\n${notes}`,
        payment_method: 'isa_pay',
        delivery_type: 'delivery',
        delivery_location_lat: null,
        delivery_location_lng: null,
        delivery_location_address: deliveryAddress,
        delivery_fee: deliveryFee
      });
  };

  const handlePayWithIsa = async () => {
    try {
      const order = await createOrder();
      setOrderNumber(order.order_number);
      setShowIsaPay(true);
    } catch (error: any) {
      toast({ title: 'Order Failed', description: error?.message ?? 'Unable to create order', variant: 'destructive' });
    }
  };

  const downloadReceipt = () => {
    const receiptContent = `Order Receipt\nOrder #: ${orderNumber}\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${contactInfo.email}\nPhone: ${contactInfo.phone}\nWhatsApp: ${contactInfo.whatsapp}\n\nItems:\n${cartItems.map(item => `${item.product.name} x${item.quantity} - ${formatPrice(item.product.price * item.quantity)}`).join('\n')}\n\nSubtotal: ${formatPrice(subtotal)}\nDelivery Fee: ${formatPrice(deliveryFee)}\nTotal: ${formatPrice(totalAmount)}\n\nDelivery Address: ${deliveryAddress}\nDelivery Method: MyPlug Delivery\nPayment Method: MyPlug Pay\n    `;
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
            <div className={`flex-1 h-1 ${currentStep === 'pay' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'pay' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
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
                    <Label htmlFor="deliveryAddress">Where do you want the item to be delivered to?</Label>
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
                      Delivery personnel may contact you on this number for location details
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryNotes">Additional Comments/special requests for Delivery</Label>
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
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Fee(Our delivery team will negotiate this amount with you.)</h4>
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
          
          {currentStep === 'pay' && (
            <>
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
                <div className="mt-4">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions or notes..." className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600" rows={3} />
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
                <Button onClick={handleNextStep}>Review & Pay</Button>
              )}
              {currentStep === 'pay' && (
                <Button onClick={handlePayWithIsa} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                  {isProcessing ? 'Processing...' : `Pay with MyPlug Pay (${formatPrice(totalAmount)})`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {showIsaPay && (
        <IsaPayModal
          open={showIsaPay}
          onOpenChange={setShowIsaPay}
          userId={user.id}
          amount={totalAmount}
          currency={'KES'}
          orderId={orderNumber}
          description={`MyPlug Order #${orderNumber}`}
          onSuccess={() => {
            setCurrentStep('complete');
            onOrderComplete();
            try { playCheckoutSuccess(); } catch {}
          }}
        />
      )}
    </div>
  );
};

export default CheckoutModal; 
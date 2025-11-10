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
import { DeliveryCostService, DeliveryCostCalculation } from '@/services/deliveryCostService';
import PesaPalPayment from '@/components/payments/PesaPalPayment';
import LocationSelect from '@/components/auth/LocationSelect';
import { CartItemWithProduct } from '@/types/order';
import { useUISound } from '@/contexts/SoundContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [showPesaPal, setShowPesaPal] = useState(false);
  const [notes, setNotes] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState({ county: '', constituency: '', ward: '' });
  const [deliveryCosts, setDeliveryCosts] = useState<DeliveryCostCalculation[]>([]);
  const [vendorDeliveryGroups, setVendorDeliveryGroups] = useState<Array<{
    vendorId: string;
    vendorName?: string;
    products: Array<{ product: { id: string; name: string } }>;
    deliveryCost: DeliveryCostCalculation;
  }>>([]);
  const [totalDeliveryCost, setTotalDeliveryCost] = useState(0);
  const [deliveryCostLoading, setDeliveryCostLoading] = useState(false);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const { toast } = useToast();
  const playCheckoutSuccess = useUISound('checkout_success');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = totalDeliveryCost || 500;
  const totalAmount = subtotal + deliveryFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    if (user) {
      fetchCustomerLocation();
    }
  }, [user]);

  useEffect(() => {
    if (deliveryLocation.county && cartItems.length > 0) {
      calculateDeliveryCosts();
    }
  }, [deliveryLocation, cartItems]);

  const fetchCustomerLocation = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setDeliveryLocation({
          county: (profile as any).county || '',
          constituency: (profile as any).constituency || '',
          ward: (profile as any).ward || ''
        });
      }
    } catch (error) {
      console.error('Error fetching customer location:', error);
    }
  };

  const calculateDeliveryCosts = async () => {
    if (!deliveryLocation.county || cartItems.length === 0) return;

    setDeliveryCostLoading(true);
    try {
      const result = await DeliveryCostService.calculateVendorGroupedDeliveryCosts(
        cartItems,
        deliveryLocation
      );

      setVendorDeliveryGroups(result.vendorGroups);
      setTotalDeliveryCost(result.totalDeliveryCost);

      const allCosts = result.vendorGroups.map(group => group.deliveryCost);
      setDeliveryCosts(allCosts);
    } catch (error) {
      console.error('Error calculating delivery costs:', error);
    } finally {
      setDeliveryCostLoading(false);
    }
  };

  const handleLocationChange = (county: string, constituency: string, ward?: string) => {
    setDeliveryLocation({ county, constituency, ward: ward || '' });
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
        notes: `MyPlug Delivery - WhatsApp: ${contactInfo.whatsapp}\nDelivery Address: ${deliveryAddress}\n${isGift ? 'This is a gift order' : ''}\n${notes}`,
        payment_method: 'pesapal',
        delivery_type: 'delivery',
        delivery_location_lat: null,
        delivery_location_lng: null,
        delivery_location_address: deliveryAddress,
        delivery_fee: deliveryFee,
        is_gift: isGift
      });
  };

  const handlePayWithPesaPal = async () => {
    try {
      const order = await createOrder();
      setOrderNumber(order.order_number);
      setShowPesaPal(true);
    } catch (error: any) {
      toast({ title: 'Order Failed', description: error?.message ?? 'Unable to create order', variant: 'destructive' });
    }
  };

  const handlePaymentSuccess = async (tx: { transaction_id: string; provider: string }) => {
    playCheckoutSuccess();
    setCurrentStep('complete');
    setShowPesaPal(false);
    onOrderComplete();
  };

  const handlePaymentFailure = () => {
    toast({ 
      title: 'Payment Failed', 
      description: 'Please try again or contact support', 
      variant: 'destructive' 
    });
  };

  const downloadReceipt = () => {
    const receiptContent = `Order Receipt\nOrder #: ${orderNumber}\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${contactInfo.email}\nPhone: ${contactInfo.phone}\nWhatsApp: ${contactInfo.whatsapp}\n\nItems:\n${cartItems.map(item => `${item.product.name} x${item.quantity} - ${formatPrice(item.product.price * item.quantity)}`).join('\n')}\n\nSubtotal: ${formatPrice(subtotal)}\nDelivery Fee: ${formatPrice(deliveryFee)}\nTotal: ${formatPrice(totalAmount)}\n\nDelivery Address: ${deliveryAddress}\nDelivery Method: MyPlug Delivery\nPayment Method: PesaPal\n    `;
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
                    <div className="flex items-center justify-between mb-2">
                      <Label>Delivery Location</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLocationEdit(!showLocationEdit)}
                      >
                        {showLocationEdit ? 'Cancel' : 'Edit Location'}
                      </Button>
                    </div>
                    
                    {showLocationEdit ? (
                      <LocationSelect 
                        onLocationChange={handleLocationChange} 
                        required 
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-md">
                        <p className="text-sm">
                          {deliveryLocation.county}
                          {deliveryLocation.constituency && `, ${deliveryLocation.constituency}`}
                          {deliveryLocation.ward && `, ${deliveryLocation.ward}`}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Confirm your delivery location for accurate cost calculation
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress">Detailed Delivery Address</Label>
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

                  <div className="flex items-center space-x-2 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="isGift"
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <Label htmlFor="isGift" className="text-sm font-medium cursor-pointer">
                      This is a gift 🎁
                    </Label>
                  </div>
                </div>

                {/* Delivery Cost Display */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Delivery Costs</h4>
                  
                  {deliveryCostLoading ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Calculating delivery costs...</p>
                    </div>
                  ) : vendorDeliveryGroups.length > 0 ? (
                    <div className="space-y-3">
                      {vendorDeliveryGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="bg-white dark:bg-slate-600 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {group.vendorName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {group.products.length} product{group.products.length > 1 ? 's' : ''} • 
                                {DeliveryCostService.getDeliveryCostBreakdown(group.deliveryCost)}
                              </p>
                            </div>
                            <span className="font-semibold text-green-600">
                              {DeliveryCostService.formatDeliveryCost(group.deliveryCost)}
                            </span>
                          </div>
                          <div className="ml-2 space-y-1">
                            {group.products.map((item, itemIndex) => (
                              <p key={itemIndex} className="text-xs text-gray-600 dark:text-gray-300">
                                • {item.product.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-t">
                        <span className="font-semibold text-gray-900 dark:text-white">Total Delivery Cost:</span>
                        <span className="font-bold text-blue-600 text-lg">
                          {DeliveryCostService.formatDeliveryCost({ totalCost: totalDeliveryCost } as DeliveryCostCalculation)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <strong>Delivery Method:</strong> MyPlug Delivery - Your items will be delivered within 2-3 business days
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-3">
                      Select a delivery location to calculate costs
                    </div>
                  )}
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
                <Button onClick={handlePayWithPesaPal} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                  {isProcessing ? 'Processing...' : `Pay Securely (${formatPrice(totalAmount)})`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {showPesaPal && (
        <PesaPalPayment
          open={showPesaPal}
          onOpenChange={setShowPesaPal}
          userId={user.id}
          amount={totalAmount}
          currency={'KES'}
          orderId={orderNumber}
          description={`Order ${orderNumber}`}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </div>
  );
};

export default CheckoutModal;

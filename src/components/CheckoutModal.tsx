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
import { DeliveryFeeService, DeliveryLocation } from '@/services/deliveryFeeService';
import { MpesaService } from '@/services/mpesaService';
// import { AirtelMoneyService } from '@/services/airtelMoneyService'; // Uncomment if you have this service
import { CartItemWithProduct, Address, PaymentMethod, DeliveryDetails } from '@/types/order';
import { Product } from '@/types/product';
import LocationPicker from './LocationPicker';

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

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [deliveryLocation, setDeliveryLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    county?: string;
  } | null>(null);
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'airtel_money'>('mpesa');
  const [mobileNumber, setMobileNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(0);
  const [isCalculatingDeliveryFee, setIsCalculatingDeliveryFee] = useState(false);
  const [deliveryFeeDetails, setDeliveryFeeDetails] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (deliveryType === 'delivery' && deliveryLocation) {
      calculateDeliveryFeeForLocation();
    } else {
      setCalculatedDeliveryFee(0);
      setDeliveryFeeDetails(null);
    }
  }, [deliveryType, deliveryLocation]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = calculatedDeliveryFee;
  const totalAmount = subtotal + deliveryFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDeliveryFeeForLocation = async () => {
    if (!deliveryLocation) {
      setCalculatedDeliveryFee(0);
      setDeliveryFeeDetails(null);
      return;
    }
    setIsCalculatingDeliveryFee(true);
    try {
      // Get the first product's pickup location (vendor location)
      const firstProduct = cartItems[0]?.product;
      if (!firstProduct?.location_lat || !firstProduct?.location_lng) {
        setCalculatedDeliveryFee(100); // Default minimum fee
        setDeliveryFeeDetails({ distance: 0, fee: 100 });
        return;
      }

      const pickupLocation: DeliveryLocation = {
        latitude: firstProduct.location_lat,
        longitude: firstProduct.location_lng,
        address: firstProduct.location_address || 'Vendor Location',
        city: 'Nairobi',
        county: 'Nairobi'
      };
      const deliveryLocationData: DeliveryLocation = {
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        address: deliveryLocation.address,
        city: deliveryLocation.city || 'Nairobi',
        county: deliveryLocation.county || 'Nairobi'
      };
      const deliveryItems = cartItems.map(item => ({
        weight: 0.5,
        quantity: item.quantity,
        isFragile: false
      }));
      const feeResponse = await DeliveryFeeService.calculateDeliveryFee({
        pickupLocation,
        deliveryLocation,
        items: deliveryItems,
        deliveryType: 'standard'
      });
      setCalculatedDeliveryFee(feeResponse.totalFee);
      setDeliveryFeeDetails(feeResponse);
    } catch (error) {
      setCalculatedDeliveryFee(500);
      setDeliveryFeeDetails(null);
    } finally {
      setIsCalculatingDeliveryFee(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'delivery') {
      if (!contactInfo.email || !contactInfo.phone) {
        toast({ title: 'Missing Information', description: 'Please provide your email and phone number.', variant: 'destructive' });
        return;
      }
      if (deliveryType === 'delivery' && !deliveryLocation) {
        toast({ title: 'Missing Information', description: 'Please select your delivery location.', variant: 'destructive' });
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
        shipping_address: deliveryType === 'delivery' && deliveryLocation ? {
          street: deliveryLocation.address,
          city: deliveryLocation.city || 'Nairobi',
          state: deliveryLocation.county || 'Nairobi',
          zip: '',
          country: 'Kenya'
        } : {
          street: cartItems[0]?.product?.location_address || 'Vendor Location',
          city: 'Nairobi',
          state: 'Nairobi',
          zip: '',
          country: 'Kenya'
        },
        billing_address: deliveryType === 'delivery' && deliveryLocation ? {
          street: deliveryLocation.address,
          city: deliveryLocation.city || 'Nairobi',
          state: deliveryLocation.county || 'Nairobi',
          zip: '',
          country: 'Kenya'
        } : {
          street: cartItems[0]?.product?.location_address || 'Vendor Location',
          city: 'Nairobi',
          state: 'Nairobi',
          zip: '',
          country: 'Kenya'
        },
        customer_email: contactInfo.email,
        customer_phone: contactInfo.phone,
        notes: `${deliveryType === 'delivery' ? 'ISA Delivery' : 'Pickup'}\n${notes}`,
        payment_method: paymentMethod,
        delivery_type: deliveryType,
        delivery_location_lat: deliveryType === 'delivery' ? deliveryLocation?.latitude : null,
        delivery_location_lng: deliveryType === 'delivery' ? deliveryLocation?.longitude : null,
        delivery_location_address: deliveryType === 'delivery' ? deliveryLocation?.address : null,
        delivery_fee: deliveryType === 'delivery' ? calculatedDeliveryFee : 0
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
    const receiptContent = `Order Receipt\nOrder #: ${orderNumber}\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${contactInfo.email}\nPhone: ${contactInfo.phone}\n\nItems:\n${cartItems.map(item => `${item.product.name} x${item.quantity} - ${formatPrice(item.product.price * item.quantity)}`).join('\n')}\n\nSubtotal: ${formatPrice(subtotal)}\nDelivery Fee: ${formatPrice(deliveryFee)}\nTotal: ${formatPrice(totalAmount)}\n\nDelivery Method: ISA Delivery\nPayment Method: ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}\n    `;
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
                  Delivery Options
                </h3>
                
                {/* Delivery Type Selection */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">How would you like to receive your order?</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${
                        deliveryType === 'pickup' 
                          ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-200' 
                          : 'hover:shadow-md border-gray-200'
                      }`}
                      onClick={() => setDeliveryType('pickup')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Home className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Pickup</h4>
                            <p className="text-sm text-gray-600">Collect from vendor location</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all ${
                        deliveryType === 'delivery' 
                          ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-200' 
                          : 'hover:shadow-md border-gray-200'
                      }`}
                      onClick={() => setDeliveryType('delivery')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Truck className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Home Delivery</h4>
                            <p className="text-sm text-gray-600">Delivered to your location</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Location Selection */}
                {deliveryType === 'delivery' && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Where should we deliver your order?</Label>
                    <LocationPicker
                      onLocationSelect={setDeliveryLocation}
                      selectedLocation={deliveryLocation}
                      title="Delivery Location"
                      description="Choose where you want your items delivered"
                      placeholder="Search for your delivery address..."
                    />
                  </div>
                )}

                {/* Pickup Location Display */}
                {deliveryType === 'pickup' && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Pickup Location</Label>
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {cartItems[0]?.product?.location_address || 'Vendor Location'}
                            </p>
                            <p className="text-xs text-gray-600">
                              Contact vendor for pickup details
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Fee Details</h4>
                  {isCalculatingDeliveryFee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Calculating delivery fee...</span>
                    </div>
                  ) : deliveryFeeDetails ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Base Fee:</span>
                        <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFeeDetails.baseFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Distance Fee ({deliveryFeeDetails.distance}km):</span>
                        <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFeeDetails.distanceFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Weight Fee:</span>
                        <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFeeDetails.weightFee)}</span>
                      </div>
                      {deliveryFeeDetails.fragileFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Fragile Items:</span>
                          <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFeeDetails.fragileFee)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900 dark:text-white">Total Delivery Fee:</span>
                        <span className="text-gray-900 dark:text-white">{formatPrice(deliveryFeeDetails.totalFee)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Estimated delivery: {deliveryFeeDetails.estimatedDeliveryTime}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Enter your address to calculate delivery fee</p>
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
                    <span className="text-gray-900 dark:text-white">{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
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
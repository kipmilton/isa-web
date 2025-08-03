import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Upload, MapPin } from 'lucide-react';
import ImageUpload from '@/components/vendor/ImageUpload';

interface DeliverySignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeliverySignupDialog = ({ open, onOpenChange }: DeliverySignupDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    county: '',
    constituency: '',
    idCardUrl: '',
    driversLicenseUrl: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kakamega', 'Nyeri',
    'Machakos', 'Kiambu', 'Murang\'a', 'Kirinyaga', 'Embu', 'Meru', 'Isiolo', 'Marsabit',
    'Garissa', 'Wajir', 'Mandera', 'Tana River', 'Lamu', 'Taita Taveta', 'Kilifi',
    'Kwale', 'Makueni', 'Kitui', 'Kajiado', 'Narok', 'Bomet', 'Kericho', 'Nandi',
    'Uasin Gishu', 'Trans Nzoia', 'West Pokot', 'Samburu', 'Laikipia', 'Baringo',
    'Elgeyo Marakwet', 'Vihiga', 'Busia', 'Siaya', 'Homa Bay', 'Migori',
    'Kisii', 'Nyamira', 'Bungoma', 'Turkana'
  ];

  const constituencies = {
    'Nairobi': ['Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra', 'Roysambu', 'Kasarani', 'Ruaraka', 'Embakasi South', 'Embakasi North', 'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara', 'Kamukunji', 'Starehe', 'Mathare'],
    'Mombasa': ['Changamwe', 'Jomvu', 'Kisauni', 'Nyali', 'Likoni', 'Mvita'],
    'Kisumu': ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyando', 'Muhoroni', 'Nyakach'],
    'Nakuru': ['Nakuru Town East', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Kuresoi South', 'Kuresoi North', 'Subukia', 'Rongai', 'Bahati', 'Njoro', 'Molo'],
    'Eldoret': ['Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo', 'Ainabkoi'],
    'Thika': ['Thika Town', 'Juja', 'Gatundu South', 'Gatundu North', 'Ruiru', 'Githunguri', 'Kiambaa', 'Kikuyu', 'Limuru', 'Lari'],
    'Kakamega': ['Kakamega Central', 'Kakamega North', 'Kakamega South', 'Kakamega East', 'Kakamega West', 'Mumias East', 'Mumias West', 'Matungu', 'Butere', 'Khwisero', 'Shinyalu', 'Lurambi', 'Navakholo', 'Lugari', 'Likuyani', 'Malava'],
    'Nyeri': ['Nyeri Town', 'Mathira', 'Othaya', 'Mukurweini', 'Tetu', 'Kieni', 'Mukurweini'],
    'Machakos': ['Machakos Town', 'Mavoko', 'Masinga', 'Yatta', 'Kangundo', 'Matungulu', 'Kathiani', 'Mwala', 'Mbooni', 'Kaiti', 'Kibwezi West', 'Kibwezi East'],
    'Kiambu': ['Kiambu', 'Kiambaa', 'Kikuyu', 'Limuru', 'Lari', 'Githunguri', 'Juja', 'Thika Town', 'Ruiru', 'Gatundu South', 'Gatundu North', 'Kabete', 'Dagoretti North', 'Dagoretti South', 'Westlands', 'Langata', 'Kibra', 'Roysambu', 'Kasarani', 'Ruaraka', 'Embakasi South', 'Embakasi North', 'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara', 'Kamukunji', 'Starehe', 'Mathare']
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.county) newErrors.county = 'County is required';
    if (!formData.constituency) newErrors.constituency = 'Constituency is required';
    if (!formData.idCardUrl) newErrors.idCardUrl = 'ID Card is required';
    if (!formData.driversLicenseUrl) newErrors.driversLicenseUrl = 'Driver\'s License is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            user_type: 'delivery'
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Create delivery personnel profile
        const { error: deliveryError } = await supabase
          .from('delivery_personnel')
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            county: formData.county,
            constituency: formData.constituency,
            id_card_url: formData.idCardUrl,
            drivers_license_url: formData.driversLicenseUrl,
            status: 'pending'
          });

        if (deliveryError) {
          throw new Error(deliveryError.message);
        }

        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            user_type: 'delivery',
            account_setup_completed: true
          });

        if (profileError) {
          throw new Error(profileError.message);
        }

        toast({
          title: "Application Submitted!",
          description: "Your delivery personnel application has been submitted and is under review. We'll notify you once it's approved."
        });

        onOpenChange(false);
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          county: '',
          constituency: '',
          idCardUrl: '',
          driversLicenseUrl: ''
        });

        // Redirect to pending page
        window.location.href = '/delivery-pending';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (field: 'idCardUrl' | 'driversLicenseUrl', result: any) => {
    if (result.error) {
      toast({
        title: "Upload Failed",
        description: result.error,
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({ ...prev, [field]: result.url }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            Join ISA Delivery
          </DialogTitle>
          <p className="text-center text-sm text-gray-600 mt-2">
            Become a delivery partner and earn money by delivering orders
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={errors.phoneNumber ? 'border-red-500' : ''}
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="county">County</Label>
              <Select value={formData.county} onValueChange={(value) => handleInputChange('county', value)}>
                <SelectTrigger className={errors.county ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select County" />
                </SelectTrigger>
                <SelectContent>
                  {counties.map(county => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county}</p>}
            </div>
            <div>
              <Label htmlFor="constituency">Constituency</Label>
              <Select 
                value={formData.constituency} 
                onValueChange={(value) => handleInputChange('constituency', value)}
                disabled={!formData.county}
              >
                <SelectTrigger className={errors.constituency ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select Constituency" />
                </SelectTrigger>
                <SelectContent>
                  {formData.county && constituencies[formData.county as keyof typeof constituencies]?.map(constituency => (
                    <SelectItem key={constituency} value={constituency}>{constituency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.constituency && <p className="text-red-500 text-xs mt-1">{errors.constituency}</p>}
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <div>
              <Label>ID Card</Label>
              <ImageUpload
                onImageUpload={(result) => handleImageUpload('idCardUrl', result)}
                onImageRemove={() => handleInputChange('idCardUrl', '')}
                multiple={false}
                maxImages={1}
              />
              {errors.idCardUrl && <p className="text-red-500 text-xs mt-1">{errors.idCardUrl}</p>}
            </div>

            <div>
              <Label>Driver's License</Label>
              <ImageUpload
                onImageUpload={(result) => handleImageUpload('driversLicenseUrl', result)}
                onImageRemove={() => handleInputChange('driversLicenseUrl', '')}
                multiple={false}
                maxImages={1}
              />
              {errors.driversLicenseUrl && <p className="text-red-500 text-xs mt-1">{errors.driversLicenseUrl}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By submitting this application, you agree to our terms of service and privacy policy.
            Your application will be reviewed and you'll be notified of the status.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeliverySignupDialog; 
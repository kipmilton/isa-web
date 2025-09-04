import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/contexts/ConfettiContext";
import { supabase } from "@/integrations/supabase/client";
import LocationSelect from "@/components/auth/LocationSelect";
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  Upload,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  MessageCircle
} from "lucide-react";
import imageCompression from 'browser-image-compression';
import { HCaptchaComponent } from "@/components/ui/hcaptcha";

interface VendorApplicationFormProps {
  userId: string;
  onComplete: () => void;
  onProgressChange?: (progress: number) => void;
}

const VendorApplicationForm = ({ userId, onComplete, onProgressChange }: VendorApplicationFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { triggerConfetti } = useConfetti();
  const [formData, setFormData] = useState({
    accountType: '',
    heardAboutUs: '',
    otherHeardAboutUs: '',
    businessName: '',
    brandName: '',
    email: '',
    phone: '',
    businessType: '',
    otherBusinessType: '',
    description: '',
    websiteUrl: '',
    location: { county: '', constituency: '' },
    documents: {
      idCard: null as File | null,
      businessCert: null as File | null,
      pinCert: null as File | null,
      bankName: '',
      accountNumber: '',
      accountHolderName: ''
    },
    supportRequest: {
      phone: '',
      message: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { toast } = useToast();

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const [fileErrors, setFileErrors] = useState({
    idCard: '',
    businessCert: '',
    pinCert: ''
  });

  const validateFile = (file: File | null, field: string) => {
    if (!file) return '';
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, and PDF files are allowed.';
    }
    if (file.size > maxFileSize) {
      return 'File is too large. Please upload a file under 10MB.';
    }
    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    updateProgress();
  };

  const handleLocationChange = (county: string, constituency: string) => {
    setFormData(prev => ({
      ...prev,
      location: { county, constituency }
    }));
    updateProgress();
  };

  const handleDocumentUpload = async (field: string, file: File | null) => {
    let error = validateFile(file, field);
    if (!error && file && file.type.startsWith('image/')) {
      try {
        file = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
      } catch (e) {
        error = 'Image compression failed. Please try another image.';
      }
    }
    setFileErrors(prev => ({ ...prev, [field]: error }));
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: error ? null : file
      }
    }));
    updateProgress();
  };

  const updateProgress = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Step 1: Account Type (4 fields)
    totalFields += 4;
    if (formData.accountType) completedFields++;
    if (formData.heardAboutUs) completedFields++;
    if (formData.businessName) completedFields++;
    if (formData.brandName) completedFields++;

    // Step 2: Contact Details (3 fields)
    totalFields += 3;
    if (formData.email) completedFields++;
    if (formData.phone) completedFields++;
    if (formData.location.county) completedFields++;
    if (formData.location.constituency) completedFields++;

    // Step 3: Business Info (3 fields)
    totalFields += 3;
    if (formData.businessType) completedFields++;
    if (formData.description) completedFields++;
    if (formData.websiteUrl) completedFields++;

    // Step 4: Documents (4 required fields)
    totalFields += 4;
    if (formData.documents.idCard) completedFields++;
    if (formData.documents.bankName) completedFields++;
    if (formData.documents.accountNumber) completedFields++;
    if (formData.documents.accountHolderName) completedFields++;

    // Step 5: Support Request (optional - 2 fields)
    totalFields += 2;
    if (formData.supportRequest.phone) completedFields++;
    if (formData.supportRequest.message) completedFields++;

    const progress = Math.round((completedFields / totalFields) * 100);
    onProgressChange?.(progress);
  };

  const uploadDocument = async (file: File, fileName: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `vendor-documents/${userId}/${fileName}.${fileExt}`;

      // Try to upload directly first
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If bucket doesn't exist, try to create it or use a different approach
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const hcaptchaEnabled = import.meta.env.VITE_ENABLE_HCAPTCHA === 'true';
      if (hcaptchaEnabled && !captchaToken) {
        toast({ title: "Verification required", description: "Please complete the captcha verification.", variant: "destructive" });
        setLoading(false);
        return;
      }
      // Upload documents (optional - continue even if uploads fail)
      const documentUrls: Record<string, string> = {};
      let uploadWarnings: string[] = [];
      
      if (formData.documents.idCard) {
        try {
          documentUrls.idCard = await uploadDocument(formData.documents.idCard, 'id-card');
        } catch (error) {
          console.error('Failed to upload ID card:', error);
          uploadWarnings.push('ID card upload failed');
        }
      }
      
      if (formData.documents.businessCert) {
        try {
          documentUrls.businessCert = await uploadDocument(formData.documents.businessCert, 'business-cert');
        } catch (error) {
          console.error('Failed to upload business certificate:', error);
          uploadWarnings.push('Business certificate upload failed');
        }
      }
      
      if (formData.documents.pinCert) {
        try {
          documentUrls.pinCert = await uploadDocument(formData.documents.pinCert, 'pin-cert');
        } catch (error) {
          console.error('Failed to upload PIN certificate:', error);
          uploadWarnings.push('PIN certificate upload failed');
        }
      }

      // Update profile with vendor application data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.brandName.split(' ')[0] || formData.brandName,
          last_name: formData.brandName.split(' ').slice(1).join(' ') || '',
          company: formData.businessName,
          business_type: formData.businessType === 'other' ? formData.otherBusinessType : formData.businessType,
          phone_number: formData.phone,
          user_type: 'vendor',
          status: 'pending',
          location: `${formData.location.county}, ${formData.location.constituency}`
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Save application step data
      const { error: stepError } = await supabase
        .from('vendor_application_steps')
        .upsert({
          user_id: userId,
          step_name: 'application_form',
          step_data: {
            ...formData,
            captcha_token: hcaptchaEnabled ? captchaToken : null,
            documents: {
              ...documentUrls,
              bankName: formData.documents.bankName,
              accountNumber: formData.documents.accountNumber,
              accountHolderName: formData.documents.accountHolderName
            }
          },
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (stepError) {
        console.error('Step save error:', stepError);
        throw stepError;
      }

      // Submit support request if provided
      if (formData.supportRequest.phone && formData.supportRequest.message) {
        try {
          const { error: supportError } = await supabase
            .from('support_requests')
            .insert({
              user_id: userId,
              phone_number: formData.supportRequest.phone,
              message: formData.supportRequest.message,
              request_type: 'onboarding_help'
            });

          if (supportError) {
            console.error('Support request error:', supportError);
            // Don't throw error for support request - it's optional
          }
        } catch (error) {
          console.error('Error submitting support request:', error);
          // Don't throw error for support request - it's optional
        }
      }

      // Trigger confetti celebration
      triggerConfetti({
        duration: 4000,
        particleCount: 150,
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
      });

      // Show success message with any upload warnings
      if (uploadWarnings.length > 0) {
        toast({
          title: "Application Submitted with Warnings",
          description: `Your application was submitted successfully, but some documents couldn't be uploaded: ${uploadWarnings.join(', ')}. You can upload them later.`
        });
      } else {
        toast({
          title: "Application Submitted",
          description: "Your vendor application has been submitted successfully!"
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to submit application. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('Storage')) {
          errorMessage = "Failed to upload documents. Please check your files and try again.";
        } else if (error.message.includes('profile')) {
          errorMessage = "Failed to update profile information. Please try again.";
        } else if (error.message.includes('step')) {
          errorMessage = "Failed to save application progress. Please try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.accountType && formData.heardAboutUs && formData.businessName && formData.brandName;
      case 2:
        return formData.email && formData.phone && 
               formData.location.county && formData.location.constituency;
      case 3:
        return formData.businessType && formData.description && formData.websiteUrl;
      case 4:
        // Require valid files for all uploaded docs
        if (formData.accountType === 'corporate') {
          if (fileErrors.idCard || fileErrors.businessCert || fileErrors.pinCert) return false;
          if ((formData.documents.idCard && fileErrors.idCard) ||
              (formData.documents.businessCert && fileErrors.businessCert) ||
              (formData.documents.pinCert && fileErrors.pinCert)) return false;
        } else {
          if (fileErrors.idCard) return false;
          if (formData.documents.idCard && fileErrors.idCard) return false;
        }
        return formData.documents.bankName && formData.documents.accountNumber && formData.documents.accountHolderName;
      case 5:
        // Support request is optional - always allow proceeding
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Account Type Selection</h4>
                  <p className="text-sm text-blue-700">
                    Choose the account type that best describes your business structure. This helps us provide the most appropriate onboarding experience.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">Account Type *</Label>
              <RadioGroup 
                value={formData.accountType} 
                onValueChange={(value) => handleInputChange('accountType', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="text-base cursor-pointer">
                    <div className="font-medium">Individual Seller</div>
                    <div className="text-sm text-gray-600">Personal account for individual sellers</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="corporate" id="corporate" />
                  <Label htmlFor="corporate" className="text-base cursor-pointer">
                    <div className="font-medium">Corporate Seller</div>
                    <div className="text-sm text-gray-600">Registered business or brand account</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="heardAboutUs" className="text-base font-semibold text-gray-900">How did you hear about us? *</Label>
              <Select value={formData.heardAboutUs} onValueChange={(value) => handleInputChange('heardAboutUs', value)}>
                <SelectTrigger className="mt-2 h-12 text-base">
                  <SelectValue placeholder="Select how you heard about us" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isa_contact">I was contacted by ISA</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">X (Twitter)</SelectItem>
                  <SelectItem value="tv_ads">TV Ads</SelectItem>
                  <SelectItem value="friend_referral">Referred by friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.heardAboutUs === 'other' && (
              <div>
                <Label htmlFor="otherHeardAboutUs" className="text-base font-semibold text-gray-900">Please specify *</Label>
                <Input
                  id="otherHeardAboutUs"
                  value={formData.otherHeardAboutUs}
                  onChange={(e) => handleInputChange('otherHeardAboutUs', e.target.value)}
                  placeholder="e.g., LinkedIn, Google Search, etc."
                  className="mt-2 h-12 text-base"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName" className="text-base font-semibold text-gray-900">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                  className="mt-2 h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="brandName" className="text-base font-semibold text-gray-900">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => handleInputChange('brandName', e.target.value)}
                  placeholder="Enter your brand name"
                  className="mt-2 h-12 text-base"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Contact Information</h4>
                  <p className="text-sm text-blue-700">
                    Provide your contact details so we can reach you and keep you updated on your application status.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-base font-semibold text-gray-900">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-2 h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-base font-semibold text-gray-900">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+254 XXX XXX XXX"
                  className="mt-2 h-12 text-base"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-900">Business Location *</Label>
              <div className="mt-2">
                <LocationSelect 
                  onLocationChange={handleLocationChange}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Business Information</h4>
                  <p className="text-sm text-blue-700">
                    Tell us about your business, the products you sell, and what makes you unique. This helps us better understand your business and provide relevant support.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="businessType" className="text-base font-semibold text-gray-900">In what industry does your business operate? *</Label>
              <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                <SelectTrigger className="mt-2 h-12 text-base">
                  <SelectValue placeholder="Select your business industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fashion">Fashion & Clothing</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                  <SelectItem value="sports">Sports & Outdoors</SelectItem>
                  <SelectItem value="books">Books & Media</SelectItem>
                  <SelectItem value="toys">Toys & Games</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="food">Food & Beverage</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.businessType === 'other' && (
              <div>
                <Label htmlFor="otherBusinessType" className="text-base font-semibold text-gray-900">Please specify your business industry *</Label>
                <Input
                  id="otherBusinessType"
                  value={formData.otherBusinessType}
                  onChange={(e) => handleInputChange('otherBusinessType', e.target.value)}
                  placeholder="e.g., Education, Technology, etc."
                  className="mt-2 h-12 text-base"
                />
              </div>
            )}

            <div>
              <Label htmlFor="description" className="text-base font-semibold text-gray-900">Business Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about your business, products you sell, and what makes you unique..."
                rows={6}
                className="mt-2 text-base resize-none"
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl" className="text-base font-semibold text-gray-900">Website/Social Media URL *</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://your-website.com or https://instagram.com/yourbrand"
                className="mt-2 h-12 text-base"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Required Documents</h4>
                  <p className="text-sm text-blue-700">
                    Upload the following documents based on your account type. Required documents are marked with an asterisk (*).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <Label htmlFor="idCard" className="text-base font-semibold text-gray-900">National ID / Passport *</Label>
                <p className="text-sm text-gray-600 mt-1 mb-3">Required for verification</p>
                <Input
                  id="idCard"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => await handleDocumentUpload('idCard', e.target.files?.[0] || null)}
                  className="mt-2"
                />
                {fileErrors.idCard && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{fileErrors.idCard}</p>
                  </div>
                )}
              </div>

              {formData.accountType === 'corporate' && (
                <>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <Label htmlFor="businessCert" className="text-base font-semibold text-gray-900">Certificate of Incorporation</Label>
                    <p className="text-sm text-gray-600 mt-1 mb-3">You can upload this later if needed</p>
                    <Input
                      id="businessCert"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async (e) => await handleDocumentUpload('businessCert', e.target.files?.[0] || null)}
                      className="mt-2"
                    />
                    {fileErrors.businessCert && (
                      <div className="flex items-center space-x-2 mt-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">{fileErrors.businessCert}</p>
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <Label htmlFor="pinCert" className="text-base font-semibold text-gray-900">PIN/VAT Certificate</Label>
                    <p className="text-sm text-gray-600 mt-1 mb-3">You can upload this later if needed</p>
                    <Input
                      id="pinCert"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async (e) => await handleDocumentUpload('pinCert', e.target.files?.[0] || null)}
                      className="mt-2"
                    />
                    {fileErrors.pinCert && (
                      <div className="flex items-center space-x-2 mt-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">{fileErrors.pinCert}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="border border-gray-200 rounded-lg p-4">
                <Label className="text-base font-semibold text-gray-900">Bank Account Details *</Label>
                <p className="text-sm text-gray-600 mt-1 mb-3">Required for payment processing</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bankName" className="text-base font-semibold text-gray-900">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.documents.bankName}
                      onChange={(e) => handleInputChange('documents', {
                        ...formData.documents,
                        bankName: e.target.value
                      })}
                      placeholder="e.g., Equity Bank, KCB, etc."
                      className="mt-2 h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountNumber" className="text-base font-semibold text-gray-900">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.documents.accountNumber}
                      onChange={(e) => handleInputChange('documents', {
                        ...formData.documents,
                        accountNumber: e.target.value
                      })}
                      placeholder="Enter your account number"
                      className="mt-2 h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountHolderName" className="text-base font-semibold text-gray-900">Account Holder Name *</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.documents.accountHolderName}
                      onChange={(e) => handleInputChange('documents', {
                        ...formData.documents,
                        accountHolderName: e.target.value
                      })}
                      placeholder="Name as it appears on the account"
                      className="mt-2 h-12 text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Need Help?</h4>
                  <p className="text-sm text-blue-700">
                    If you need assistance with the onboarding process, please provide your contact details and message below. Our team will get back to you shortly.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="supportPhone" className="text-base font-semibold text-gray-900">Phone Number</Label>
                <Input
                  id="supportPhone"
                  value={formData.supportRequest.phone}
                  onChange={(e) => handleInputChange('supportRequest', {
                    ...formData.supportRequest,
                    phone: e.target.value
                  })}
                  placeholder="Enter your phone number for contact"
                  className="mt-2 h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="supportMessage" className="text-base font-semibold text-gray-900">Message</Label>
                <Textarea
                  id="supportMessage"
                  value={formData.supportRequest.message}
                  onChange={(e) => handleInputChange('supportRequest', {
                    ...formData.supportRequest,
                    message: e.target.value
                  })}
                  placeholder="Describe what you need help with..."
                  className="mt-2 min-h-[120px] text-base resize-none"
                  rows={5}
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Optional Step</h4>
                  <p className="text-sm text-gray-700">
                    This step is completely optional. You can skip it if you don't need assistance. Your application will be processed normally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: "Account Type", icon: User, description: "Choose your account type" },
    { number: 2, title: "Contact Details", icon: Phone, description: "Provide contact information" },
    { number: 3, title: "Business Info", icon: Building, description: "Describe your business" },
    { number: 4, title: "Documents", icon: FileText, description: "Upload required documents" },
    { number: 5, title: "Support Request", icon: MessageCircle, description: "Request help if needed" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white shadow-md' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md' 
                        : 'border-gray-300 text-gray-400 bg-white'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className={`text-sm font-semibold ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      Step {step.number}
                    </div>
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 hidden md:block">
                      {step.description}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-300 mx-2 hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {steps[currentStep - 1]?.description}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {renderStep()}

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="h-12 px-6 text-base"
            >
              Previous
            </Button>

            {currentStep === steps.length ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="bg-green-600 hover:bg-green-700 h-12 px-8 text-base font-semibold"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base font-semibold"
              >
                Next Step
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorApplicationForm;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
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
  ArrowRight
} from "lucide-react";

interface VendorApplicationFormProps {
  userId: string;
  onComplete: () => void;
  onProgressChange?: (progress: number) => void;
}

const VendorApplicationForm = ({ userId, onComplete, onProgressChange }: VendorApplicationFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    accountType: '',
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: '',
    otherBusinessType: '',
    description: '',
    location: { county: '', constituency: '' },
    documents: {
      idCard: null as File | null,
      businessCert: null as File | null,
      pinCert: null as File | null,
      bankDetails: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  const handleDocumentUpload = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
    updateProgress();
  };

  const updateProgress = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Step 1: Account Type (2 fields)
    totalFields += 2;
    if (formData.accountType) completedFields++;
    if (formData.businessName) completedFields++;
    if (formData.contactPerson) completedFields++;

    // Step 2: Contact Details (4 fields)
    totalFields += 4;
    if (formData.email) completedFields++;
    if (formData.phone) completedFields++;
    if (formData.businessType) completedFields++;
    if (formData.businessType === 'other' ? formData.otherBusinessType : true) completedFields++;
    if (formData.location.county) completedFields++;
    if (formData.location.constituency) completedFields++;

    // Step 3: Business Description (1 field)
    totalFields += 1;
    if (formData.description) completedFields++;

    // Step 4: Documents (2 required fields)
    totalFields += 2;
    if (formData.documents.idCard) completedFields++;
    if (formData.documents.bankDetails) completedFields++;

    const progress = Math.round((completedFields / totalFields) * 100);
    onProgressChange?.(progress);
  };

  const uploadDocument = async (file: File, fileName: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `vendor-documents/${userId}/${fileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload documents
      const documentUrls: Record<string, string> = {};
      
      if (formData.documents.idCard) {
        documentUrls.idCard = await uploadDocument(formData.documents.idCard, 'id-card');
      }
      
      if (formData.documents.businessCert) {
        documentUrls.businessCert = await uploadDocument(formData.documents.businessCert, 'business-cert');
      }
      
      if (formData.documents.pinCert) {
        documentUrls.pinCert = await uploadDocument(formData.documents.pinCert, 'pin-cert');
      }

      // Update profile with vendor application data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.contactPerson.split(' ')[0] || formData.contactPerson,
          last_name: formData.contactPerson.split(' ').slice(1).join(' ') || '',
          company: formData.businessName,
          business_type: formData.businessType === 'other' ? formData.otherBusinessType : formData.businessType,
          phone_number: formData.phone,
          user_type: 'vendor',
          status: 'pending',
          location: `${formData.location.county}, ${formData.location.constituency}`
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Save application step data
      const { error: stepError } = await supabase
        .from('vendor_application_steps')
        .upsert({
          user_id: userId,
          step_name: 'application_form',
          step_data: {
            ...formData,
            documents: {
              ...documentUrls,
              bankDetails: formData.documents.bankDetails
            }
          },
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (stepError) throw stepError;

      toast({
        title: "Application Submitted",
        description: "Your vendor application has been submitted successfully!"
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.accountType && formData.businessName && formData.contactPerson;
      case 2:
        return formData.email && formData.phone && formData.businessType && 
               (formData.businessType !== 'other' || formData.otherBusinessType) &&
               formData.location.county && formData.location.constituency;
      case 3:
        return formData.description;
      case 4:
        return formData.documents.idCard && formData.documents.bankDetails;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Account Type</Label>
              <RadioGroup 
                value={formData.accountType} 
                onValueChange={(value) => handleInputChange('accountType', value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual Seller (small business or single person)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="corporate" id="corporate" />
                  <Label htmlFor="corporate">Corporate Seller (registered business/brand)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business/Personal Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business or personal name"
                />
              </div>

              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="Primary contact person name"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+254 XXX XXX XXX"
              />
            </div>

            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.businessType === 'other' && (
              <div>
                <Label htmlFor="otherBusinessType">Please specify your business type</Label>
                <Input
                  id="otherBusinessType"
                  value={formData.otherBusinessType}
                  onChange={(e) => handleInputChange('otherBusinessType', e.target.value)}
                  placeholder="e.g., Food & Beverage, Health & Wellness, etc."
                />
              </div>
            )}

            <div>
              <Label className="text-base font-medium">Business Location</Label>
              <LocationSelect 
                onLocationChange={handleLocationChange}
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about your business, products you sell, and what makes you unique..."
                rows={5}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Required Documents</Label>
              <p className="text-sm text-gray-600 mt-1">
                Upload the following documents based on your account type
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="idCard">National ID / Passport *</Label>
                <Input
                  id="idCard"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentUpload('idCard', e.target.files?.[0] || null)}
                />
              </div>

              {formData.accountType === 'corporate' && (
                <>
                  <div>
                    <Label htmlFor="businessCert">Certificate of Incorporation</Label>
                    <Input
                      id="businessCert"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('businessCert', e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pinCert">PIN/VAT Certificate</Label>
                    <Input
                      id="pinCert"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('pinCert', e.target.files?.[0] || null)}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="bankDetails">Bank Account Details *</Label>
                <Textarea
                  id="bankDetails"
                  value={formData.documents.bankDetails}
                  onChange={(e) => handleInputChange('documents', {
                    ...formData.documents,
                    bankDetails: e.target.value
                  })}
                  placeholder="Bank name, account number, account holder name..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: "Account Type", icon: User },
    { number: 2, title: "Contact Details", icon: Phone },
    { number: 3, title: "Business Info", icon: Building },
    { number: 4, title: "Documents", icon: FileText }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      Step {step.number}
                    </div>
                    <div className={`text-xs ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderStep()}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep === steps.length ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorApplicationForm;
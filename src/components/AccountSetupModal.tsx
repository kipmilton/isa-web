import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useConfetti } from "@/contexts/ConfettiContext";
import { supabase } from "@/integrations/supabase/client";
import LocationSelect from "./auth/LocationSelect";


interface AccountSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

const AccountSetupModal = ({ open, onOpenChange, user }: AccountSetupModalProps) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ county: "", constituency: "", ward: "" });
  const { triggerConfetti } = useConfetti();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    whatsappNumber: "",
    county: "",
    constituency: "",
    ward: ""
  });

  useEffect(() => {
    if (user && open) {
      // Pre-fill with existing data if available
      setFormData(prev => ({
        ...prev,
        firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ""
      }));
    }
  }, [user, open]);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLocationChange = (county: string, constituency: string, ward?: string) => {
    setLocation({ county, constituency, ward: ward || "" });
    setFormData(prev => ({ ...prev, county, constituency, ward: ward || "" }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phoneNumber', 'whatsappNumber', 'county', 'constituency'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Calculate age from date of birth
      const calculatedAge = calculateAge(formData.dateOfBirth);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          age: calculatedAge,
          gender: formData.gender,
          phone_number: formData.phoneNumber,
          whatsapp_number: formData.whatsappNumber,
          county: formData.county,
          constituency: formData.constituency,
          ward: formData.ward,
          location: formData.ward 
            ? `${formData.county}, ${formData.constituency}, ${formData.ward}`
            : `${formData.county}, ${formData.constituency}`,
          account_setup_completed: true
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } else {
        // Trigger confetti celebration for account setup completion
        triggerConfetti({
          duration: 3000,
          particleCount: 100,
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#EC4899']
        });

        toast.success('Profile setup completed! You\'ll now get better personalized recommendations.');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Complete Your Profile Setup
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Help us provide you with more accurate and personalized product recommendations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="mt-1"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                required
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full p-2 border rounded-md mt-1"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="mt-1"
                placeholder="e.g., +254700000000"
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                required
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                className="mt-1"
                placeholder="e.g., +254700000000"
              />
            </div>
          </div>

          <LocationSelect onLocationChange={handleLocationChange} required />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSetupModal; 
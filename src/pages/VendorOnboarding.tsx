import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VendorApplicationForm from "@/components/vendor/VendorApplicationForm";
import VendorTraining from "@/components/vendor/VendorTraining";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, FileText, BookOpen } from "lucide-react";

const VendorOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<'application' | 'training'>('application');
  const [applicationCompleted, setApplicationCompleted] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [applicationProgress, setApplicationProgress] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndProgress();
  }, []);

  const checkUserAndProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/');
        return;
      }

      setUserId(session.user.id);

      // Check application progress
      const { data: applicationStep } = await supabase
        .from('vendor_application_steps')
        .select('is_completed')
        .eq('user_id', session.user.id)
        .eq('step_name', 'application_form')
        .single();

      if (applicationStep?.is_completed) {
        setApplicationCompleted(true);
        setCurrentStep('training');
      }

      // Check training progress
      const { data: trainingStep } = await supabase
        .from('vendor_application_steps')
        .select('is_completed')
        .eq('user_id', session.user.id)
        .eq('step_name', 'training_completed')
        .single();

      if (trainingStep?.is_completed) {
        setTrainingCompleted(true);
      }

    } catch (error) {
      console.error('Error checking user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationComplete = () => {
    setApplicationCompleted(true);
    setCurrentStep('training');
  };

  const handleTrainingComplete = () => {
    setTrainingCompleted(true);
    // Redirect to status page after training completion
    navigate('/vendor-status');
  };

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading onboarding process...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = applicationCompleted && trainingCompleted ? 100 : 
                           applicationCompleted ? 50 + (trainingProgress / 2) : 
                           currentStep === 'application' ? applicationProgress / 2 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to ISA Vendor Onboarding
          </h1>
          <p className="text-gray-600">
            Complete these steps to start selling on ISA
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  applicationCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === 'application'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 text-gray-400'
                }`}>
                  {applicationCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className={`font-medium ${
                    applicationCompleted ? 'text-green-600' : currentStep === 'application' ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step 1: Application Form
                  </div>
                  <div className="text-sm text-gray-500">
                    {applicationCompleted ? 'Completed' : 'Business information and documents'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  trainingCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === 'training'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 text-gray-400'
                }`}>
                  {trainingCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className={`font-medium ${
                    trainingCompleted ? 'text-green-600' : currentStep === 'training' ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step 2: Training Modules
                  </div>
                  <div className="text-sm text-gray-500">
                    {trainingCompleted ? 'Completed' : 'Learn about selling on ISA'}
                  </div>
                </div>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-center mt-2 text-sm text-gray-500">
              {progressPercentage}% Complete
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {currentStep === 'application' && (
          <VendorApplicationForm 
            userId={userId!} 
            onComplete={handleApplicationComplete}
            onProgressChange={(progress) => setApplicationProgress(progress)}
          />
        )}

        {currentStep === 'training' && (
          <VendorTraining 
            userId={userId!} 
            onComplete={handleTrainingComplete}
            onProgressChange={(progress) => setTrainingProgress(progress)}
          />
        )}
      </div>
    </div>
  );
};

export default VendorOnboarding;

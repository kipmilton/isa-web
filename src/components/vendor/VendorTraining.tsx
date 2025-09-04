import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/contexts/ConfettiContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  CheckCircle, 
  Play, 
  Phone, 
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  HelpCircle
} from "lucide-react";
import { HCaptchaComponent } from "@/components/ui/hcaptcha";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  content?: string;
  module_order: number;
  is_active: boolean;
}

interface TrainingProgress {
  id: string;
  module_id: string;
  is_completed: boolean;
  completed_at?: string;
}

interface VendorTrainingProps {
  userId: string;
  onComplete: () => void;
  onProgressChange?: (progress: number) => void;
}

const VendorTraining = ({ userId, onComplete, onProgressChange }: VendorTrainingProps) => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportData, setSupportData] = useState({
    phone: '',
    message: ''
  });
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    loadTrainingData();
  }, [userId]);

  const loadTrainingData = async () => {
    try {
      // Load training modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('training_modules')
        .select('*')
        .eq('is_active', true)
        .order('module_order', { ascending: true });

      if (modulesError) throw modulesError;

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      setModules(modulesData || []);
      setProgress(progressData || []);

      // Find first incomplete module
      const incompleteIndex = modulesData?.findIndex(module => 
        !progressData?.some(p => p.module_id === module.id && p.is_completed)
      ) ?? 0;
      
      setCurrentModuleIndex(incompleteIndex >= 0 ? incompleteIndex : 0);
    } catch (error) {
      console.error('Error loading training data:', error);
      toast({
        title: "Error",
        description: "Failed to load training modules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('user_training_progress')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local progress
      setProgress(prev => {
        const existing = prev.find(p => p.module_id === moduleId);
        if (existing) {
          return prev.map(p => 
            p.module_id === moduleId 
              ? { ...p, is_completed: true, completed_at: new Date().toISOString() }
              : p
          );
        } else {
          return [...prev, {
            id: `temp-${Date.now()}`,
            module_id: moduleId,
            is_completed: true,
            completed_at: new Date().toISOString()
          }];
        }
      });

      toast({
        title: "Module Completed",
        description: "Great job! You've completed this training module."
      });

      // Check if all modules are completed
      const allCompleted = modules.every(module => 
        progress.some(p => p.module_id === module.id && p.is_completed) || 
        module.id === moduleId
      );

      if (allCompleted) {
        const hcaptchaEnabled = import.meta.env.VITE_ENABLE_HCAPTCHA === 'true';
        if (hcaptchaEnabled && !captchaToken) {
          toast({ title: "Verification required", description: "Please complete the captcha before finishing training.", variant: "destructive" });
          return;
        }
        // Save training completion step
        await supabase
          .from('vendor_application_steps')
          .upsert({
            user_id: userId,
            step_name: 'training_completed',
            is_completed: true,
            completed_at: new Date().toISOString()
          });

        // Trigger confetti celebration for training completion
        triggerConfetti({
          duration: 5000,
          particleCount: 200,
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
        });

        toast({
          title: "Training Completed!",
          description: "You've completed all training modules. You can now access the vendor dashboard once approved."
        });

        onComplete();
      }
    } catch (error) {
      console.error('Error marking module complete:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive"
      });
    }
  };

  const submitSupportRequest = async () => {
    const hcaptchaEnabled = import.meta.env.VITE_ENABLE_HCAPTCHA === 'true';
    if (!supportData.phone || !supportData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    if (hcaptchaEnabled && !captchaToken) {
      toast({ title: "Verification required", description: "Please complete the captcha verification.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('support_requests')
        .insert({
          user_id: userId,
          phone_number: supportData.phone,
          message: supportData.message,
          request_type: 'training_help',
          captcha_token: hcaptchaEnabled ? captchaToken : null
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "An ISA agent will contact you shortly for assistance."
      });

      setShowSupportDialog(false);
      setSupportData({ phone: '', message: '' });
      setCaptchaToken(null);
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Error",
        description: "Failed to submit support request",
        variant: "destructive"
      });
    }
  };

  const isModuleCompleted = (moduleId: string) => {
    return progress.some(p => p.module_id === moduleId && p.is_completed);
  };

  const completedCount = modules.filter(module => isModuleCompleted(module.id)).length;
  const progressPercentage = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

  // Update parent progress
  useEffect(() => {
    onProgressChange?.(progressPercentage);
  }, [progressPercentage, onProgressChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <span className="text-blue-800 text-lg sm:text-xl font-semibold">Vendor Training Program</span>
            </div>
            <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full sm:w-auto text-sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Having trouble? Request a call</span>
                  <span className="sm:hidden">Need help? Call us</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Support Call</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254 XXX XXX XXX"
                      value={supportData.phone}
                      onChange={(e) => setSupportData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe what you need help with..."
                      value={supportData.message}
                      onChange={(e) => setSupportData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <HCaptchaComponent onVerify={(t) => setCaptchaToken(t)} onError={() => setCaptchaToken(null)} />
                    <Button variant="outline" onClick={() => setShowSupportDialog(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={submitSupportRequest} className="w-full sm:w-auto">
                      Submit Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-blue-700 space-y-1 sm:space-y-0">
              <span>Progress: {completedCount} of {modules.length} modules completed</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-blue-600">
              Complete all training modules to access your vendor dashboard once approved.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Module Content */}
      {currentModule && (
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="text-base sm:text-lg">Module {currentModule.module_order}: {currentModule.title}</span>
              </div>
              <Badge variant={isModuleCompleted(currentModule.id) ? "default" : "secondary"} className="w-fit">
                {isModuleCompleted(currentModule.id) ? "Completed" : "In Progress"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {currentModule.image_url && (
              <div className="w-full">
                <img 
                  src={currentModule.image_url} 
                  alt={currentModule.title}
                  className="w-full max-w-2xl mx-auto rounded-lg border"
                />
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-600 text-sm sm:text-base">{currentModule.description}</p>
              {currentModule.content && (
                <div className="prose max-w-none text-sm sm:text-base">
                  <div dangerouslySetInnerHTML={{ __html: currentModule.content }} />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 space-y-3 sm:space-y-0">
              <Button
                variant="outline"
                onClick={() => setCurrentModuleIndex(prev => Math.max(0, prev - 1))}
                disabled={currentModuleIndex === 0}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {!isModuleCompleted(currentModule.id) && (
                  <Button
                    onClick={() => markModuleComplete(currentModule.id)}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}

                {currentModuleIndex < modules.length - 1 && (
                  <Button
                    onClick={() => setCurrentModuleIndex(prev => prev + 1)}
                    disabled={!isModuleCompleted(currentModule.id)}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module List */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">All Training Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <Card 
                key={module.id} 
                className={`cursor-pointer transition-colors ${
                  index === currentModuleIndex ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium">Module {module.module_order}</span>
                    {isModuleCompleted(module.id) && (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm sm:text-base mb-1">{module.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorTraining;
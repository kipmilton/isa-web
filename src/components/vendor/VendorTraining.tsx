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
        // Save training completion step
        await supabase
          .from('vendor_application_steps')
          .upsert({
            user_id: userId,
            step_name: 'training_completed',
            is_completed: true,
            completed_at: new Date().toISOString()
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
    if (!supportData.phone || !supportData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('support_requests')
        .insert({
          user_id: userId,
          phone_number: supportData.phone,
          message: supportData.message,
          request_type: 'training_help'
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "An ISA agent will contact you shortly for assistance."
      });

      setShowSupportDialog(false);
      setSupportData({ phone: '', message: '' });
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span className="text-blue-800">Vendor Training Program</span>
            </div>
            <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Having trouble? Request a call
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowSupportDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={submitSupportRequest}>
                      Submit Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-blue-700">
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
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-600" />
                <span>Module {currentModule.module_order}: {currentModule.title}</span>
              </div>
              <Badge variant={isModuleCompleted(currentModule.id) ? "default" : "secondary"}>
                {isModuleCompleted(currentModule.id) ? "Completed" : "In Progress"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentModule.image_url && (
              <div className="w-full">
                <img 
                  src={currentModule.image_url} 
                  alt={currentModule.title}
                  className="w-full max-w-2xl mx-auto rounded-lg border"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <p className="text-gray-600">{currentModule.description}</p>
              {currentModule.content && (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentModule.content }} />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentModuleIndex(prev => Math.max(0, prev - 1))}
                disabled={currentModuleIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {!isModuleCompleted(currentModule.id) && (
                  <Button
                    onClick={() => markModuleComplete(currentModule.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}

                {currentModuleIndex < modules.length - 1 && (
                  <Button
                    onClick={() => setCurrentModuleIndex(prev => prev + 1)}
                    disabled={!isModuleCompleted(currentModule.id)}
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
        <CardHeader>
          <CardTitle>All Training Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <Card 
                key={module.id} 
                className={`cursor-pointer transition-colors ${
                  index === currentModuleIndex ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Module {module.module_order}</span>
                    {isModuleCompleted(module.id) && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm mb-1">{module.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{module.description}</p>
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
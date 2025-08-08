import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StyleQuizProps {
  userId: string;
  userGender: string;
  onComplete?: () => void;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_order: number;
  options: any; // JSONB from database
}

interface UserResponse {
  question_id: string;
  selected_option: { text: string; value: string };
}

export default function StyleQuiz({ userId, userGender, onComplete }: StyleQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasAlreadyCompleted, setHasAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
    checkIfCompleted();
  }, [userGender]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('style_quiz_questions')
        .select('*')
        .eq('gender', userGender.toLowerCase())
        .eq('is_active', true)
        .order('question_order');

      if (error) throw error;

      if (data) {
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfCompleted = async () => {
    try {
      const { data, error } = await supabase
        .from('user_quiz_responses')
        .select('question_id')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        setHasAlreadyCompleted(true);
      }
    } catch (error) {
      console.error('Error checking quiz completion:', error);
    }
  };

  const handleNext = () => {
    if (!selectedOption) return;

    const currentQuestion = questions[currentQuestionIndex];
    const selectedOptionData = currentQuestion.options.find(
      opt => opt.value === selectedOption
    );

    if (!selectedOptionData) return;

    const newResponse: UserResponse = {
      question_id: currentQuestion.id,
      selected_option: selectedOptionData
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption("");
    } else {
      submitQuiz(updatedResponses);
    }
  };

  const submitQuiz = async (finalResponses: UserResponse[]) => {
    setSubmitting(true);
    try {
      // Save all responses
      const responseInserts = finalResponses.map(response => ({
        user_id: userId,
        question_id: response.question_id,
        selected_option: response.selected_option
      }));

      const { error: responseError } = await supabase
        .from('user_quiz_responses')
        .insert(responseInserts);

      if (responseError) throw responseError;

      // Award points for completing the quiz
      const { error: pointsError } = await supabase.rpc('award_spending_points', {
        user_id_param: userId,
        amount_spent: 0 // Special case for quiz completion
      });

      // Manually award quiz completion points
      const { data: config } = await supabase
        .from('points_config')
        .select('quiz_completion_points')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (config) {
        await supabase
          .from('points_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'earned',
            points: config.quiz_completion_points,
            reason: 'Style quiz completion',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          });

        // Update user points balance
        await supabase.rpc('award_spending_points', {
          user_id_param: userId,
          amount_spent: 0
        });
      }

      setIsCompleted(true);
      toast({
        title: "Quiz completed!",
        description: `Congratulations! You earned ${config?.quiz_completion_points || 20} ISA points.`
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz responses",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setResponses(responses.slice(0, -1));
      setSelectedOption("");
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading quiz...</div>;
  }

  if (hasAlreadyCompleted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quiz Already Completed!</h3>
          <p className="text-muted-foreground">
            You've already completed the style quiz and earned your points.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quiz Completed!</h3>
          <p className="text-muted-foreground mb-4">
            Thank you for completing the style quiz. Your responses will help us provide better recommendations.
          </p>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Star className="h-5 w-5" />
            <span className="font-semibold">+20 ISA Points Earned!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No quiz questions available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Style Quiz
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-primary" />
            <span>Earn 20 points</span>
          </div>
        </CardTitle>
        <CardDescription>
          Help us understand your style preferences for better recommendations
        </CardDescription>
        <Progress value={progress} className="w-full" />
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          <RadioGroup
            value={selectedOption}
            onValueChange={setSelectedOption}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedOption || submitting}
          >
            {submitting
              ? "Submitting..."
              : currentQuestionIndex === questions.length - 1
              ? "Complete Quiz"
              : "Next"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
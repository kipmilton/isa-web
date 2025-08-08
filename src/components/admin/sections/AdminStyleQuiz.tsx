import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Users,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  id: string;
  gender: string;
  question_text: string;
  question_order: number;
  options: Array<{
    text: string;
    value: string;
  }>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const AdminStyleQuiz = () => {
  const [maleQuestions, setMaleQuestions] = useState<QuizQuestion[]>([]);
  const [femaleQuestions, setFemaleQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    gender: 'male',
    question_text: '',
    question_order: 1,
    options: [
      { text: '', value: '' },
      { text: '', value: '' },
      { text: '', value: '' },
      { text: '', value: '' }
    ],
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadQuizQuestions();
  }, []);

  const loadQuizQuestions = async () => {
    try {
      const { data: questionsData, error } = await supabase
        .from('style_quiz_questions')
        .select('*')
        .order('gender', { ascending: true })
        .order('question_order', { ascending: true });

      if (error) throw error;

      if (questionsData) {
        const male = questionsData.filter(q => q.gender === 'male').map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        })) as QuizQuestion[];
        const female = questionsData.filter(q => q.gender === 'female').map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        })) as QuizQuestion[];
        setMaleQuestions(male);
        setFemaleQuestions(female);
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

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive"
      });
      return;
    }

    if (newQuestion.options.some(opt => !opt.text.trim() || !opt.value.trim())) {
      toast({
        title: "Error",
        description: "All options must have text and value",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('style_quiz_questions')
        .insert({
          gender: newQuestion.gender,
          question_text: newQuestion.question_text,
          question_order: newQuestion.question_order,
          options: newQuestion.options,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully!"
      });

      setShowAddForm(false);
      setNewQuestion({
        gender: 'male',
        question_text: '',
        question_order: 1,
        options: [
          { text: '', value: '' },
          { text: '', value: '' },
          { text: '', value: '' },
          { text: '', value: '' }
        ],
        is_active: true
      });

      await loadQuizQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question_text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('style_quiz_questions')
        .update({
          question_text: editingQuestion.question_text,
          question_order: editingQuestion.question_order,
          options: editingQuestion.options,
          is_active: editingQuestion.is_active
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question updated successfully!"
      });

      setEditingQuestion(null);
      await loadQuizQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('style_quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully!"
      });

      await loadQuizQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (questionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('style_quiz_questions')
        .update({ is_active: !isActive })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Question ${!isActive ? 'activated' : 'deactivated'} successfully!`
      });

      await loadQuizQuestions();
    } catch (error) {
      console.error('Error toggling question status:', error);
      toast({
        title: "Error",
        description: "Failed to update question status",
        variant: "destructive"
      });
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'value', value: string) => {
    if (editingQuestion) {
      setEditingQuestion(prev => ({
        ...prev!,
        options: prev!.options.map((opt, i) => 
          i === index ? { ...opt, [field]: value } : opt
        )
      }));
    } else {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => 
          i === index ? { ...opt, [field]: value } : opt
        )
      }));
    }
  };

  const renderQuestionForm = (question: QuizQuestion | null, isEditing: boolean) => {
    const currentQuestion = question || newQuestion;
    const setCurrentQuestion = isEditing ? setEditingQuestion : setNewQuestion;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{isEditing ? 'Edit Question' : 'Add New Question'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={currentQuestion.gender}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev!, gender: e.target.value }))}
                className="w-full p-2 border rounded-md mt-1"
                disabled={isEditing}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <Label htmlFor="order">Question Order</Label>
              <Input
                id="order"
                type="number"
                value={currentQuestion.question_order}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev!, question_order: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="questionText">Question Text</Label>
            <Textarea
              id="questionText"
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev!, question_text: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>Options</Label>
            <div className="space-y-3 mt-2">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`option-text-${index}`}>Option {index + 1} Text</Label>
                    <Input
                      id={`option-text-${index}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`option-value-${index}`}>Option {index + 1} Value</Label>
                    <Input
                      id={`option-value-${index}`}
                      value={option.value}
                      onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <Label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.is_active}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev!, is_active: e.target.checked }))}
                  className="rounded"
                />
                <span>Active</span>
              </Label>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={isEditing ? handleUpdateQuestion : handleAddQuestion}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Question' : 'Add Question'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isEditing) {
                  setEditingQuestion(null);
                } else {
                  setShowAddForm(false);
                }
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuestionsList = (questions: QuizQuestion[], gender: string) => (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className={!question.is_active ? 'opacity-60' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={question.is_active ? "default" : "secondary"}>
                    {question.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">Order: {question.question_order}</Badge>
                </div>
                <h3 className="font-semibold mb-3">{question.question_text}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.options.map((option, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      <span className="font-medium">{index + 1}.</span> {option.text} 
                      <span className="text-gray-400 ml-2">({option.value})</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingQuestion(question)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(question.id, question.is_active)}
                >
                  {question.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Style Quiz Management</h1>
        <p className="text-gray-600 mt-2">Manage style quiz questions for male and female users</p>
      </div>

      {/* Add New Question */}
      {showAddForm && renderQuestionForm(null, false)}

      {/* Edit Question */}
      {editingQuestion && renderQuestionForm(editingQuestion, true)}

      {/* Questions Management */}
      <Tabs defaultValue="male" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="male" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Male Questions ({maleQuestions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="female" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Female Questions ({femaleQuestions.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="male" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Male Style Quiz Questions</h2>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
          {renderQuestionsList(maleQuestions, 'male')}
        </TabsContent>

        <TabsContent value="female" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Female Style Quiz Questions</h2>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
          {renderQuestionsList(femaleQuestions, 'female')}
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Quiz Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {maleQuestions.length}
              </div>
              <div className="text-sm text-blue-700">Male Questions</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">
                {femaleQuestions.length}
              </div>
              <div className="text-sm text-pink-700">Female Questions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {maleQuestions.filter(q => q.is_active).length + femaleQuestions.filter(q => q.is_active).length}
              </div>
              <div className="text-sm text-green-700">Active Questions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStyleQuiz;
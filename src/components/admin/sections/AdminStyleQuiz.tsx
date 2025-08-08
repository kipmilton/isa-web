import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Save, X, Users, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  gender: string;
  question_text: string;
  question_order: number;
  options: any; // JSONB from database
  is_active: boolean;
  created_at: string;
}

interface NewQuestion {
  gender: string;
  question_text: string;
  question_order: number;
  options: Array<{ text: string; value: string }>;
}

export default function AdminStyleQuiz() {
  const [maleQuestions, setMaleQuestions] = useState<QuizQuestion[]>([]);
  const [femaleQuestions, setFemaleQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<NewQuestion>({
    gender: 'male',
    question_text: '',
    question_order: 1,
    options: [{ text: '', value: '' }]
  });
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('style_quiz_questions')
        .select('*')
        .order('gender, question_order');

      if (error) throw error;

      if (data) {
        setMaleQuestions(data.filter(q => q.gender === 'male'));
        setFemaleQuestions(data.filter(q => q.gender === 'female'));
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { text: '', value: '' }]
    });
  };

  const removeOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index)
    });
  };

  const updateOption = (index: number, field: 'text' | 'value', value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index][field] = value;
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const createQuestion = async () => {
    if (!newQuestion.question_text || newQuestion.options.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
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
        title: "Question created",
        description: "New quiz question added successfully"
      });

      setNewQuestion({
        gender: 'male',
        question_text: '',
        question_order: 1,
        options: [{ text: '', value: '' }]
      });
      setShowNewQuestionForm(false);
      loadQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive"
      });
    }
  };

  const toggleQuestionStatus = async (questionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('style_quiz_questions')
        .update({ is_active: isActive })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: isActive ? "Question activated" : "Question deactivated",
        description: `Question ${isActive ? 'enabled' : 'disabled'} successfully`
      });

      loadQuestions();
    } catch (error) {
      console.error('Error updating question status:', error);
      toast({
        title: "Error",
        description: "Failed to update question status",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('style_quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Question deleted",
        description: "Quiz question removed successfully"
      });

      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const renderQuestionsList = (questions: QuizQuestion[], gender: string) => (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No questions found for {gender} customers
        </div>
      ) : (
        questions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Question {question.question_order}</CardTitle>
                <CardDescription>{question.question_text}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.is_active}
                  onCheckedChange={(checked) => toggleQuestionStatus(question.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingQuestion(question.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Options:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.options.map((option: any, index: number) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm">
                      {option.text}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={question.is_active ? "default" : "secondary"}>
                    {question.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span>Created {new Date(question.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return <div className="animate-pulse">Loading quiz management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileQuestion className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Style Quiz Management</h1>
        </div>
        <Button onClick={() => setShowNewQuestionForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Male Questions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maleQuestions.length}</div>
            <p className="text-xs text-muted-foreground">
              {maleQuestions.filter(q => q.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Female Questions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{femaleQuestions.length}</div>
            <p className="text-xs text-muted-foreground">
              {femaleQuestions.filter(q => q.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Question Form */}
      {showNewQuestionForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Add New Question
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewQuestionForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="w-full p-2 border rounded-md"
                  value={newQuestion.gender}
                  onChange={(e) => setNewQuestion({ ...newQuestion, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Question Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={newQuestion.question_order}
                  onChange={(e) => setNewQuestion({ 
                    ...newQuestion, 
                    question_order: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text</Label>
              <Textarea
                id="questionText"
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter your question here..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button size="sm" variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
              
              {newQuestion.options.map((option, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="Option text"
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Option value"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                    />
                    {newQuestion.options.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={createQuestion}>
                <Save className="h-4 w-4 mr-2" />
                Save Question
              </Button>
              <Button variant="outline" onClick={() => setShowNewQuestionForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Tabs */}
      <Tabs defaultValue="male" className="space-y-6">
        <TabsList>
          <TabsTrigger value="male">Male Questions ({maleQuestions.length})</TabsTrigger>
          <TabsTrigger value="female">Female Questions ({femaleQuestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="male">
          {renderQuestionsList(maleQuestions, 'male')}
        </TabsContent>

        <TabsContent value="female">
          {renderQuestionsList(femaleQuestions, 'female')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
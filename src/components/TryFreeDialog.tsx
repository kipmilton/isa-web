
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Brain } from "lucide-react";

interface TryFreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TryFreeDialog = ({ open, onOpenChange }: TryFreeDialogProps) => {
  const [questionsLeft, setQuestionsLeft] = useState(5);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{type: 'user' | 'myplug', message: string}>>([]);

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    
    if (questionsLeft === 0) {
      toast.error("You've reached your free question limit. Please sign up to continue!");
      return;
    }

    // Add user question
    const newConversation = [...conversation, { type: 'user' as const, message: question }];
    
    // Simulate MyPlug response
    const responses = [
      "I'd be happy to help you find the best products! Based on your query, I recommend checking out our featured vendors.",
      "Great question! Let me search through our product database to find the perfect match for you.",
      "I can help you compare prices and features across different vendors. Here are some options...",
      "That's an excellent choice! I can provide you with detailed product information and user reviews.",
      "Based on your preferences, I've found several great options that might interest you!"
    ];
    
    const myplugResponse = responses[Math.floor(Math.random() * responses.length)];
    newConversation.push({ type: 'myplug' as const, message: myplugResponse });
    
    setConversation(newConversation);
    setQuestion("");
    setQuestionsLeft(questionsLeft - 1);
    
    if (questionsLeft === 1) {
      setTimeout(() => {
        toast.info("This was your last free question! Sign up to continue chatting with MyPlug.");
      }, 2000);
    }
  };

  const handleSignUp = () => {
    onOpenChange(false);
    toast.info("Redirecting to sign up...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-orange-500" />
            <span>Chat with MyPlug - Free Trial</span>
            <span className="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              {questionsLeft} questions left
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Free trial chat with MyPlug AI Shopping Assistant. Ask questions about products and shopping.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Chat Messages */}
          <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
            {conversation.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                  <p>Hi! I'm MyPlug, your AI Shopping Assistant.</p>
                  <p className="text-sm">Ask me anything about products, prices, or shopping!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversation.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-orange-200 text-gray-800'
                    }`}>
                      {msg.type === 'myplug' && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Brain className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-medium text-orange-600">MyPlug</span>
                        </div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Input Area */}
          {questionsLeft > 0 ? (
            <div className="flex space-x-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask MyPlug about products, prices, recommendations..."
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <Button onClick={handleAskQuestion} disabled={!question.trim()}>
                Ask
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 bg-orange-50 p-6 rounded-lg">
              <p className="text-orange-700 font-medium">You've used all your free questions!</p>
              <p className="text-sm text-orange-600">Sign up to continue chatting with MyPlug and get unlimited access.</p>
              <Button onClick={handleSignUp} className="bg-orange-500 hover:bg-orange-600">
                Sign Up Now
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TryFreeDialog;

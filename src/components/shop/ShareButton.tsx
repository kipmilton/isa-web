import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Facebook, Twitter, MessageCircle, Mail } from "lucide-react";

interface ShareButtonProps {
  className?: string;
}

const ShareButton = ({ className }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = window.location.origin;
  const shareText = "Check out ISA Shop - Kenya's smartest shopping assistant! Find great deals and shop with confidence. 🛍️✨";
  const fullShareText = `${shareText} ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`,
      color: "bg-sky-500 hover:bg-sky-600"
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(fullShareText)}`,
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent("Check out ISA Shop!")}&body=${encodeURIComponent(fullShareText)}`,
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 border-none shadow-lg ${className}`}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Tell a friend about ISA</span>
          <span className="sm:hidden">Share ISA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share ISA Shop</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <Label>Share via Social Media</Label>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <Button
                  key={option.name}
                  onClick={() => handleShare(option.url)}
                  className={`flex items-center justify-center space-x-2 ${option.color} text-white`}
                >
                  <option.icon className="w-4 h-4" />
                  <span>{option.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Share Message Preview */}
          <div className="space-y-2">
            <Label>Share Message Preview</Label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700">{shareText}</p>
              <p className="text-sm text-blue-600 mt-2">{shareUrl}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
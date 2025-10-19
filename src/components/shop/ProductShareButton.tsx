import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Facebook, Twitter, MessageCircle } from "lucide-react";

interface ProductShareButtonProps {
  productId: string;
  productName: string;
  productImage?: string;
  className?: string;
}

const ProductShareButton = ({ productId, productName, productImage, className }: ProductShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/product/${productId}`;
  const shareText = `Check out ${productName} on MyPlug! 🛍️`;
  const fullShareText = `${shareText} ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to your clipboard."
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
    }
  ];

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Share2 className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>Share Product</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Product Preview */}
            {productImage && (
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <img src={productImage} alt={productName} className="w-12 h-12 object-cover rounded" />
                <p className="text-sm font-medium truncate">{productName}</p>
              </div>
            )}

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
              <div className="grid grid-cols-3 gap-3">
                {shareOptions.map((option) => (
                  <Button
                    key={option.name}
                    onClick={() => handleShare(option.url)}
                    className={`flex flex-col items-center justify-center space-y-2 h-20 ${option.color} text-white`}
                  >
                    <option.icon className="w-5 h-5" />
                    <span className="text-xs">{option.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductShareButton;

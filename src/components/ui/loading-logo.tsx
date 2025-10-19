import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LoadingLogoProps {
  className?: string;
  onLoadComplete?: () => void;
}

export const LoadingLogo = ({ className, onLoadComplete }: LoadingLogoProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Trigger fade out after a short delay
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onLoadComplete?.();
      }, 500); // Match animation duration
    }, 1000);

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center transition-opacity duration-500",
        fadeOut ? "opacity-0" : "opacity-100",
        className
      )}
    >
      <img
        src="/myplug-loading.png"
        alt="MyPlug"
        className="w-32 h-32 object-contain animate-pulse"
        style={{ filter: "blur(2px)" }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <p className="hidden mt-4 text-muted-foreground font-medium">
        MyPlug is loading...
      </p>
    </div>
  );
};

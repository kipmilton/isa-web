import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useState, forwardRef, useImperativeHandle, useRef } from 'react';

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  size?: 'normal' | 'compact' | 'invisible';
  theme?: 'light' | 'dark';
}

export const HCaptchaComponent = forwardRef<HCaptcha, HCaptchaComponentProps>(({ 
  onVerify, 
  onError, 
  onExpire, 
  size = 'compact',
  theme = 'light' 
}: HCaptchaComponentProps, ref) => {
  const internalRef = useRef<HCaptcha>(null);
  
  // Use the site key directly from .env
  const siteKey = "9ea45ea6-9828-4b6e-9636-5f8eec58cc50";
  const isEnabled = true; // Enable hCaptcha by default

  useImperativeHandle(ref, () => internalRef.current as any);

  if (!isEnabled || !siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center my-2">
      <HCaptcha
        ref={internalRef}
        sitekey={siteKey}
        onVerify={onVerify}
        onError={onError}
        onExpire={onExpire}
        size={size}
        theme={theme}
      />
    </div>
  );
});



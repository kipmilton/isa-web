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
  const [isEnabled] = useState(() => {
    return import.meta.env.VITE_ENABLE_HCAPTCHA === 'true';
  });

  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

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



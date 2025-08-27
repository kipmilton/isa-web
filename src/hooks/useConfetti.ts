import { useState, useCallback } from 'react';

interface ConfettiConfig {
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

export const useConfetti = (defaultConfig?: ConfettiConfig) => {
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState<ConfettiConfig>({
    duration: 3000,
    particleCount: 100,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    ...defaultConfig
  });

  const trigger = useCallback((customConfig?: ConfettiConfig) => {
    const finalConfig = { ...config, ...customConfig };
    setConfig(finalConfig);
    setIsActive(true);
  }, [config]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const onComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    config,
    trigger,
    stop,
    onComplete
  };
};

import { useEffect } from 'react';
import { SocialShareService, ShareMetadata } from '@/services/socialShareService';

export const usePageMeta = (metadata?: ShareMetadata) => {
  useEffect(() => {
    if (metadata) {
      // Update meta tags when metadata changes
      SocialShareService.updatePageMetaTags(metadata);
    } else {
      // Reset to default when component unmounts or no metadata
      SocialShareService.resetToDefaultMetaTags();
    }

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      SocialShareService.resetToDefaultMetaTags();
    };
  }, [metadata]);
};

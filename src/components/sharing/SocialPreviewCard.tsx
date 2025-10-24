import React from 'react';
import { ShareMetadata } from '@/services/socialShareService';

interface SocialPreviewCardProps {
  metadata: ShareMetadata;
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin';
}

export const SocialPreviewCard: React.FC<SocialPreviewCardProps> = ({ metadata, platform }) => {
  const getPlatformStyles = () => {
    switch (platform) {
      case 'facebook':
        return {
          container: 'bg-white border border-gray-200 rounded-lg shadow-sm',
          image: 'w-full h-48 object-cover rounded-t-lg',
          content: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-2',
          description: 'text-sm text-gray-600 mb-2',
          url: 'text-xs text-blue-600',
          siteName: 'text-xs text-gray-500 uppercase tracking-wide'
        };
      case 'twitter':
        return {
          container: 'bg-white border border-gray-200 rounded-lg shadow-sm',
          image: 'w-full h-48 object-cover rounded-t-lg',
          content: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-2',
          description: 'text-sm text-gray-600 mb-2',
          url: 'text-xs text-blue-500',
          siteName: 'text-xs text-gray-500'
        };
      case 'whatsapp':
        return {
          container: 'bg-white border border-gray-200 rounded-lg shadow-sm',
          image: 'w-full h-48 object-cover rounded-t-lg',
          content: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-2',
          description: 'text-sm text-gray-600 mb-2',
          url: 'text-xs text-green-600',
          siteName: 'text-xs text-gray-500'
        };
      case 'linkedin':
        return {
          container: 'bg-white border border-gray-200 rounded-lg shadow-sm',
          image: 'w-full h-48 object-cover rounded-t-lg',
          content: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-2',
          description: 'text-sm text-gray-600 mb-2',
          url: 'text-xs text-blue-700',
          siteName: 'text-xs text-gray-500'
        };
      default:
        return {
          container: 'bg-white border border-gray-200 rounded-lg shadow-sm',
          image: 'w-full h-48 object-cover rounded-t-lg',
          content: 'p-4',
          title: 'text-lg font-semibold text-gray-900 mb-2',
          description: 'text-sm text-gray-600 mb-2',
          url: 'text-xs text-blue-600',
          siteName: 'text-xs text-gray-500'
        };
    }
  };

  const styles = getPlatformStyles();

  return (
    <div className={styles.container}>
      <img 
        src={metadata.image} 
        alt={metadata.title}
        className={styles.image}
        onError={(e) => {
          e.currentTarget.src = '/myplug-logo.png';
        }}
      />
      <div className={styles.content}>
        <div className={styles.siteName}>MyPlug</div>
        <h3 className={styles.title}>{metadata.title}</h3>
        <p className={styles.description}>{metadata.description}</p>
        <div className={styles.url}>{metadata.url}</div>
      </div>
    </div>
  );
};

export default SocialPreviewCard;

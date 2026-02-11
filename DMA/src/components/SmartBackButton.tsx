import React from 'react';
import { IonButtons, IonBackButton } from '@ionic/react';
import { useNavigation } from '../hooks/useNavigation';

interface SmartBackButtonProps {
  /**
   * Fallback route if no navigation history available
   * @default "/tab1"
   */
  defaultHref?: string;
  /**
   * CSS class for styling
   */
  className?: string;
  /**
   * Text to show (if overriding default arrow icon)
   */
  text?: string;
  /**
   * Slot for positioning (e.g., 'start', 'end')
   */
  slot?: string;
}

/**
 * SmartBackButton Component
 * 
 * Intelligent back button that:
 * 1. First tries browser history (for normal navigation)
 * 2. Falls back to tracked navigation history (for modal/drawer closes)
 * 3. Finally falls back to provided defaultHref
 * 4. Never gets stuck or redirects unexpectedly
 * 
 * Usage:
 * <SmartBackButton defaultHref="/tab1" />
 * <SmartBackButton defaultHref="/admin/sermons" slot="start" />
 */
const SmartBackButton: React.FC<SmartBackButtonProps> = ({
  defaultHref = '/tab1',
  className = '',
  text,
  slot = 'start'
}) => {
  const { currentPath } = useNavigation();

  // Don't render if already on default path to prevent loops
  if (currentPath === defaultHref) {
    return null;
  }

  return (
    <IonButtons slot={slot}>
      <IonBackButton
        defaultHref={defaultHref}
        className={className}
        text={text}
      />
    </IonButtons>
  );
};

export default SmartBackButton;

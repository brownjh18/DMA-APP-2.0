import React from 'react';
import { IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';
import { useSettings } from '../contexts/SettingsContext';
import './AdminPopover.css';

export interface PopoverOption {
  text: string;
  icon?: any;
  handler: () => void;
  role?: 'destructive' | 'cancel';
}

interface AdminPopoverProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  header?: string;
  options: PopoverOption[];
}

const AdminPopover: React.FC<AdminPopoverProps> = ({
  isOpen,
  onDidDismiss,
  header,
  options,
}) => {
  const { isDarkMode } = useSettings();

  if (!isOpen) return null;

  const handleOptionClick = (option: PopoverOption) => {
    option.handler();
    onDidDismiss();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDidDismiss();
    }
  };

  return (
    <div
      className={`ap-overlay ${isDarkMode ? 'ap-dark' : 'ap-light'}`}
      onClick={handleBackdropClick}
    >
      <div className="ap-popover">
        {header && (
          <div className="ap-header">
            <h3 className="ap-title">{header}</h3>
            <button className="ap-close-btn" onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </button>
          </div>
        )}
        <div className="ap-options">
          {options.map((option, index) => (
            <button
              key={index}
              className={`ap-option ${option.role === 'destructive' ? 'ap-destructive' : ''} ${option.role === 'cancel' ? 'ap-cancel' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {option.icon && (
                <IonIcon icon={option.icon} className="ap-option-icon" />
              )}
              <span className="ap-option-text">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPopover;

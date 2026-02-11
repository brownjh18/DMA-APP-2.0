import React, { useState, useEffect } from 'react';
import { IonIcon, IonProgressBar } from '@ionic/react';
import { cloudUpload, save, musicalNotes, videocam, close } from 'ionicons/icons';

// Progress item interface
interface ProgressItem {
  id: string;
  type: 'video' | 'audio' | 'save';
  title: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

// Global state for progress items
let progressItemsState: ProgressItem[] = [];
let listeners: (() => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Add a progress item
export const addProgressItem = (item: Omit<ProgressItem, 'id'>): string => {
  const id = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  progressItemsState.push({ ...item, id });
  notifyListeners();
  return id;
};

// Update a progress item
export const updateProgressItem = (id: string, updates: Partial<ProgressItem>) => {
  const index = progressItemsState.findIndex(item => item.id === id);
  if (index !== -1) {
    progressItemsState[index] = { ...progressItemsState[index], ...updates };
    notifyListeners();
  }
};

// Remove a progress item
export const removeProgressItem = (id: string) => {
  progressItemsState = progressItemsState.filter(item => item.id !== id);
  notifyListeners();
};

// Clear all completed items
export const clearCompletedItems = () => {
  progressItemsState = progressItemsState.filter(item => 
    item.status === 'uploading' || item.status === 'pending'
  );
  notifyListeners();
};

// Get all current progress items
export const getProgressItems = (): ProgressItem[] => {
  return [...progressItemsState];
};

const ProgressOverlay: React.FC = () => {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const updateItems = () => {
      setItems([...progressItemsState]);
      setIsVisible(progressItemsState.length > 0 && 
        progressItemsState.some(item => item.status !== 'success'));
    };

    listeners.push(updateItems);
    updateItems();

    // Auto-hide after success
    const checkSuccess = setInterval(() => {
      const hasUploading = progressItemsState.some(item => item.status === 'uploading');
      if (!hasUploading && progressItemsState.length > 0) {
        // All done, wait 3 seconds then remove completed
        setTimeout(() => {
          clearCompletedItems();
        }, 3000);
      }
    }, 1000);

    return () => {
      listeners = listeners.filter(l => l !== updateItems);
      clearInterval(checkSuccess);
    };
  }, []);

  const getIcon = (type: ProgressItem['type']) => {
    switch (type) {
      case 'video': return videocam;
      case 'audio': return musicalNotes;
      case 'save': return save;
      default: return cloudUpload;
    }
  };

  const getStatusColor = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending': return 'var(--ion-color-warning)';
      case 'uploading': return 'var(--ion-color-primary)';
      case 'success': return 'var(--ion-color-success)';
      case 'error': return 'var(--ion-color-danger)';
      default: return 'var(--ion-color-medium)';
    }
  };

  if (!isVisible && items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMinimized ? '10px' : '80px',
        right: '10px',
        maxWidth: isMinimized ? '60px' : '350px',
        maxHeight: isMinimized ? '60px' : '400px',
        backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: isMinimized ? '30px' : '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        border: '1px solid rgba(var(--ion-color-primary-rgb), 0.3)',
        zIndex: 9999,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMinimized ? '8px' : '12px 16px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(128,128,128,0.2)',
          cursor: 'pointer',
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonIcon
            icon={cloudUpload}
            style={{
              fontSize: isMinimized ? '1.2em' : '1.4em',
              color: 'var(--ion-color-primary)',
            }}
          />
          {!isMinimized && (
            <span style={{ fontWeight: 600, fontSize: '0.9em' }}>
              {items.filter(i => i.status === 'uploading').length > 0 
                ? 'Uploading...' 
                : 'Completed'}
            </span>
          )}
          {!isMinimized && items.length > 0 && (
            <span style={{ 
              backgroundColor: 'var(--ion-color-primary)',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '0.75em',
            }}>
              {items.filter(i => i.status === 'uploading').length || items.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearCompletedItems();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '0.8em',
                color: 'var(--ion-color-medium)',
              }}
            >
              Clear
            </button>
          )}
          <IonIcon
            icon={close}
            style={{
              fontSize: '1.2em',
              color: 'var(--ion-color-medium)',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              progressItemsState = [];
              notifyListeners();
            }}
          />
        </div>
      </div>

      {/* Progress Items */}
      {!isMinimized && (
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          padding: '8px',
        }}>
          {items.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: 'var(--ion-color-medium)' 
            }}>
              <IonIcon icon={cloudUpload} style={{ fontSize: '2em', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '0.9em' }}>All uploads completed!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: 'rgba(var(--ion-color-light-rgb), 0.5)',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${getStatusColor(item.status)}`,
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '6px',
                }}>
                  <IonIcon
                    icon={getIcon(item.type)}
                    style={{
                      fontSize: '1.1em',
                      color: getStatusColor(item.status),
                    }}
                  />
                  <span style={{ 
                    flex: 1, 
                    fontSize: '0.85em', 
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </span>
                  <span style={{ 
                    fontSize: '0.75em', 
                    color: getStatusColor(item.status),
                  }}>
                    {item.status === 'pending' && 'Waiting...'}
                    {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                    {item.status === 'success' && 'Done'}
                    {item.status === 'error' && 'Failed'}
                  </span>
                </div>
                
                {/* Progress Bar */}
                {item.status === 'uploading' && (
                  <IonProgressBar
                    value={item.progress / 100}
                    style={{
                      height: '4px',
                      '--progress-background': `var(--ion-color-primary)`,
                    }}
                  />
                )}
                
                {/* Error Message */}
                {item.status === 'error' && item.message && (
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '0.75em', 
                    color: 'var(--ion-color-danger)' 
                  }}>
                    {item.message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Minimized indicator */}
      {isMinimized && items.some(i => i.status === 'uploading') && (
        <div style={{
          padding: '8px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <IonProgressBar
            value={items.filter(i => i.status === 'uploading')[0]?.progress / 100 || 0}
            style={{
              width: '30px',
              height: '4px',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProgressOverlay;

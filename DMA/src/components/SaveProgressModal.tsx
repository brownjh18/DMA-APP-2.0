import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  checkmarkCircle,
  alertCircle,
  cloudUpload,
  save,
  close,
} from 'ionicons/icons';

export interface SaveProgressStep {
  label: string;
  status: 'pending' | 'active' | 'success' | 'error';
  progress?: number;
  message?: string;
}

interface SaveProgressModalProps {
  isOpen: boolean;
  steps: SaveProgressStep[];
  overallProgress: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
  onDismiss: () => void;
  title?: string;
}

const SaveProgressModal: React.FC<SaveProgressModalProps> = ({
  isOpen,
  steps,
  overallProgress,
  status,
  errorMessage,
  onDismiss,
  title = 'Saving...',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <IonIcon icon={checkmarkCircle} style={{ fontSize: '48px', color: '#10b981' }} />;
      case 'error':
        return <IonIcon icon={alertCircle} style={{ fontSize: '48px', color: '#ef4444' }} />;
      default:
        return <IonIcon icon={cloudUpload} style={{ fontSize: '48px', color: '#6366f1' }} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Completed Successfully!';
      case 'error':
        return 'Something went wrong';
      default:
        return title;
    }
  };

  return (
    <>
      <style>{`
        .save-progress-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: ${isOpen ? 1 : 0};
          transition: opacity 0.3s ease;
          pointer-events: ${isOpen ? 'auto' : 'none'};
        }

        .save-progress-card {
          width: 90%;
          max-width: 380px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-radius: 24px;
          border: 0.5px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.05),
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 24px 60px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          padding: 32px 28px 28px;
          transform: ${isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)'};
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
        }

        .save-progress-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .save-progress-close:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .save-progress-close ion-icon {
          font-size: 18px;
          color: #6b7280;
        }

        .save-progress-icon {
          text-align: center;
          margin-bottom: 16px;
        }

        .save-progress-title {
          text-align: center;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 20px;
        }

        .save-progress-bar-container {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .save-progress-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
        }

        .save-progress-bar-fill.success {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .save-progress-bar-fill.error {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .save-progress-percent {
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: #6366f1;
          margin: -16px 0 20px;
        }

        .save-progress-percent.success {
          color: #10b981;
        }

        .save-progress-percent.error {
          color: #ef4444;
        }

        .save-progress-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .save-progress-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }

        .save-progress-step.active {
          background: rgba(99, 102, 241, 0.08);
        }

        .save-progress-step-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .save-progress-step-icon.pending {
          background: rgba(0, 0, 0, 0.06);
        }

        .save-progress-step-icon.active {
          background: rgba(99, 102, 241, 0.15);
        }

        .save-progress-step-icon.success {
          background: rgba(16, 185, 129, 0.15);
        }

        .save-progress-step-icon.error {
          background: rgba(239, 68, 68, 0.15);
        }

        .save-progress-step-icon ion-icon {
          font-size: 16px;
        }

        .save-progress-step-label {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .save-progress-step-label.active {
          color: #1a1a1a;
          font-weight: 600;
        }

        .save-progress-step-status {
          font-size: 12px;
          font-weight: 600;
        }

        .save-progress-step-status.pending {
          color: #9ca3af;
        }

        .save-progress-step-status.active {
          color: #6366f1;
        }

        .save-progress-step-status.success {
          color: #10b981;
        }

        .save-progress-step-status.error {
          color: #ef4444;
        }

        .save-progress-step-bar {
          width: 100%;
          height: 3px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
        }

        .save-progress-step-bar-fill {
          height: 100%;
          background: #6366f1;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .save-progress-error-msg {
          margin-top: 12px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 10px;
          font-size: 13px;
          color: #dc2626;
          text-align: center;
        }

        .save-progress-done-btn {
          width: 100%;
          margin-top: 20px;
          padding: 12px;
          border-radius: 14px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-progress-done-btn.success {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 0.5px solid rgba(16, 185, 129, 0.2);
        }

        .save-progress-done-btn.error {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 0.5px solid rgba(239, 68, 68, 0.2);
        }

        .save-progress-done-btn:active {
          transform: scale(0.98);
        }

        [data-theme="dark"] .save-progress-card {
          background: rgba(28, 28, 30, 0.88);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.2),
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 24px 60px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .save-progress-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] .save-progress-step {
          background: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .save-progress-step.active {
          background: rgba(99, 102, 241, 0.12);
        }

        [data-theme="dark"] .save-progress-step-label {
          color: #d1d5db;
        }

        [data-theme="dark"] .save-progress-step-label.active {
          color: #f3f4f6;
        }

        [data-theme="dark"] .save-progress-step-icon.pending {
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .save-progress-close {
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .save-progress-close ion-icon {
          color: #9ca3af;
        }
      `}</style>

      <div className="save-progress-overlay" onClick={status !== 'uploading' ? onDismiss : undefined}>
        <div className="save-progress-card" onClick={(e) => e.stopPropagation()}>
          {(status === 'success' || status === 'error') && (
            <button className="save-progress-close" onClick={onDismiss}>
              <IonIcon icon={close} />
            </button>
          )}

          <div className="save-progress-icon">{getStatusIcon()}</div>
          <h2 className="save-progress-title">{getStatusText()}</h2>

          <div className="save-progress-bar-container">
            <div
              className={`save-progress-bar-fill ${status === 'success' ? 'success' : status === 'error' ? 'error' : ''}`}
              style={{ width: `${status === 'success' ? 100 : status === 'error' ? overallProgress : overallProgress}%` }}
            />
          </div>

          <div className={`save-progress-percent ${status === 'success' ? 'success' : status === 'error' ? 'error' : ''}`}>
            {status === 'success' ? '100' : status === 'error' ? Math.round(overallProgress) : Math.round(overallProgress)}%
          </div>

          <div className="save-progress-steps">
            {steps.map((step, i) => (
              <div key={i} className={`save-progress-step ${step.status === 'active' ? 'active' : ''}`}>
                <div className={`save-progress-step-icon ${step.status}`}>
                  {step.status === 'success' && <IonIcon icon={checkmarkCircle} style={{ color: '#10b981' }} />}
                  {step.status === 'error' && <IonIcon icon={alertCircle} style={{ color: '#ef4444' }} />}
                  {step.status === 'active' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'pulse 1.2s ease-in-out infinite' }} />
                  )}
                  {step.status === 'pending' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className={`save-progress-step-label ${step.status === 'active' ? 'active' : ''}`}>
                    {step.label}
                  </div>
                  {step.status === 'active' && step.progress !== undefined && (
                    <div className="save-progress-step-bar">
                      <div className="save-progress-step-bar-fill" style={{ width: `${step.progress}%` }} />
                    </div>
                  )}
                </div>
                <span className={`save-progress-step-status ${step.status}`}>
                  {step.status === 'pending' && 'Waiting'}
                  {step.status === 'active' && (step.progress !== undefined ? `${Math.round(step.progress)}%` : 'In progress')}
                  {step.status === 'success' && 'Done'}
                  {step.status === 'error' && 'Failed'}
                </span>
              </div>
            ))}
          </div>

          {status === 'error' && errorMessage && (
            <div className="save-progress-error-msg">{errorMessage}</div>
          )}

          {(status === 'success' || status === 'error') && (
            <button
              className={`save-progress-done-btn ${status}`}
              onClick={onDismiss}
            >
              {status === 'success' ? 'Done' : 'Try Again'}
            </button>
          )}

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.3); }
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default SaveProgressModal;

import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudUpload, checkmarkCircle, alertCircle, close } from 'ionicons/icons';
import { useUploads } from '../contexts/UploadContext';

const UploadIndicator: React.FC = () => {
  const { uploads, dismissUpload } = useUploads();
  const [expanded, setExpanded] = useState(false);

  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const completedUploads = uploads.filter((u) => u.status !== 'uploading');
  const totalProgress = uploads.length > 0
    ? Math.round(uploads.reduce((sum, u) => sum + (u.status === 'success' ? 100 : u.progress), 0) / uploads.length)
    : 0;

  return (
    <>
      <style>{`
        .upload-indicator {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9998;
          max-width: 340px;
          width: 90%;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 16px;
          border: 0.5px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation: upload-slide-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .upload-indicator.expanded {
          max-height: 300px;
        }

        @keyframes upload-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .upload-indicator-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          cursor: pointer;
        }

        .upload-indicator-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(99, 102, 241, 0.12);
          animation: upload-pulse 1.5s ease-in-out infinite;
        }

        .upload-indicator-icon.success {
          background: rgba(16, 185, 129, 0.12);
          animation: none;
        }

        .upload-indicator-icon.error {
          background: rgba(239, 68, 68, 0.12);
          animation: none;
        }

        @keyframes upload-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .upload-indicator-info {
          flex: 1;
          min-width: 0;
        }

        .upload-indicator-title {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .upload-indicator-subtitle {
          font-size: 11px;
          color: #6b7280;
          margin-top: 1px;
        }

        .upload-indicator-close {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .upload-indicator-bar {
          height: 3px;
          background: rgba(0, 0, 0, 0.06);
        }

        .upload-indicator-bar-fill {
          height: 100%;
          border-radius: 0 2px 2px 0;
          transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
        }

        .upload-indicator-bar-fill.success {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .upload-indicator-bar-fill.error {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .upload-indicator-items {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .upload-indicator-items.expanded {
          max-height: 200px;
          overflow-y: auto;
        }

        .upload-indicator-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
        }

        .upload-indicator-item-icon {
          font-size: 14px;
        }

        .upload-indicator-item-label {
          flex: 1;
          font-size: 12px;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .upload-indicator-item-progress {
          font-size: 11px;
          font-weight: 600;
          color: #6366f1;
        }

        .upload-indicator-item-progress.success {
          color: #10b981;
        }

        .upload-indicator-item-progress.error {
          color: #ef4444;
        }

        [data-theme="dark"] .upload-indicator {
          background: rgba(28, 28, 30, 0.92);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .upload-indicator-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] .upload-indicator-subtitle {
          color: #9ca3af;
        }

        [data-theme="dark"] .upload-indicator-item-label {
          color: #d1d5db;
        }

        [data-theme="dark"] .upload-indicator-close {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>

      <div className={`upload-indicator ${expanded ? 'expanded' : ''}`}>
        <div className="upload-indicator-header" onClick={() => setExpanded(!expanded)}>
          <div className={`upload-indicator-icon ${
            activeUploads.length === 0 && completedUploads.length > 0 ? 'success' :
            uploads.some((u) => u.status === 'error') ? 'error' : ''
          }`}>
            {activeUploads.length > 0 ? (
              <IonIcon icon={cloudUpload} style={{ fontSize: '16px', color: '#6366f1' }} />
            ) : uploads.some((u) => u.status === 'error') ? (
              <IonIcon icon={alertCircle} style={{ fontSize: '16px', color: '#ef4444' }} />
            ) : (
              <IonIcon icon={checkmarkCircle} style={{ fontSize: '16px', color: '#10b981' }} />
            )}
          </div>
          <div className="upload-indicator-info">
            <div className="upload-indicator-title">
              {activeUploads.length > 0
                ? `Uploading ${activeUploads.length} file${activeUploads.length > 1 ? 's' : ''}...`
                : uploads.some((u) => u.status === 'error')
                  ? 'Upload failed'
                  : 'Upload complete'
              }
            </div>
            <div className="upload-indicator-subtitle">
              {activeUploads.length > 0 ? `${totalProgress}% complete` : 'Tap to dismiss'}
            </div>
          </div>
          <button className="upload-indicator-close" onClick={(e) => {
            e.stopPropagation();
            uploads.forEach((u) => dismissUpload(u.id));
          }}>
            <IonIcon icon={close} style={{ fontSize: '12px', color: '#6b7280' }} />
          </button>
        </div>

        <div className={`upload-indicator-bar`}>
          <div
            className={`upload-indicator-bar-fill ${
              uploads.some((u) => u.status === 'error') ? 'error' :
              activeUploads.length === 0 ? 'success' : ''
            }`}
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {uploads.length > 1 && (
          <div className={`upload-indicator-items ${expanded ? 'expanded' : ''}`}>
            {uploads.map((u) => (
              <div key={u.id} className="upload-indicator-item">
                <IonIcon
                  icon={u.status === 'success' ? checkmarkCircle : u.status === 'error' ? alertCircle : cloudUpload}
                  className="upload-indicator-item-icon"
                  style={{ color: u.status === 'success' ? '#10b981' : u.status === 'error' ? '#ef4444' : '#6366f1' }}
                />
                <span className="upload-indicator-item-label">{u.label}</span>
                <span className={`upload-indicator-item-progress ${u.status}`}>
                  {u.status === 'success' ? 'Done' : u.status === 'error' ? 'Failed' : `${u.progress}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UploadIndicator;

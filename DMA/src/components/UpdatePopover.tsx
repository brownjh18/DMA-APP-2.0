import React, { useEffect, useState } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { close, cloudDownload, checkmarkCircle } from 'ionicons/icons';
import { useAppUpdate } from '../contexts/AppUpdateContext';
import { useSettings } from '../contexts/SettingsContext';
import './UpdatePopover.css';

const UpdatePopover: React.FC = () => {
  const {
    hasUpdate,
    forceUpdate,
    currentVersion,
    latestVersion,
    releaseDate,
    releaseNotes,
    updateUrl,
    checkForUpdate,
  } = useAppUpdate();

  const { isDarkMode } = useSettings();

  const [showPopover, setShowPopover] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);

  useEffect(() => {
    const shouldShow = hasUpdate && !hasCheckedOnMount;
    if (shouldShow) {
      setShowPopover(true);
      setHasCheckedOnMount(true);
    }
  }, [hasUpdate, hasCheckedOnMount]);

  const handleInstall = () => {
    if (updateUrl) {
      window.open(updateUrl, '_blank');
    }
  };

  const handleDismiss = () => {
    setShowPopover(false);
    if (!forceUpdate) {
      setHasCheckedOnMount(true);
    }
  };

  const handleCheckAgain = async () => {
    await checkForUpdate();
    setShowPopover(false);
  };

  if (!showPopover) return null;

  const themeClass = isDarkMode ? 'up-dark' : 'up-light';

  return (
    <div className={`up-overlay ${themeClass} ${forceUpdate ? 'up-force' : ''}`} onClick={forceUpdate ? () => {} : handleDismiss}>
      <div className="up-popover" onClick={(e) => e.stopPropagation()}>
        <button className="up-close-btn" onClick={handleDismiss} disabled={forceUpdate}>
          <IonIcon icon={close} />
        </button>

        <div className={`up-icon ${forceUpdate ? 'up-icon-warning' : 'up-icon-normal'}`}>
          <IonIcon icon={forceUpdate ? cloudDownload : checkmarkCircle} />
        </div>

        <h2 className="up-title">
          {forceUpdate ? 'Update Required' : 'Update Available'}
        </h2>

        <div className="up-version-badge">
          <span className="up-ver-old">v{currentVersion}</span>
          <span className="up-ver-arrow">→</span>
          <span className="up-ver-new">v{latestVersion}</span>
        </div>

        {releaseDate && (
          <span className="up-date">Released {releaseDate}</span>
        )}

        {forceUpdate ? (
          <>
            <p className="up-force-text">
              This version is no longer supported. Please update to continue using the app.
            </p>
            <IonButton 
              className="up-install-btn" 
              expand="block" 
              onClick={handleInstall}
              aria-label="Install update now"
            >
              Install Update
            </IonButton>
          </>
        ) : (
          <>
            <IonButton 
              className="up-install-btn" 
              expand="block" 
              onClick={handleInstall}
              aria-label="Install update now"
            >
              Install Update
            </IonButton>
            <IonButton 
              className="up-check-btn" 
              expand="block" 
              fill="outline"
              onClick={handleCheckAgain}
              aria-label="Check for updates again"
            >
              Check Again Later
            </IonButton>
            <p className="up-hint">You'll be redirected to the Play Store.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdatePopover;
import React, { useContext } from "react";
import { IonIcon, IonButton } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  homeOutline,
  playCircleOutline,
  bookOutline,
  personCircleOutline,
  calendarOutline,
  peopleOutline,
  chatbubbleEllipsesOutline,
  cardOutline,
  informationCircleOutline,
  settingsOutline,
  closeOutline,
  heartOutline,
  logOutOutline,
  cloudDownloadOutline,
} from "ionicons/icons";
import { AuthContext } from "../App";
import { BACKEND_BASE_URL } from "../services/api";


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const history = useHistory();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigateTo = (path: string) => {
    history.push(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* INLINE CSS */}
      <style>{`
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0);
          z-index: 9998;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease-in-out;
        }

        .sidebar-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .floating-sidebar {
          position: fixed;
          top: 15%;
          bottom: 25%;
          left: -400px;
          width: 78%;
          max-width: 320px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--ion-color-medium);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          background: rgba(var(--ion-background-color-rgb), 0.55);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          z-index: 9999;
          transition: left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 576px) {
          .floating-sidebar {
            width: 85%;
            max-width: 280px;
            padding: 16px;
            top: 12%;
            bottom: 11%;
          }

          .profile-box {
            padding: 10px;
            margin-bottom: 16px;
          }

          .profile-avatar {
            width: 50px;
            height: 50px;
          }

          .profile-info h3 {
            font-size: 1rem;
          }

          .profile-info p {
            font-size: 0.8rem;
          }

          .nav-item {
            padding: 10px 12px;
          }

          .nav-item span {
            font-size: 0.9rem;
          }
        }

        .floating-sidebar.open {
          left: 12px;
        }

        .close-button {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(var(--ion-background-color-rgb), 0.3);
          border: 1px solid var(--ion-color-step-200);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease-in-out;
          z-index: 10000;
        }

        .close-button:hover {
          background: rgba(var(--ion-background-color-rgb), 0.5);
          transform: scale(1.1);
        }

        .close-button ion-icon {
          font-size: 18px;
        }

        .profile-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(var(--ion-background-color-rgb), 0.4);
          border: 1px solid var(--ion-color-step-150);
          margin-bottom: 20px;
        }

        .profile-avatar {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 2px solid var(--ion-color-primary);
          background: black;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .profile-info h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .profile-info p {
          margin: 0;
          opacity: 0.7;
          font-size: 0.85rem;
        }

        .signin-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-list {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }

        .nav-list::-webkit-scrollbar {
          width: 4px;
        }

        .nav-list::-webkit-scrollbar-track {
          background: rgba(var(--ion-background-color-rgb), 0.1);
          border-radius: 2px;
        }

        .nav-list::-webkit-scrollbar-thumb {
          background: var(--ion-color-step-400);
          border-radius: 2px;
        }

        .nav-list::-webkit-scrollbar-thumb:hover {
          background: var(--ion-color-step-500);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(var(--ion-background-color-rgb), 0.3);
          border: 1px solid var(--ion-color-step-200);
          cursor: pointer;
          transition: 0.2s ease-in-out;
        }

        .nav-item:hover {
          transform: scale(1.03);
          background: rgba(var(--ion-background-color-rgb), 0.45);
        }

        .nav-item ion-icon {
          font-size: 22px;
        }

        .nav-item span {
          font-size: 1rem;
          font-weight: 500;
        }

        @media (prefers-color-scheme: dark) {
          .floating-sidebar {
            border-color: rgba(255,255,255,0.18);
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          }
          .profile-box,
          .nav-item {
            border-color: rgba(255,255,255,0.18);
          }
        }
      `}</style>

      {/* SIDEBAR OVERLAY */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

      {/* SIDEBAR CONTENT */}
      <div className={`floating-sidebar ${isOpen ? 'open' : ''}`}>

        {/* Close Button */}
        <div className="close-button" onClick={onClose}>
          <IonIcon icon={closeOutline} />
        </div>

        {/* Profile Preview */}
        <div className="profile-box">
          {user ? (
            <>
              <img
                src={user.profilePicture ? `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}` : 'https://i.pravatar.cc/150?img=12'}
                alt="profile"
                className="profile-avatar"
              />
              <div className="profile-info">
                <h3>{user.name}</h3>
                <p>{user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Moderator' : 'Member'}</p>
              </div>
            </>
          ) : (
            <div className="signin-section">
              <IonIcon icon={personCircleOutline} style={{ fontSize: '2.5em', color: 'var(--ion-text-color)' }} />
              <IonButton
                fill="outline"
                size="default"
                onClick={() => navigateTo('/signin')}
                style={{ fontSize: '0.9em' }}
              >
                Sign In
              </IonButton>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <div className="nav-list">
          <div
            className="nav-item"
            onClick={() => navigateTo('/favorites')}
            style={isActive('/favorites') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={heartOutline} style={isActive('/favorites') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/favorites') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Favorites</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigateTo('/events')}
            style={isActive('/events') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={calendarOutline} style={isActive('/events') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/events') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Events</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigateTo('/ministries')}
            style={isActive('/ministries') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={peopleOutline} style={isActive('/ministries') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/ministries') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Ministries</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigateTo('/prayer')}
            style={isActive('/prayer') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={chatbubbleEllipsesOutline} style={isActive('/prayer') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/prayer') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Prayer Request</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigateTo('/giving')}
            style={isActive('/giving') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={cardOutline} style={isActive('/giving') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/giving') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Giving</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigateTo('/tab5')}
            style={isActive('/tab5') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={informationCircleOutline} style={isActive('/tab5') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/tab5') ? { color: '#3b82f6', fontWeight: '600' } : {}}>About & Contact</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigateTo('/settings')}
            style={isActive('/settings') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
          >
            <IonIcon icon={settingsOutline} style={isActive('/settings') ? { color: '#3b82f6' } : {}} />
            <span style={isActive('/settings') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Settings</span>
          </div>

          {user && user.role === 'admin' && (
            <div
              className="nav-item"
              onClick={() => navigateTo('/admin')}
              style={isActive('/admin') ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' } : {}}
            >
              <IonIcon icon={settingsOutline} style={isActive('/admin') ? { color: '#3b82f6' } : {}} />
              <span style={isActive('/admin') ? { color: '#3b82f6', fontWeight: '600' } : {}}>Admin Dashboard</span>
            </div>
          )}

          {user && (
            <div className="nav-item" onClick={handleLogout} style={{ marginTop: '10px', borderTop: '1px solid var(--ion-color-step-200)', paddingTop: '16px' }}>
              <IonIcon icon={logOutOutline} />
              <span>Logout</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
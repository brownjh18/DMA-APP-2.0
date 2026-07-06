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
  notificationsOutline,
} from "ionicons/icons";
import { AuthContext } from "../App";
import { BACKEND_BASE_URL } from "../services/api";
import NotificationBell from "./NotificationBell";


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
          color: #1a1a1a !important;
        }

        .floating-sidebar .nav-item span,
        .floating-sidebar .nav-item ion-icon,
        .floating-sidebar .profile-info h3,
        .floating-sidebar .profile-info p,
        .floating-sidebar .close-button ion-icon,
        .floating-sidebar .signin-section ion-icon {
          color: #1a1a1a !important;
        }

        .floating-sidebar ion-button {
          --color: #1a1a1a !important;
        }

        .floating-sidebar .nav-item.active span,
        .floating-sidebar .nav-item.active ion-icon {
          color: #3b82f6 !important;
        }

        .floating-sidebar .nav-item.active {
          background-color: rgba(59, 130, 246, 0.2) !important;
          border: 1px solid #3b82f6 !important;
        }

        [data-theme="dark"] .floating-sidebar {
          color: #e5e5e5 !important;
        }

        [data-theme="dark"] .floating-sidebar .nav-item span,
        [data-theme="dark"] .floating-sidebar .nav-item ion-icon,
        [data-theme="dark"] .floating-sidebar .profile-info h3,
        [data-theme="dark"] .floating-sidebar .profile-info p,
        [data-theme="dark"] .floating-sidebar .close-button ion-icon,
        [data-theme="dark"] .floating-sidebar .signin-section ion-icon {
          color: #e5e5e5 !important;
        }

        [data-theme="dark"] .floating-sidebar ion-button {
          --color: #e5e5e5 !important;
        }

        [data-theme="dark"] .floating-sidebar .nav-item.active span,
        [data-theme="dark"] .floating-sidebar .nav-item.active ion-icon {
          color: #60a5fa !important;
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
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(var(--ion-color-primary-rgb), 0.12), rgba(var(--ion-color-primary-rgb), 0.04));
          border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
          margin-bottom: 20px;
          transition: all 0.2s ease;
        }

        .profile-box[style*="pointer"]:hover {
          transform: scale(1.02);
          background: linear-gradient(135deg, rgba(var(--ion-color-primary-rgb), 0.2), rgba(var(--ion-color-primary-rgb), 0.08));
        }

        .profile-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 2px solid var(--ion-color-primary);
          background: black;
          object-fit: cover;
          flex-shrink: 0;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          min-width: 0;
        }

        .profile-info h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .profile-info p {
          margin: 0;
          font-size: 0.78rem;
          opacity: 0.6;
          font-weight: 500;
          letter-spacing: 0.02em;
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
          border: 1px solid #aaa !important;
          cursor: pointer;
          transition: 0.2s ease-in-out;
        }

        .nav-item:hover {
          transform: scale(1.03);
          background: rgba(var(--ion-background-color-rgb), 0.45);
        }

        [data-theme="dark"] .nav-item {
          border-color: rgba(255, 255, 255, 0.18) !important;
        }

        .nav-item ion-icon {
          font-size: 22px;
        }

        .nav-item span {
          font-size: 1rem;
          font-weight: 500;
        }

        [data-theme="dark"] .floating-sidebar {
          color: #e5e5e5;
        }

        @media (prefers-color-scheme: dark) {
          .floating-sidebar {
            color: #e5e5e5;
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

        {/* Profile Preview */}
        <div
          className="profile-box"
          style={user ? { cursor: 'pointer' } : {}}
          onClick={() => {
            if (user) {
              navigateTo('/profile');
            }
          }}
        >
          {user ? (
            <>
              <img
                src={user.profilePicture ? (user.profilePicture.startsWith('data:') ? user.profilePicture : `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}`) : 'https://i.pravatar.cc/150?img=12'}
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
                <IonIcon icon={personCircleOutline} style={{ fontSize: '2.5em' }} />
                <IonButton
                 fill="outline"
                 size="default"
                 onClick={() => {
                   onClose();
                   history.push({
                     pathname: '/signin',
                     state: { from: location }
                   });
                 }}
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
            className={`nav-item${isActive('/favorites') ? ' active' : ''}`}
            onClick={() => navigateTo('/favorites')}
          >
            <IonIcon icon={heartOutline} />
            <span>Favorites</span>
          </div>

          <div
            className={`nav-item${isActive('/events') ? ' active' : ''}`}
            onClick={() => navigateTo('/events')}
          >
            <IonIcon icon={calendarOutline} />
            <span>Events</span>
          </div>

          <div
            className={`nav-item${isActive('/ministries') ? ' active' : ''}`}
            onClick={() => navigateTo('/ministries')}
          >
            <IonIcon icon={peopleOutline} />
            <span>Ministries</span>
          </div>

          <div
            className={`nav-item${isActive('/prayer') ? ' active' : ''}`}
            onClick={() => navigateTo('/prayer')}
          >
            <IonIcon icon={chatbubbleEllipsesOutline} />
            <span>Prayer Request</span>
          </div>

          <div
            className={`nav-item${isActive('/giving') ? ' active' : ''}`}
            onClick={() => navigateTo('/giving')}
          >
            <IonIcon icon={cardOutline} />
            <span>Giving</span>
          </div>

          <div
            className={`nav-item${isActive('/tab5') ? ' active' : ''}`}
            onClick={() => navigateTo('/tab5')}
          >
            <IonIcon icon={informationCircleOutline} />
            <span>About & Contact</span>
          </div>

          <div
            className={`nav-item${isActive('/settings') ? ' active' : ''}`}
            onClick={() => navigateTo('/settings')}
          >
            <IonIcon icon={settingsOutline} />
            <span>Settings</span>
          </div>

          {user && user.role === 'admin' && (
            <div
              className={`nav-item${isActive('/admin') ? ' active' : ''}`}
              onClick={() => navigateTo('/admin')}
            >
              <IonIcon icon={settingsOutline} />
              <span>Admin Dashboard</span>
            </div>
          )}

          <div
            className={`nav-item${isActive('/notifications') ? ' active' : ''}`}
            onClick={() => navigateTo('/notifications')}
          >
            <NotificationBell size="medium" />
            <span>Notifications</span>
          </div>

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
import { Redirect, Route, useLocation } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  home,
  playCircle,
  book,
  search,
  person,
  logIn,
  logOut,
  calendar,
  images,
  people,
  heart,
  settings,
  informationCircle,
  wallet,
  videocam,
  documentText,
  library,
  bookmark,
  time,
  shieldCheckmark,
  radio,
  radioButtonOn,
  menu
} from 'ionicons/icons';
import { StatusBar, Style } from '@capacitor/status-bar';
import React, { useEffect, useState } from 'react';
import apiService from './services/api';
import { PlayerProvider } from './contexts/PlayerContext';

// Create Auth Context
export const AuthContext = React.createContext<any>(null);
import MiniPlayer from './components/MiniPlayer';
import FloatingSearchIcon from './components/FloatingSearchIcon';
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import './components/FloatingSearchIcon.css';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab5 from './pages/Tab5';
import FullDevotion from './pages/FullDevotion';
import Profile from './pages/Profile';
import MyFavorites from './pages/MyFavorites';
import ReadingHistory from './pages/ReadingHistory';
import WatchHistory from './pages/WatchHistory';
import PrayerRequest from './pages/PrayerRequest';
import AdminDashboard from './pages/AdminDashboard';
import Events from './pages/Events';
import Giving from './pages/Giving';
import Settings from './pages/Settings';
import Ministries from './pages/Ministries';
import MinistryDetail from './pages/MinistryDetail';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import EditProfile from './pages/EditProfile';
import Downloads from './pages/Downloads';
import AdminSermonManager from './pages/AdminSermonManager';
import AdminDevotionManager from './pages/AdminDevotionManager';
import AdminEventManager from './pages/AdminEventManager';
import AdminMinistryManager from './pages/AdminMinistryManager';
import AdminGivingManager from './pages/AdminGivingManager';
import AdminNewsManager from './pages/AdminNewsManager';
import AdminContactManager from './pages/AdminContactManager';
import AddSermon from './pages/AddSermon';
import AddDevotion from './pages/AddDevotion';
import AddEvent from './pages/AddEvent';
import AddMinistry from './pages/AddMinistry';
import AddDonation from './pages/AddDonation';
import AddNewsArticle from './pages/AddNewsArticle';
import AdminPrayerManager from './pages/AdminPrayerManager';
import AdminUserManager from './pages/AdminUserManager';
import AddUser from './pages/AddUser';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [authCheckTrigger, setAuthCheckTrigger] = useState<number>(0);

  useEffect(() => {
    // Set status bar to not overlay the webview
    StatusBar.setOverlaysWebView({ overlay: false });

    // Set status bar style based on system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateStatusBar = (isDark: boolean) => {
      if (isDark) {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#000000' });
      } else {
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    };

    // Set initial status bar style
    updateStatusBar(mediaQuery.matches);

    // Listen for theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      updateStatusBar(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    // Check if user is already logged in
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken) {
      apiService.setToken(savedToken);

      // If we have saved user data, use it immediately for better UX
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // Invalid user data, clear it
          localStorage.removeItem('user');
        }
      }

      // Note: Token verification removed to prevent automatic sign out
      // Users remain logged in until they manually logout
    }

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      setToken(response.token);
      setUser(response.user);
      apiService.setToken(response.token);
      localStorage.setItem('token', response.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiService.clearToken();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const authValue = {
    user,
    login,
    logout,
    updateUser,
    isLoggedIn,
    isAdmin
  };

  return (
    <AuthContext.Provider value={authValue}>
      <PlayerProvider>
        <IonApp>
          <IonReactRouter>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} />

          <IonRouterOutlet id="main-content">
            <Route exact path="/tab1">
              <Tab1 />
            </Route>
            <Route exact path="/tab2">
              <Tab2 />
            </Route>
            <Route exact path="/tab3">
              <Tab3 />
            </Route>
            <Route exact path="/full-devotion">
              <FullDevotion />
            </Route>
            <Route exact path="/tab5">
              <Tab5 />
            </Route>
            <Route exact path="/profile">
              <Profile />
            </Route>
            <Route exact path="/edit-profile">
              <EditProfile />
            </Route>
            <Route exact path="/favorites">
              <MyFavorites />
            </Route>
            <Route exact path="/reading-history">
              <ReadingHistory />
            </Route>
            <Route exact path="/watch-history">
              <WatchHistory />
            </Route>
            <Route exact path="/prayer">
              <PrayerRequest />
            </Route>
            <Route exact path="/events">
              <Events />
            </Route>
            <Route exact path="/giving">
              <Giving />
            </Route>
            <Route exact path="/settings">
              <Settings />
            </Route>
            <Route exact path="/ministries">
              <Ministries />
            </Route>
            <Route exact path="/ministry/:id">
              <MinistryDetail />
            </Route>
            <Route exact path="/admin">
              <AdminDashboard />
            </Route>
            <Route exact path="/signin">
              <SignIn />
            </Route>
            <Route exact path="/signup">
              <SignUp />
            </Route>
            <Route exact path="/downloads">
              <Downloads />
            </Route>
            <Route exact path="/admin/sermons">
              <AdminSermonManager />
            </Route>
            <Route exact path="/admin/devotions">
              <AdminDevotionManager />
            </Route>
            <Route exact path="/admin/events">
              <AdminEventManager />
            </Route>
            <Route exact path="/admin/ministries">
              <AdminMinistryManager />
            </Route>
            <Route exact path="/admin/giving">
              <AdminGivingManager />
            </Route>
            <Route exact path="/admin/news">
              <AdminNewsManager />
            </Route>
            <Route exact path="/admin/contact">
              <AdminContactManager />
            </Route>
            <Route exact path="/admin/sermons/add">
              <AddSermon />
            </Route>
            <Route exact path="/admin/devotions/add">
              <AddDevotion />
            </Route>
            <Route exact path="/admin/events/add">
              <AddEvent />
            </Route>
            <Route exact path="/admin/ministries/add">
              <AddMinistry />
            </Route>
            <Route exact path="/admin/giving/add">
              <AddDonation />
            </Route>
            <Route exact path="/admin/news/add">
              <AddNewsArticle />
            </Route>
            <Route exact path="/admin/prayer">
              <AdminPrayerManager />
            </Route>
            <Route exact path="/admin/users">
              <AdminUserManager />
            </Route>
            <Route exact path="/admin/users/add">
              <AddUser />
            </Route>
            <Route exact path="/">
              <Redirect to="/tab1" />
            </Route>
          </IonRouterOutlet>
          <BottomNavBar onSidebarToggle={() => setIsSidebarOpen(true)} />
          <MiniPlayer />
          <FloatingSearchIcon />
        </IonReactRouter>
      </IonApp>
    </PlayerProvider>
    </AuthContext.Provider>
  );
};

export default App;

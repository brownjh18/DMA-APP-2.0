import { Redirect, Route, useLocation, useHistory } from 'react-router-dom';

// Route Redirect Component - preserves current location on initial load
const RootRedirect: React.FC<{ isAuthChecking: boolean }> = ({ isAuthChecking }) => {
  const location = useLocation();

  // Always redirect from root path, even during auth checking
  if (location.pathname === '/') {
    return <Redirect to="/tab1" />;
  }

  return null;
};

// Protected Route Component
const ProtectedRoute: React.FC<{
  component: React.ComponentType<any>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthChecking: boolean;
  path: string;
  exact?: boolean;
}> = ({ component: Component, isAuthenticated, isAdmin, isAuthChecking, ...rest }) => {
  // Don't redirect while checking auth - stay on current page
  if (isAuthChecking) {
    return <Route {...rest} component={Component} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/signin" />;
  }

  if (!isAdmin) {
    return <Redirect to="/tab1" />;
  }

  return <Route {...rest} component={Component} />;
};

// Guest Route Component (only for non-authenticated users)
const GuestRoute: React.FC<{
  component: React.ComponentType<any>;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  path: string;
  exact?: boolean;
}> = ({ component: Component, isAuthenticated, isAuthChecking, ...rest }) => {
  // Don't redirect while checking auth - stay on current page
  if (isAuthChecking) {
    return <Route {...rest} component={Component} />;
  }

  if (isAuthenticated) {
    return <Redirect to="/tab1" />;
  }

  return <Route {...rest} component={Component} />;
};
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
import { Capacitor } from '@capacitor/core';
import React, { useEffect, useState } from 'react';
import apiService from './services/api';
import { PlayerProvider } from './contexts/PlayerContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { DownloadsProvider } from './contexts/DownloadsContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Create Auth Context
export const AuthContext = React.createContext<any>(null);
import MiniPlayer from './components/MiniPlayer';
import FloatingSearchIcon from './components/FloatingSearchIcon';
import OfflineIndicator from './components/OfflineIndicator';
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import BottomFadeEffect from './components/BottomFadeEffect';
import './components/FloatingSearchIcon.css';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';
import Tab5 from './pages/Tab5';
import FullDevotion from './pages/FullDevotion';
import Profile from './pages/Profile';
import PrayerRequest from './pages/PrayerRequest';
import AdminDashboard from './pages/AdminDashboard';
import Events from './pages/Events';
import Giving from './pages/Giving';
import Settings from './pages/Settings';
import Ministries from './pages/Ministries';
import MinistryDetail from './pages/MinistryDetail';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AuthCallback from './pages/AuthCallback';
import EditProfile from './pages/EditProfile';
import Saved from './pages/Saved';
import AdminSermonManager from './pages/AdminSermonManager';
import AdminDevotionManager from './pages/AdminDevotionManager';
import AdminEventManager from './pages/AdminEventManager';
import AdminMinistryManager from './pages/AdminMinistryManager';
import AdminGivingManager from './pages/AdminGivingManager';
import AdminNewsManager from './pages/AdminNewsManager';
import AdminContactManager from './pages/AdminContactManager';
import AddSermon from './pages/AddSermon';
import EditSermon from './pages/EditSermon';
import EditDevotion from './pages/EditDevotion';
import EditEvent from './pages/EditEvent';
import EditMinistry from './pages/EditMinistry';
import EditNewsArticle from './pages/EditNewsArticle';
import EditDonation from './pages/EditDonation';
import AddDevotion from './pages/AddDevotion';
import AddEvent from './pages/AddEvent';
import AddMinistry from './pages/AddMinistry';
import AddDonation from './pages/AddDonation';
import AddNewsArticle from './pages/AddNewsArticle';
import AdminPrayerManager from './pages/AdminPrayerManager';
import AdminUserManager from './pages/AdminUserManager';
import AdminRadioManager from './pages/AdminRadioManager';
import AdminGoLive from './pages/AdminGoLive';
import FullPodcastPlayer from './pages/FullPodcastPlayer';
import FullSermonPlayer from './pages/FullSermonPlayer';
import EventDetail from './pages/EventDetail';
import AddUser from './pages/AddUser';
import AddPodcast from './pages/AddPodcast';
import EditPodcast from './pages/EditPodcast';
import EditLiveBroadcast from './pages/EditLiveBroadcast';
import MyFavorites from './pages/MyFavorites';
import WatchHistory from './pages/WatchHistory';
import ReadingHistory from './pages/ReadingHistory';

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
  const history = useHistory();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [authCheckTrigger, setAuthCheckTrigger] = useState<number>(0);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  useEffect(() => {
    // Set status bar to not overlay the webview (only on native platforms)
    try {
      if ((window as any).Capacitor?.getPlatform() !== 'web') {
        StatusBar.setOverlaysWebView({ overlay: false });
      }
    } catch (error) {
      console.log('StatusBar not available on this platform');
    }

    // Set status bar style based on system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateStatusBar = (isDark: boolean) => {
      try {
        if ((window as any).Capacitor?.getPlatform() !== 'web') {
          if (isDark) {
            StatusBar.setStyle({ style: Style.Dark });
            StatusBar.setBackgroundColor({ color: '#000000' });
          } else {
            StatusBar.setStyle({ style: Style.Light });
            StatusBar.setBackgroundColor({ color: '#ffffff' });
          }
        }
      } catch (error) {
        console.log('StatusBar not available on this platform');
      }
    };

    // Set initial status bar style
    updateStatusBar(mediaQuery.matches);

    // Listen for theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      updateStatusBar(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    // Temporarily disable MutationObserver to test if it's causing freezing
    // Fix aria-hidden focus issue by adding inert to hidden pages
    const fixAriaHiddenFocus = () => {
      const hiddenPages = document.querySelectorAll('.ion-page.ion-page-hidden');
      if (hiddenPages.length > 0) {
        hiddenPages.forEach(page => {
          if (!page.hasAttribute('inert')) {
            page.setAttribute('inert', '');
          }
        });
      }
    };

    // Run initially
    fixAriaHiddenFocus();
    // Disabled MutationObserver for testing
    // const observer = new MutationObserver((mutations) => {
    //   const hasRelevantChanges = mutations.some(mutation =>
    //     mutation.type === 'attributes' &&
    //     mutation.attributeName === 'class' &&
    //     (mutation.target as Element).classList?.contains('ion-page')
    //   );
    //   if (hasRelevantChanges) {
    //     setTimeout(fixAriaHiddenFocus, 0);
    //   }
    // });
    // observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    // Set logout callback for API service
    apiService.setLogoutCallback(() => {
      console.log('API service triggered logout');
      logout();
    });

    // Check if user is already logged in
    const checkAuthStatus = async () => {
      console.log('🔍 Starting auth status check...');
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      try {
        if (savedToken) {
          console.log('📝 Found saved token, attempting to verify...');
          apiService.setToken(savedToken);

          // Verify token with backend
          try {
            console.log('🌐 Calling apiService.getProfile()...');
            const profileResponse = await apiService.getProfile();
            console.log('✅ Profile fetched successfully:', profileResponse);
            // Token is valid, set user data
            setUser(profileResponse.user);
            setToken(savedToken);
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(profileResponse.user));
            console.log('✅ Token verified, user logged in with fresh data:', profileResponse.user.role);
          } catch (error: any) {
            console.error('❌ Error during profile fetch:', error);
            // Check if it's an authentication error (401/403)
            if (error.message?.includes('Authentication failed') || error.message?.includes('HTTP 401') || error.message?.includes('HTTP 403')) {
              // Token is invalid or expired, clear stored data
              console.log('❌ Token invalid or expired, clearing stored auth data');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              apiService.clearToken();
              setToken(null);
              setUser(null);
            } else {
              // Network error or other issue
              console.log('⚠️ Network error during token verification, will retry...');
              // Don't set user data immediately, let the retry mechanism handle it
              setToken(savedToken);
              // Set a flag to indicate we need to retry
              setTimeout(() => {
                checkAuthStatus();
              }, 2000);
            }
          }
        } else {
          console.log('No saved token found');
          setUser(null);
          setToken(null);
        }
      } finally {
        // Always set auth checking to false after verification
        console.log('🔚 Auth check completed, setting isAuthChecking to false');
        setIsAuthChecking(false);
      }
    };

    checkAuthStatus();

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      // observer.disconnect(); // Disabled for testing
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      setToken(response.token);
      setUser(response.user);
      apiService.setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
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

    // Always redirect to home page after logout
    try {
      history.push('/tab1');
    } catch (error) {
      console.log('History push failed, using window.location');
      window.location.href = '/tab1';
    }
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Function to directly set authentication state (used for automatic login after registration)
  const setAuthState = (token: string, user: any) => {
    setToken(token);
    setUser(user);
    apiService.setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const authValue = {
    user,
    login,
    logout,
    updateUser,
    setAuthState,
    isLoggedIn,
    isAdmin
  };

  return (
    <SettingsProvider>
      <NetworkProvider>
        <DownloadsProvider>
          <NotificationProvider>
            <AuthContext.Provider value={authValue}>
              <PlayerProvider>
                <IonApp>
                  <OfflineIndicator />
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
                <Route exact path="/tab4">
                  <Tab4 />
                </Route>
                <Route exact path="/podcast-player">
                  <FullPodcastPlayer />
                </Route>
                <Route exact path="/sermon-player">
                  <FullSermonPlayer />
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
                <Route exact path="/prayer">
                  <PrayerRequest />
                </Route>
                <Route exact path="/events">
                  <Events />
                </Route>
                <Route exact path="/event/:id">
                  <EventDetail />
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
                <Route exact path="/favorites">
                  <MyFavorites />
                </Route>
                <Route exact path="/watch-history">
                  <WatchHistory />
                </Route>
                <Route exact path="/reading-history">
                  <ReadingHistory />
                </Route>
                <ProtectedRoute
                  path="/admin"
                  component={AdminDashboard}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <GuestRoute
                  path="/signin"
                  component={SignIn}
                  isAuthenticated={isLoggedIn}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <GuestRoute
                  path="/signup"
                  component={SignUp}
                  isAuthenticated={isLoggedIn}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <Route exact path="/auth/callback">
                  <AuthCallback />
                </Route>
                <Route exact path="/saved">
                  <Saved />
                </Route>
                <ProtectedRoute
                  path="/admin/sermons"
                  component={AdminSermonManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/devotions"
                  component={AdminDevotionManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/events"
                  component={AdminEventManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/ministries"
                  component={AdminMinistryManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/giving"
                  component={AdminGivingManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/news"
                  component={AdminNewsManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/contact"
                  component={AdminContactManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/sermons/add"
                  component={AddSermon}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/sermons/edit/:id"
                  component={EditSermon}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/devotions/edit/:id"
                  component={EditDevotion}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/events/edit/:id"
                  component={EditEvent}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/ministries/edit/:id"
                  component={EditMinistry}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/news/edit/:id"
                  component={EditNewsArticle}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/giving/edit/:id"
                  component={EditDonation}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/devotions/add"
                  component={AddDevotion}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/events/add"
                  component={AddEvent}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/ministries/add"
                  component={AddMinistry}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/giving/add"
                  component={AddDonation}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/news/add"
                  component={AddNewsArticle}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/prayer"
                  component={AdminPrayerManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/radio"
                  component={AdminRadioManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/live"
                  component={AdminGoLive}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/users"
                  component={AdminUserManager}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/users/add"
                  component={AddUser}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/radio/add"
                  component={AddPodcast}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/radio/edit/:id"
                  component={EditPodcast}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <ProtectedRoute
                  path="/admin/live/edit/:id"
                  component={EditLiveBroadcast}
                  isAuthenticated={isLoggedIn}
                  isAdmin={isAdmin}
                  isAuthChecking={isAuthChecking}
                  exact
                />
                <Route exact path="/">
                  <RootRedirect isAuthChecking={isAuthChecking} />
                </Route>
              </IonRouterOutlet>
              <BottomFadeEffect />
              <BottomNavBar onSidebarToggle={() => setIsSidebarOpen(true)} />
              <MiniPlayer />
              <FloatingSearchIcon />
              </IonReactRouter>
            </IonApp>
          </PlayerProvider>
        </AuthContext.Provider>
        </NotificationProvider>
      </DownloadsProvider>
    </NetworkProvider>
  </SettingsProvider>
  );
};

export default App;

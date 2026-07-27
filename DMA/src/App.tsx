import { Redirect, Route, useLocation, useHistory } from 'react-router-dom';

// Page title helper function (not a hook)
const getPageTitle = (pathname: string): string => {
  const PAGE_TITLES: Record<string, string> = {
    '/tab1': 'Home',
    '/tab2': 'Sermons',
    '/tab3': 'Devotions',
    '/tab4': 'Podcasts',
    '/tab5': 'Events',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/favorites': 'My Favorites',
    '/prayer': 'Prayer Requests',
    '/events': 'Events',
    '/giving': 'Giving',
    '/ministries': 'Ministries',
    '/search': 'Search',
    '/watch-history': 'Watch History',
    '/reading-history': 'Reading History',
    '/admin': 'Admin Dashboard',
  };
  
  // Find matching title
  let title = 'Dove Church';
  
  // Check for exact match first
  if (PAGE_TITLES[pathname]) {
    title = `Dove Church - ${PAGE_TITLES[pathname]}`;
  } else {
    // Check for dynamic routes
    if (pathname.startsWith('/ministry/')) {
      title = 'Dove Church - Ministry';
    } else if (pathname.startsWith('/event/')) {
      title = 'Dove Church - Event';
    } else if (pathname.startsWith('/admin/sermons/edit/')) {
      title = 'Dove Church - Edit Sermon';
    } else if (pathname.startsWith('/admin/devotions/edit/')) {
      title = 'Dove Church - Edit Devotion';
    } else if (pathname.startsWith('/admin/events/edit/')) {
      title = 'Dove Church - Edit Event';
    } else if (pathname.startsWith('/admin/ministries/edit/')) {
      title = 'Dove Church - Edit Ministry';
    } else if (pathname.startsWith('/admin/sermons/add')) {
      title = 'Dove Church - Add Sermon';
    } else if (pathname.startsWith('/admin/devotions/add')) {
      title = 'Dove Church - Add Devotion';
    } else if (pathname.startsWith('/admin/events/add')) {
      title = 'Dove Church - Add Event';
    } else if (pathname.startsWith('/admin/ministries/add')) {
      title = 'Dove Church - Add Ministry';
    } else if (pathname.startsWith('/admin/users/add')) {
      title = 'Dove Church - Add User';
    } else if (pathname.startsWith('/admin/radio/add')) {
      title = 'Dove Church - Add Podcast';
    } else if (pathname.startsWith('/admin/radio/edit/')) {
      title = 'Dove Church - Edit Podcast';
    } else if (pathname.startsWith('/admin/live/edit/')) {
      title = 'Dove Church - Edit Broadcast';
    } else if (pathname.includes('/full-devotion')) {
      title = 'Dove Church - Devotion';
    } else if (pathname.includes('/podcast-player')) {
      title = 'Dove Church - Podcast Player';
    } else if (pathname.includes('/sermon-player')) {
      title = 'Dove Church - Sermon Player';
    } else if (pathname.includes('/edit-profile')) {
      title = 'Dove Church - Edit Profile';
    } else if (pathname.includes('/auth/callback')) {
      title = 'Dove Church - Authentication';
    }
  }
  
  return title;
};

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
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppUpdateProvider } from './contexts/AppUpdateContext';

// Create Auth Context
export const AuthContext = React.createContext<any>(null);
import MiniPlayer from './components/MiniPlayer';
import SermonMiniPlayer from './components/SermonMiniPlayer';
import AudioPlayer from './components/AudioPlayer';
import FloatingSearchIcon from './components/FloatingSearchIcon';
import OfflineIndicator from './components/OfflineIndicator';
import ProgressOverlay from './components/ProgressOverlay';
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
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
import MyFavorites from './pages/MyFavorites';
import AdminSermonManager from './pages/AdminSermonManager';
import AdminDevotionManager from './pages/AdminDevotionManager';
import AdminEventManager from './pages/AdminEventManager';
import AdminMinistryManager from './pages/AdminMinistryManager';
import AdminContactManager from './pages/AdminContactManager';
import AddSermon from './pages/AddSermon';
import EditSermon from './pages/EditSermon';
import EditDevotion from './pages/EditDevotion';
import EditEvent from './pages/EditEvent';
import EditMinistry from './pages/EditMinistry';
import AddDevotion from './pages/AddDevotion';
import AddEvent from './pages/AddEvent';
import AddMinistry from './pages/AddMinistry';
import AdminUserManager from './pages/AdminUserManager';
import AdminRadioManager from './pages/AdminRadioManager';
import AdminGoLive from './pages/AdminGoLive';
import FullPodcastPlayer from './pages/FullPodcastPlayer';
import FullSermonPlayer from './pages/FullSermonPlayer';
import EventDetail from './pages/EventDetail';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import AddPodcast from './pages/AddPodcast';
import EditPodcast from './pages/EditPodcast';
import EditLiveBroadcast from './pages/EditLiveBroadcast';
import WatchHistory from './pages/WatchHistory';
import ReadingHistory from './pages/ReadingHistory';
import Search from './pages/Search';
import Notifications from './pages/Notifications';

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
import '@ionic/react/css/palettes/dark.class.css';
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  console.log('🎯 App.tsx: App component rendering');
  const history = useHistory();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
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

    // Set status bar style based on theme
    const updateStatusBarFromTheme = () => {
      try {
        if ((window as any).Capacitor?.getPlatform() !== 'web') {
          const root = document.documentElement;
          const dataTheme = root.getAttribute('data-theme');
          let isDark = false;
          
          if (dataTheme === 'dark') {
            isDark = true;
          } else if (dataTheme === 'light') {
            isDark = false;
          } else {
            // System preference
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          }
          
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
    updateStatusBarFromTheme();

    // Listen for theme attribute changes using MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateStatusBarFromTheme();
          break;
        }
      }
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

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
          // Discard oversized tokens (old tokens may have contained base64 profilePicture)
          if (savedToken.length > 2000) {
            console.warn('⚠️ Token too large, discarding. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthChecking(false);
            return;
          }
          console.log('📝 Found saved token, attempting to verify...');
          apiService.setToken(savedToken);

          // If we have a saved user, set them immediately (don't wait for API)
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
              setToken(savedToken);
              console.log('✅ User set from localStorage:', parsedUser.role);
            } catch (e) {
              console.warn('Failed to parse saved user:', e);
            }
          }

          // Verify token with backend in background
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
            // Sync saved items from server to localStorage
            await syncSavedItems();
          } catch (error: any) {
            console.error('❌ Error during profile fetch:', error);
            // Check if it's a definite authentication error (401/403)
            const isAuthError = error.message?.includes('Authentication failed') || 
                                error.message?.includes('HTTP 401') || 
                                error.message?.includes('HTTP 403') ||
                                error.message?.includes('401') ||
                                error.message?.includes('403') ||
                                error.status === 401 ||
                                error.status === 403;
            
            if (isAuthError) {
              // Token is definitely invalid, clear stored data
              console.log('❌ Token invalid or expired, clearing stored auth data');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              apiService.clearToken();
              setToken(null);
              setUser(null);
            } else {
              // Network error or other issue - keep user logged in with cached data
              console.log('⚠️ Network error during token verification, keeping user logged in with cached data');
              // User stays logged in with the data from localStorage
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
      observer.disconnect();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Login attempt for:', email);
      const response = await apiService.login(email, password);
      console.log('✅ Login successful, token received', response);
      console.log('📋 User data received:', response.user);
      
      // Set state first
      setToken(response.token);
      setUser(response.user);
      apiService.setToken(response.token);
      console.log('✅ State updated, user:', response.user?.name);
      
      // Save to localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log('✅ Token and user saved to localStorage');
      
      // Sync saved items from server to localStorage after login (non-blocking)
      // Wrap in a separate try-catch to ensure login completes even if sync fails
      setTimeout(() => {
        syncSavedItems().catch(err => {
          console.warn('⚠️ Failed to sync saved items after login (non-critical):', err);
        });
      }, 500);
      
      console.log('✅ Login complete');
    } catch (error: any) {
      console.error('❌ Login failed:', error.message);
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

// Function to sync saved items from server to localStorage
   const syncSavedItems = async () => {
     try {
       console.log('Syncing saved items from server...');
       
       // Temporarily disable logout during sync to prevent auto-logout
       const originalLogoutCallback = (apiService as any).logoutCallback;
       (apiService as any).logoutCallback = null;
       
       try {
         // Fetch saved sermons
         try {
           const sermonsResponse = await apiService.getSavedSermons();
           if (sermonsResponse.savedSermons) {
             const formattedSermons = sermonsResponse.savedSermons.map((s: any) => ({
               id: s._id,
               _id: s._id,
               title: s.title,
               speaker: s.speaker,
               description: s.description,
               thumbnailUrl: s.thumbnailUrl,
               videoUrl: s.videoUrl,
               duration: s.duration,
               date: s.date,
               scripture: s.scripture,
               series: s.series,
               type: 'sermon'
             }));
             localStorage.setItem('savedSermons', JSON.stringify(formattedSermons));
             console.log(`Synced ${formattedSermons.length} saved sermons`);
           }
         } catch (error) {
           console.warn('Failed to sync saved sermons (non-critical):', error);
         }

         // Fetch saved podcasts
         try {
           const podcastsResponse = await apiService.getSavedPodcasts();
           if (podcastsResponse.savedPodcasts) {
             const formattedPodcasts = podcastsResponse.savedPodcasts.map((p: any) => ({
               id: p._id,
               _id: p._id,
               title: p.title,
               speaker: p.speaker,
               description: p.description,
               thumbnailUrl: p.thumbnailUrl,
               audioUrl: p.audioUrl,
               duration: p.duration,
               publishedAt: p.publishedAt
             }));
             localStorage.setItem('savedPodcasts', JSON.stringify(formattedPodcasts));
             console.log(`Synced ${formattedPodcasts.length} saved podcasts`);
           }
         } catch (error) {
           console.warn('Failed to sync saved podcasts (non-critical):', error);
         }

         // Fetch saved devotions
         try {
           const devotionsResponse = await apiService.getSavedDevotions();
           if (devotionsResponse.savedDevotions) {
             const formattedDevotions = devotionsResponse.savedDevotions.map((d: any) => ({
               id: d._id,
               _id: d._id,
               title: d.title,
               scripture: d.scripture,
               content: d.content,
               reflection: d.reflection,
               prayer: d.prayer,
               author: d.author,
               thumbnailUrl: d.thumbnailUrl,
               publishedAt: d.createdAt || d.date
             }));
             localStorage.setItem('savedDevotions', JSON.stringify(formattedDevotions));
             console.log(`Synced ${formattedDevotions.length} saved devotions`);
           }
         } catch (error) {
           console.warn('Failed to sync saved devotions (non-critical):', error);
         }

         console.log('Saved items sync completed');
       } finally {
         // Restore logout callback
         (apiService as any).logoutCallback = originalLogoutCallback;
       }
     } catch (error) {
       console.error('Error syncing saved items:', error);
     }
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
    isAdmin,
    isAuthChecking
  };

  // PageTitleUpdater component - updates document.title based on route
  const PageTitleUpdater: React.FC = () => {
    const location = useLocation();
    
    useEffect(() => {
      document.title = getPageTitle(location.pathname);
    }, [location.pathname]);
    
    return null;
  };

  return (
    <SettingsProvider>
    <NotificationProvider>
      <AppUpdateProvider>
      <NetworkProvider>
        <DownloadsProvider>
          <SocketProvider>
            <AuthContext.Provider value={authValue}>
              <PlayerProvider>
                <IonApp>
                  <OfflineIndicator />
                  <IonReactRouter>
                    <PageTitleUpdater />
                    <AudioPlayer />
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
                <Route exact path="/full-podcast-player">
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
                <Route exact path="/search">
                  <Search />
                </Route>
                <Route exact path="/notifications">
                  <Notifications />
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
                  path="/admin/users/edit/:id"
                  component={EditUser}
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
              <BottomNavBar onSidebarToggle={() => setIsSidebarOpen(true)} />
              <MiniPlayer />
              <SermonMiniPlayer />
              <FloatingSearchIcon />
              <ProgressOverlay />
              </IonReactRouter>
              <div className="bottom-nav-fade" aria-hidden="true" />
            </IonApp>
          </PlayerProvider>
        </AuthContext.Provider>
        </SocketProvider>
      </DownloadsProvider>
    </NetworkProvider>
    </AppUpdateProvider>
  </NotificationProvider>
  </SettingsProvider>
 );
};

export default App;
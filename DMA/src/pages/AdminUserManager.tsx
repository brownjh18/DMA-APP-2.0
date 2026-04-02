import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  IonActionSheet,
  IonFab,
  IonFabButton,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import BackButton from '../components/BackButton';
import {
  add,
  trash,
  people,
  person,
  checkmarkCircle,
  closeCircle,
  calendar,
  ellipsisVertical,
  arrowBack,
  shield,
  search,
  closeCircle as closeIcon,
  settings,
  create,
  eye,
  eyeOff
} from 'ionicons/icons';
import apiService from '../services/api';
import { useNetwork } from '../contexts/NetworkContext';
import { AuthContext } from '../App';
import './Tab4.css';

const AdminUserManager: React.FC = () => {
  const history = useHistory();
  const { isOnline } = useNetwork();
  const { updateUser: updateAuthUser } = useContext(AuthContext);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date');

  // Protected admin email
  const protectedAdminEmail = 'brownjh18@gmail.com';

  // Helper function to clear API cache for users
  const clearUsersCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') && key.includes('/users')) {
          localStorage.removeItem(key);
          console.log('🗑️ Cleared cache:', key);
        }
      });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  };

  // Utility function to handle API errors gracefully
  const handleApiError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      console.log(`🗑️ Resource not found during ${action}, clearing cache and refreshing`);
      clearUsersCache();
      sessionStorage.setItem('usersNeedRefresh', 'true');
      setTimeout(() => loadUsers(true), 1000);
      return true; // Error was handled
    }
    
    return false; // Error was not handled, show generic message
  };

  // Check if user data might be stale and needs refresh
  const isDataStale = () => {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('api_cache_') && key.includes('/users')
      );
      
      for (const key of cacheKeys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          const maxAge = 5 * 60 * 1000; // 5 minutes
          
          if (age > maxAge) {
            console.log(`📅 Cache data is stale (${Math.round(age / 1000 / 60)} minutes old), will refresh`);
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('Error checking cache age:', error);
    }
    return false;
  };

  useEffect(() => {
    // Check if refresh is needed on component mount
    const needsRefresh = sessionStorage.getItem('usersNeedRefresh') === 'true';
    const staleData = isDataStale();
    const shouldRefresh = needsRefresh || staleData;
    
    console.log('📱 AdminUserManager mounted, needsRefresh:', needsRefresh, 'staleData:', staleData);
    loadUsers(shouldRefresh);
  }, []);

  useEffect(() => {
    if (isOnline) {
      const needsRefresh = sessionStorage.getItem('usersNeedRefresh') === 'true';
      loadUsers(needsRefresh);
    }
  }, [isOnline]);

  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('usersNeedRefresh') === 'true';
    if (needsRefresh) {
      console.log('🔄 Refreshing users due to navigation back from add/edit page');
      loadUsers(true);
    } else if (users.length === 0) {
      loadUsers();
    }
  });

  const loadUsers = async (forceRefresh = false) => {
    const needsRefresh = sessionStorage.getItem('usersNeedRefresh') === 'true';
    
    if (!forceRefresh && !needsRefresh && usersLoading) return;

    try {
      setUsersLoading(true);
      setLoading(true);
      console.log('Starting to load users...');
      
      if (needsRefresh) {
        sessionStorage.removeItem('usersNeedRefresh');
        console.log('🔄 Refresh flag detected and cleared');
        clearUsersCache();
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const apiPromise = apiService.getUsers();
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('Users loaded successfully:', response);
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      
      if (!handleApiError(error, 'loading users')) {
        let errorMessage = 'Failed to load users';
        if (error.message?.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message?.includes('Authentication failed') || error.message?.includes('HTTP 401')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message?.includes('HTTP 403')) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (error.message) {
          errorMessage = `Failed to load users: ${error.message}`;
        }
        
        setAlertMessage(errorMessage);
        setShowAlert(true);
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setUsersLoading(false);
      console.log('Loading users completed');
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadUsers();
    event.detail.complete();
  };

  const toggleActive = async (id: string) => {
    try {
      const user = users.find(u => u._id === id || u.id === id);
      if (!user) {
        setAlertMessage('User not found');
        setShowAlert(true);
        return;
      }

      if (isProtectedAdmin(user)) {
        setAlertMessage('The default admin account cannot be deactivated');
        setShowAlert(true);
        return;
      }

      const newStatus = !user.isActive;
      console.log(`${newStatus ? 'Activating' : 'Deactivating'} user ${user.name} (${user.email})`);
  
      const response = await apiService.updateUser(id, { isActive: newStatus });
  
      if (response.user) {
        setUsers(users.map(user => {
          const currentUserId = user._id || user.id;
          if (currentUserId === id) {
            return { ...user, ...response.user };
          }
          return user;
        }));
      } else {
        setUsers(users.map(u =>
          (u._id === id || u.id === id)
            ? { ...u, isActive: newStatus }
            : u
        ));
      }
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.id || currentUser._id;
      if (currentUserId === id && !newStatus) {
        console.log('🔄 Currently logged-in user was deactivated, logging out');
        setTimeout(() => {
          try {
            history.push('/signin');
          } catch (error) {
            console.log('History push failed, using window.location');
            window.location.href = '/signin';
          }
        }, 1000);
      }

      setAlertMessage(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setShowAlert(true);
      
      sessionStorage.setItem('usersNeedRefresh', 'true');
      setTimeout(() => loadUsers(true), 500);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      
      if (!handleApiError(error, 'updating user status')) {
        let errorMessage = 'Failed to update user status';
        if (error.message?.includes('Authentication failed') || error.message?.includes('HTTP 401')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message?.includes('HTTP 403')) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (error.message?.includes('HTTP 404')) {
          errorMessage = 'User not found. The user may have been deleted.';
        } else if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
          errorMessage = `Failed to update user status: ${error.message}`;
        }
        
        setAlertMessage(errorMessage);
        setShowAlert(true);
      }
    }
  };

  const openRoleModal = (user: any) => {
    if (isProtectedAdmin(user)) {
      setAlertMessage('The default admin account role cannot be changed');
      setShowAlert(true);
      return;
    }
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const changeRole = async (newRole: string) => {
    if (selectedUser) {
      try {
        const userId = selectedUser._id || selectedUser.id;
        
        if (!['user', 'admin'].includes(newRole)) {
          setAlertMessage('Invalid role specified');
          setShowAlert(true);
          return;
        }

        console.log(`🔄 Changing role for user ${userId} from ${selectedUser.role} to ${newRole}`);
        
        const response = await apiService.updateUser(userId, { role: newRole });
        console.log('✅ Backend response:', response);

        if (response.user) {
          setUsers(users.map(user => {
            const currentUserId = user._id || user.id;
            if (currentUserId === userId) {
              console.log(`🔄 Updating local state for user ${user.name}: ${user.role} → ${response.user.role}`);
              return { ...user, ...response.user };
            }
            return user;
          }));
          
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserId = currentUser.id || currentUser._id;
          if (currentUserId === userId) {
            console.log('🔄 Updating currently logged-in user in auth context');
            updateAuthUser(response.user);
          }
        } else {
          const updatedUserData = users.find(u => (u._id === userId || u.id === userId));
          setUsers(users.map(user =>
            (user._id === userId || user.id === userId)
              ? { ...user, role: newRole }
              : user
          ));
          
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserId = currentUser.id || currentUser._id;
          if (currentUserId === userId && updatedUserData) {
            console.log('🔄 Updating currently logged-in user in auth context (fallback)');
            updateAuthUser({ ...updatedUserData, role: newRole });
          }
        }

        setAlertMessage(`User role updated successfully from ${selectedUser.role} to ${newRole}`);
        setShowAlert(true);
        setShowRoleModal(false);
        setSelectedUser(null);
        
        sessionStorage.setItem('usersNeedRefresh', 'true');
        setTimeout(() => loadUsers(true), 500);
      } catch (error: any) {
        console.error('❌ Error updating user role:', error);
        
        if (!handleApiError(error, 'updating user role')) {
          let errorMessage = 'Failed to update user role';
          if (error.message?.includes('Authentication failed') || error.message?.includes('HTTP 401')) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.message?.includes('HTTP 403')) {
            errorMessage = 'Access denied. Admin privileges required.';
          } else if (error.message?.includes('HTTP 404')) {
            errorMessage = 'User not found. The user may have been deleted.';
          } else if (error.message?.includes('Invalid role')) {
            errorMessage = 'Invalid role specified. Please choose a valid role.';
          } else if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (error.message) {
            errorMessage = `Failed to update user role: ${error.message}`;
          }
          
          setAlertMessage(errorMessage);
          setShowAlert(true);
        }
      }
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const user = users.find(u => u._id === id || u.id === id);
      if (!user) {
        setAlertMessage('User not found');
        setShowAlert(true);
        return;
      }

      if (isProtectedAdmin(user)) {
        setAlertMessage('The default admin account cannot be deleted');
        setShowAlert(true);
        return;
      }

      await apiService.deleteUser(id);
      setUsers(users.filter(user => (user._id !== id && user.id !== id)));
      setAlertMessage('User deleted successfully');
      setShowAlert(true);
      
      sessionStorage.setItem('usersNeedRefresh', 'true');
      setTimeout(() => loadUsers(true), 500);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setAlertMessage('Failed to delete user: ' + (error.message || 'Unknown error'));
      setShowAlert(true);
    }
  };

  const handleOptionsClick = (user: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedUser(user);
    setShowActionSheet(true);
  };

  // Helper to check if user is protected admin
  const isProtectedAdmin = (user: any) => {
    return user.email === protectedAdminEmail;
  };

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  const statsModules = [
    { name: 'Total Users', icon: people, color: '#6366f1', val: totalUsers, sub: 'registered' },
    { name: 'Active', icon: checkmarkCircle, color: '#10b981', val: activeUsers, sub: 'users' },
    { name: 'Inactive', icon: closeCircle, color: '#ef4444', val: inactiveUsers, sub: 'users' },
    { name: 'Admins', icon: shield, color: '#f59e0b', val: adminUsers, sub: 'admins' }
  ];

  const getFilteredUsers = () => {
    let filtered = users;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(query) || 
        u.email?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterBy === 'active') {
      filtered = filtered.filter(u => u.isActive === true);
    } else if (filterBy === 'inactive') {
      filtered = filtered.filter(u => u.isActive === false);
    } else if (filterBy === 'admins') {
      filtered = filtered.filter(u => u.role === 'admin');
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        break;
    }

    return sorted;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <BackButton />
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">User Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadUsers(true)} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>

          {/* Stats Modules - Modern Compact Horizontal Cards */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {statsModules.map((mod, i) => (
                <div key={i} onClick={() => {
                  if (mod.name === 'Total Users') setFilterBy('all');
                  else if (mod.name === 'Active') setFilterBy(filterBy === 'active' ? 'all' : 'active');
                  else if (mod.name === 'Inactive') setFilterBy(filterBy === 'inactive' ? 'all' : 'inactive');
                  else if (mod.name === 'Admins') setFilterBy(filterBy === 'admins' ? 'all' : 'admins');
                }} style={{
                  minWidth: '140px',
                  flex: '0 0 auto',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `1px solid ${mod.color}20`,
                  background: `linear-gradient(135deg, ${mod.color}08 0%, ${mod.color}03 100%)`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 2px 8px ${mod.color}10`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${mod.color}25`;
                  e.currentTarget.style.borderColor = `${mod.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${mod.color}10`;
                  e.currentTarget.style.borderColor = `${mod.color}20`;
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: mod.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 2px 8px ${mod.color}30`
                    }}>
                      <IonIcon icon={mod.icon} style={{ fontSize: '16px', color: 'white' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ion-text-color)', opacity: 0.7 }}>{mod.name}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: mod.color, lineHeight: '1.1' }}>{mod.val}</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--ion-text-color)', opacity: 0.5 }}>{mod.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              marginBottom: filterBy !== 'all' ? '12px' : '0'
            }}>
              <div style={{
                flex: 1,
                position: 'relative',
                background: 'var(--ion-card-background)',
                borderRadius: 14,
                border: '1px solid var(--ion-color-step-200)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}>
                <IonIcon 
                  icon={search} 
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--ion-color-primary)',
                    fontSize: '18px'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--ion-text-color)',
                    fontSize: '0.95em'
                  }}
                />
              </div>
            </div>

            {/* Active Filter Badge */}
            {filterBy !== 'all' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--ion-color-step-200)',
                padding: '6px 12px',
                borderRadius: 20,
                marginBottom: '8px'
              }}>
                <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.8em', fontWeight: '500' }}>
                  Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                </IonText>
                <div 
                  onClick={() => setFilterBy('all')}
                  style={{
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Users List */}
          <div>
            {getFilteredUsers().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--ion-color-medium)',
                opacity: 0.6
              }}>
                <IonIcon icon={people} style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>No users found</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'No users have been registered yet'}
                </p>
              </div>
            ) : (
              getFilteredUsers().map((user) => (
                <div
                  key={user._id || user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'var(--ion-card-background)',
                    border: '1px solid var(--ion-color-step-200)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f140';
                    e.currentTarget.style.background = '#6366f108';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px #6366f120';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                    e.currentTarget.style.background = 'var(--ion-card-background)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={(e) => handleOptionsClick(user, e)}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: user.isActive ? '#10b981' : '#ef4444',
                    opacity: 0.8
                  }} />

                  {/* Avatar */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    position: 'relative',
                    background: user.role === 'admin'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={person} style={{ fontSize: '28px', color: 'white', opacity: 0.9 }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {user.name || 'Untitled'}
                      </p>
                      {user.role === 'admin' && (
                        <div style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500',
                          background: '#f59e0b20',
                          color: '#f59e0b',
                          whiteSpace: 'nowrap'
                        }}>
                          Admin
                        </div>
                      )}
                      {isProtectedAdmin(user) && (
                        <div style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500',
                          background: '#ffd70020',
                          color: '#d4a017',
                          whiteSpace: 'nowrap'
                        }}>
                          Owner
                        </div>
                      )}
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {user.lastLogin && (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={checkmarkCircle} style={{ fontSize: '12px' }} />
                          Last: {new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons with status badge above */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {/* Status Badge - positioned above action buttons */}
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      background: user.isActive ? '#10b98120' : '#ef444420',
                      color: user.isActive ? '#10b981' : '#ef4444',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleActive(user._id || user.id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: user.isActive ? '#10b98115' : '#ef444415',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = user.isActive ? '#10b98125' : '#ef444425'}
                        onMouseLeave={(e) => e.currentTarget.style.background = user.isActive ? '#10b98115' : '#ef444415'}
                      >
                        <IonIcon 
                          icon={user.isActive ? eyeOff : eye} 
                          style={{ fontSize: '16px', color: user.isActive ? '#10b981' : '#ef4444' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); openRoleModal(user); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: '#f59e0b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f59e0b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b15'}
                      >
                        <IonIcon icon={shield} style={{ fontSize: '16px', color: '#f59e0b' }} />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); handleOptionsClick(user, e); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: '#64748b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#64748b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#64748b15'}
                      >
                        <IonIcon icon={ellipsisVertical} style={{ fontSize: '16px', color: 'var(--ion-color-medium)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • Admin Panel v2.0
            </IonText>
          </div>
        </div>

        {/* FAB for adding new user */}
        <IonFab
          horizontal="end"
          vertical="bottom"
          slot="fixed"
          style={{
            '--background': '#6366f1',
            '--box-shadow': '0 6px 20px rgba(99, 102, 241, 0.4)',
            'marginBottom': '70px',
            'marginRight': '16px'
          } as any}
        >
          <IonFabButton onClick={() => history.push('/admin/users/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* General Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />

        {/* Role Change Modal */}
        <IonAlert
          isOpen={showRoleModal}
          onDidDismiss={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          header={`Change Role for ${selectedUser?.name}`}
          message="Select the new role for this user:"
          cssClass="rounded-alert"
          inputs={[
            {
              name: 'role',
              type: 'radio',
              label: 'User',
              value: 'user',
              checked: selectedUser?.role === 'user'
            },
            {
              name: 'role',
              type: 'radio',
              label: 'Admin',
              value: 'admin',
              checked: selectedUser?.role === 'admin'
            }
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                setShowRoleModal(false);
                setSelectedUser(null);
              }
            },
            {
              text: 'Update Role',
              handler: (data: any) => {
                console.log('Alert data received:', data);
                const selectedRole = data;
                if (selectedRole && (selectedRole === 'user' || selectedRole === 'admin')) {
                  changeRole(selectedRole);
                } else {
                  setAlertMessage('Please select a role');
                  setShowAlert(true);
                }
              }
            }
          ]}
        />

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={selectedUser?.name || 'User Options'}
          buttons={[
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedUser) {
                  history.push(`/admin/users/edit/${selectedUser._id || selectedUser.id}`, { user: selectedUser });
                }
              }
            },
            {
              text: selectedUser?.isActive ? 'Deactivate' : 'Activate',
              icon: selectedUser?.isActive ? closeCircle : checkmarkCircle,
              handler: () => {
                if (selectedUser) {
                  const userId = selectedUser._id || selectedUser.id;
                  toggleActive(userId);
                }
              }
            },
            {
              text: 'Change Role',
              icon: shield,
              handler: () => {
                if (selectedUser) {
                  openRoleModal(selectedUser);
                }
              }
            },
            {
              text: 'Delete User',
              icon: trash,
              role: 'destructive',
              handler: () => {
                if (selectedUser) {
                  const userId = selectedUser._id || selectedUser.id;
                  deleteUser(userId);
                }
              }
            },
            {
              text: 'Cancel',
              icon: arrowBack,
              role: 'cancel'
            }
          ]}
        />

        {loading && users.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--ion-color-medium)',
            opacity: 0.6
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--ion-color-step-200)',
              borderTop: '3px solid var(--ion-color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ fontSize: '14px', margin: 0 }}>Loading users...</p>
          </div>
        ) : null}

        <style>{`
          .rounded-alert .alert-wrapper {
            border-radius: 16px !important;
            background: var(--ion-card-background) !important;
          }
          .rounded-alert .alert-head {
            background: var(--ion-card-background) !important;
          }
          .rounded-alert .alert-message {
            color: var(--ion-text-color) !important;
            opacity: 0.7 !important;
          }
          .rounded-alert {
            --backdrop-opacity: 0.7;
          }
          .rounded-alert::part(backdrop) {
            backdrop-filter: blur(10px);
            background: rgba(0, 0, 0, 0.5);
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default AdminUserManager;
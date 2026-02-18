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
  IonActionSheet
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
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
  closeCircle as closeIcon
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
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Protected admin email
  const protectedAdminEmail = 'brownjh18@gmail.com';

  // Detect dark mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Helper to check if user is protected admin
  const isProtectedAdmin = (user: any) => {
    return user.email === protectedAdminEmail;
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (isOnline) {
      loadUsers();
    }
  }, [isOnline]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Starting to load users...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const apiPromise = apiService.getUsers();
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('Users loaded successfully:', response);
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      
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
    } finally {
      setLoading(false);
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
    } catch (error: any) {
      console.error('Error updating user status:', error);
      
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
        
      } catch (error: any) {
        console.error('❌ Error updating user role:', error);
        
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

  const getFilteredUsers = () => {
    let filtered = users;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(query) || 
        u.email?.toLowerCase().includes(query)
      );
    }

    if (filterBy === 'active') {
      filtered = filtered.filter(u => u.isActive === true);
    } else if (filterBy === 'inactive') {
      filtered = filtered.filter(u => u.isActive === false);
    } else if (filterBy === 'admins') {
      filtered = filtered.filter(u => u.role === 'admin');
    }

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Dynamic colors based on dark mode
  const colors = {
    bg: isDarkMode ? '#000000' : '#ffffff',
    bgSecondary: isDarkMode ? '#1c1c1e' : '#f2f2f7',
    bgTertiary: isDarkMode ? '#2c2c2e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    textTertiary: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.8)',
    cardBgActive: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#ffffff',
    inputBg: isDarkMode ? '#2c2c2e' : '#f2f2f7',
  };

  const headerBg = isDarkMode 
    ? 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)' 
    : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';

  const arrowColor = isDarkMode ? '#ffffff' : '#000000';

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  return (
    <IonPage style={{ backgroundColor: colors.bg }}>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .admin-user-page {
            --ion-background-color: #000000 !important;
            background: #000000 !important;
          }
        }
        @media (prefers-color-scheme: light) {
          .admin-user-page {
            --ion-background-color: #ffffff !important;
            background: #ffffff !important;
          }
        }
      `}</style>
      
      <IonHeader translucent>
        <IonToolbar style={{ 
          '--background': headerBg,
          '--border-width': '0',
          background: headerBg
        }}>
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - -5px)',
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'all 0.2s ease'
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                color: arrowColor,
                fontSize: '18px',
              }}
            />
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="admin-user-page" style={{ 
        '--background': colors.bg,
        background: colors.bg
      }}>
        {/* Header Section */}
        <div style={{ 
          padding: '20px 16px', 
          background: headerBg,
          borderRadius: '0 0 24px 24px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)'
            }}>
              <IonIcon icon={people} style={{ fontSize: '24px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '1.5em',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '-0.5px'
              }}>
                User Management
              </h1>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85em'
              }}>
                Manage user accounts and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          padding: '0 16px',
          marginBottom: '20px'
        }}>
          <div 
            onClick={() => setFilterBy(filterBy === 'all' ? 'all' : 'all')}
            style={{
              background: filterBy === 'all' 
                ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' 
                : colors.cardBg,
              borderRadius: 16,
              padding: '14px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              boxShadow: filterBy === 'all' ? '0 8px 24px rgba(14, 165, 233, 0.3)' : 'none'
            }}
          >
            <div style={{ 
              fontSize: '1.6em', 
              fontWeight: '700', 
              color: filterBy === 'all' ? '#fff' : colors.text,
              marginBottom: '4px'
            }}>
              {totalUsers}
            </div>
            <div style={{ 
              fontSize: '0.7em', 
              color: filterBy === 'all' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Total
            </div>
          </div>

          <div 
            onClick={() => setFilterBy(filterBy === 'active' ? 'all' : 'active')}
            style={{
              background: filterBy === 'active' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : colors.cardBg,
              borderRadius: 16,
              padding: '14px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              boxShadow: filterBy === 'active' ? '0 8px 24px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <div style={{ 
              fontSize: '1.6em', 
              fontWeight: '700', 
              color: filterBy === 'active' ? '#fff' : colors.text,
              marginBottom: '4px'
            }}>
              {activeUsers}
            </div>
            <div style={{ 
              fontSize: '0.7em', 
              color: filterBy === 'active' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Active
            </div>
          </div>

          <div 
            onClick={() => setFilterBy(filterBy === 'inactive' ? 'all' : 'inactive')}
            style={{
              background: filterBy === 'inactive' 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                : colors.cardBg,
              borderRadius: 16,
              padding: '14px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              boxShadow: filterBy === 'inactive' ? '0 8px 24px rgba(239, 68, 68, 0.3)' : 'none'
            }}
          >
            <div style={{ 
              fontSize: '1.6em', 
              fontWeight: '700', 
              color: filterBy === 'inactive' ? '#fff' : colors.text,
              marginBottom: '4px'
            }}>
              {inactiveUsers}
            </div>
            <div style={{ 
              fontSize: '0.7em', 
              color: filterBy === 'inactive' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Inactive
            </div>
          </div>

          <div 
            onClick={() => setFilterBy(filterBy === 'admins' ? 'all' : 'admins')}
            style={{
              background: filterBy === 'admins' 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                : colors.cardBg,
              borderRadius: 16,
              padding: '14px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              boxShadow: filterBy === 'admins' ? '0 8px 24px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <div style={{ 
              fontSize: '1.6em', 
              fontWeight: '700', 
              color: filterBy === 'admins' ? '#fff' : colors.text,
              marginBottom: '4px'
            }}>
              {adminUsers}
            </div>
            <div style={{ 
              fontSize: '0.7em', 
              color: filterBy === 'admins' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Admins
            </div>
          </div>
        </div>

        {/* Search and Add Bar */}
        <div style={{ padding: '0 16px', marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            marginBottom: filterBy !== 'all' ? '12px' : '0'
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              background: colors.inputBg,
              borderRadius: 14,
              border: `1px solid ${colors.border}`
            }}>
              <IonIcon 
                icon={search} 
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.textTertiary,
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
                  color: colors.text,
                  fontSize: '0.95em'
                }}
              />
            </div>
            <IonButton
              onClick={() => history.push('/admin/users/add')}
              style={{
                height: '48px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
                '--padding-start': '16px',
                '--padding-end': '16px',
                margin: 0
              }}
            >
              <IonIcon icon={add} />
            </IonButton>
          </div>

          {/* Active Filter Badge */}
          {filterBy !== 'all' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              padding: '6px 12px',
              borderRadius: 20,
              marginBottom: '8px'
            }}>
              <IonText style={{ color: colors.textSecondary, fontSize: '0.8em', fontWeight: '500' }}>
                Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
              </IonText>
              <div 
                onClick={() => setFilterBy('all')}
                style={{
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <IonIcon icon={closeIcon} style={{ color: colors.textTertiary, fontSize: '16px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.1em',
              fontWeight: '600',
              color: colors.text
            }}>
              {filterBy === 'all' ? 'All Users' :
               filterBy === 'active' ? 'Active Users' :
               filterBy === 'inactive' ? 'Inactive Users' :
               filterBy === 'admins' ? 'Admin Users' :
               'All Users'}
              <span style={{ 
                color: colors.textTertiary, 
                fontWeight: '400',
                fontSize: '0.85em',
                marginLeft: '8px'
              }}>
                ({getFilteredUsers().length})
              </span>
            </h2>
          </div>

          {getFilteredUsers().length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: colors.cardBg,
              borderRadius: 20,
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                background: isDarkMode 
                  ? 'rgba(102, 126, 234, 0.2)' 
                  : 'rgba(0, 122, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <IonIcon
                  icon={people}
                  style={{
                    fontSize: '2.5em',
                    color: colors.textTertiary
                  }}
                />
              </div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.2em',
                fontWeight: '600',
                color: colors.text
              }}>
                {loading ? 'Loading users...' : 'No users found'}
              </h3>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: colors.textSecondary,
                lineHeight: '1.4'
              }}>
                {loading
                  ? 'Please wait while we fetch the user list'
                  : searchQuery
                    ? 'No users match your search'
                    : filterBy !== 'all'
                      ? `No users match the current ${filterBy} filter`
                      : 'No users have been registered yet'
                }
              </p>
              {!loading && (searchQuery || filterBy !== 'all') && (
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setFilterBy('all');
                    setSearchQuery('');
                  }}
                  style={{
                    marginTop: '20px',
                    '--border-color': colors.border,
                    '--color': isDarkMode ? '#fff' : '#007aff',
                    '--background': 'transparent',
                    '--border-radius': '12px'
                  }}
                >
                  Clear filters
                </IonButton>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getFilteredUsers().map((user) => (
                <div
                  key={user._id || user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: user.isActive ? colors.cardBgActive : colors.cardBg,
                    borderRadius: 14,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.3s ease',
                    boxShadow: isDarkMode 
                      ? 'none' 
                      : '0 2px 8px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {/* User Avatar */}
                  <div style={{ position: 'relative', marginRight: '12px' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: user.role === 'admin'
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: user.role === 'admin'
                          ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                          : '0 4px 12px rgba(14, 165, 233, 0.3)'
                      }}
                    >
                      <IonIcon icon={person} style={{ fontSize: '1.4em', color: '#fff' }} />
                    </div>
                    {/* Status indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: user.isActive ? '#10b981' : '#ef4444',
                      border: `2px solid ${colors.bg}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon 
                        icon={user.isActive ? checkmarkCircle : closeCircle} 
                        style={{ fontSize: '8px', color: '#fff' }} 
                      />
                    </div>
                  </div>

                  {/* User Info */}
                  <div style={{ flex: '1', minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      marginBottom: '2px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.9em',
                        fontWeight: '600',
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {user.name}
                      </h4>
                      {user.role === 'admin' && (
                        <div style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          padding: '1px 6px',
                          borderRadius: 6,
                          fontSize: '0.55em',
                          fontWeight: '600',
                          color: '#fff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Admin
                        </div>
                      )}
                      {isProtectedAdmin(user) && (
                        <div style={{
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)',
                          padding: '1px 6px',
                          borderRadius: 6,
                          fontSize: '0.55em',
                          fontWeight: '600',
                          color: '#000',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Owner
                        </div>
                      )}
                    </div>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: '0.75em',
                      color: colors.textSecondary,
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.email}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '0.65em',
                      color: colors.textTertiary
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <IonIcon icon={calendar} style={{ fontSize: '10px' }} />
                        <span>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      {user.lastLogin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span>•</span>
                          <span>{new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options Button */}
                  <IonButton
                    fill="clear"
                    onClick={(e) => handleOptionsClick(user, e)}
                    style={{
                      margin: 0,
                      padding: '6px',
                      minWidth: 'auto',
                      height: 'auto',
                      '--color': colors.textTertiary
                    }}
                  >
                    <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.1em' }} />
                  </IonButton>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <IonText style={{
            color: colors.textTertiary,
            fontSize: '0.8em'
          }}>
            Dove Ministries Africa
          </IonText>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Notice"
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
              // IonAlert with radio buttons returns the selected value directly
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

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={`Options for "${selectedUser?.name}"`}
        buttons={[
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
            role: 'destructive',
            icon: trash,
            handler: () => {
              if (selectedUser) {
                const userId = selectedUser._id || selectedUser.id;
                deleteUser(userId);
              }
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      <style>{`
        .rounded-alert .alert-wrapper {
          border-radius: 16px !important;
          background: ${isDarkMode ? '#1c1c1e' : '#ffffff'} !important;
        }
        .rounded-alert .alert-head {
          background: ${isDarkMode ? '#1c1c1e' : '#ffffff'} !important;
        }
        .rounded-alert .alert-message {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} !important;
        }
        .rounded-alert {
          --backdrop-opacity: 0.7;
        }
        .rounded-alert::part(backdrop) {
          backdrop-filter: blur(10px);
          background: rgba(0, 0, 0, 0.5);
        }
        input::placeholder {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'} !important;
        }
      `}</style>
    </IonPage>
  );
};

export default AdminUserManager;

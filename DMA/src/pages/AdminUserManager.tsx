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
  IonFabButton
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
  closeCircle as closeIcon,
  settings
} from 'ionicons/icons';
import apiService from '../services/api';
import { useNetwork } from '../contexts/NetworkContext';
import { AuthContext } from '../App';

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

  // Protected admin email
  const protectedAdminEmail = 'brownjh18@gmail.com';

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

  return (
    <IonPage>
      <IonHeader translucent>
        <div
          onClick={() => history.goBack()}
          style={{
            position: 'absolute',
            top: 'calc(var(--ion-safe-area-top) - -5px)',
            left: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
          }}
        >
          <IonIcon icon={arrowBack} style={{ color: 'white', fontSize: '18px' }} />
        </div>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">
            <span style={{ fontWeight: '700', color: 'var(--ion-color-primary)' }}>User Management</span>
          </IonTitle>
          <IonButton fill="clear" slot="end" onClick={loadUsers} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Stats Modules - 2 Column Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              User Statistics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px',
              background: 'var(--ion-card-background)',
              borderRadius: '16px',
              padding: '8px',
              border: '1px solid var(--ion-color-step-200)'
            }}>
              {statsModules.map((mod, i) => (
                <div key={i} onClick={() => {
                  if (mod.name === 'Total Users') setFilterBy('all');
                  else if (mod.name === 'Active') setFilterBy(filterBy === 'active' ? 'all' : 'active');
                  else if (mod.name === 'Inactive') setFilterBy(filterBy === 'inactive' ? 'all' : 'inactive');
                  else if (mod.name === 'Admins') setFilterBy(filterBy === 'admins' ? 'all' : 'admins');
                }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${mod.color}10`;
                  e.currentTarget.style.borderColor = `${mod.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: mod.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${mod.color}40`
                  }}>
                    <IonIcon icon={mod.icon} style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: 'var(--ion-text-color)' }}>{mod.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--ion-text-color)', opacity: 0.5 }}>{mod.sub}</p>
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${mod.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: mod.color }}>{mod.val}</span>
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
                  <IonIcon icon={closeIcon} style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '16px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Users List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              {filterBy === 'all' ? 'All Users' :
               filterBy === 'active' ? 'Active Users' :
               filterBy === 'inactive' ? 'Inactive Users' :
               filterBy === 'admins' ? 'Admin Users' :
               'All Users'}
              <span style={{ 
                color: 'var(--ion-text-color)', 
                opacity: 0.4, 
                fontWeight: '400',
                fontSize: '0.85em',
                marginLeft: '8px'
              }}>
                ({getFilteredUsers().length})
              </span>
            </h3>

            {getFilteredUsers().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--ion-card-background)',
                borderRadius: 20,
                border: '1px solid var(--ion-color-step-200)'
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  background: 'var(--ion-color-primary)',
                  opacity: 0.1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <IonIcon
                    icon={people}
                    style={{
                      fontSize: '2.5em',
                      color: 'var(--ion-color-primary)'
                    }}
                  />
                </div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)'
                }}>
                  {loading ? 'Loading users...' : 'No users found'}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  color: 'var(--ion-text-color)',
                  opacity: 0.6,
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
                      '--border-color': 'var(--ion-color-step-200)',
                      '--color': 'var(--ion-color-primary)',
                      '--background': 'transparent',
                      '--border-radius': '12px'
                    }}
                  >
                    Clear filters
                  </IonButton>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getFilteredUsers().map((user) => (
                  <div
                    key={user._id || user.id}
                    onClick={(e) => handleOptionsClick(user, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--ion-card-background)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: '14px',
                      border: '1px solid var(--ion-color-step-200)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* User Avatar */}
                    <div style={{ position: 'relative', marginRight: '14px' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: user.role === 'admin'
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: user.role === 'admin'
                            ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                            : '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <IonIcon icon={person} style={{ fontSize: '1.4em', color: '#fff' }} />
                      </div>
                      {/* Status indicator */}
                      <div style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: user.isActive ? '#10b981' : '#ef4444',
                        border: `2px solid var(--ion-card-background)`,
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
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.95em',
                          fontWeight: '600',
                          color: 'var(--ion-text-color)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {user.name}
                        </h4>
                        {user.role === 'admin' && (
                          <div style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.6em',
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
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.6em',
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
                        fontSize: '0.8em',
                        color: 'var(--ion-text-color)',
                        opacity: 0.6,
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
                        fontSize: '0.7em',
                        color: 'var(--ion-text-color)',
                        opacity: 0.4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                          <span>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {user.lastLogin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>•</span>
                            <span>Last: {new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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
                        padding: '8px',
                        minWidth: 'auto',
                        height: 'auto',
                        '--color': 'var(--ion-text-color)',
                        opacity: 0.5
                      }}
                    >
                      <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.2em' }} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • User Management
            </IonText>
          </div>
        </div>

        {/* FAB Button */}
        <IonFab horizontal="end" vertical="bottom" slot="fixed" style={{ marginBottom: '80px', marginRight: '16px' }}>
          <IonFabButton onClick={() => history.push('/admin/users/add')} style={{ '--background': '#6366f1', '--box-shadow': '0 4px 16px rgba(99, 102, 241, 0.5)' }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
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
        input::placeholder {
          color: var(--ion-text-color) !important;
          opacity: 0.4 !important;
        }
      `}</style>
    </IonPage>
  );
};

export default AdminUserManager;

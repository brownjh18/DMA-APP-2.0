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
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AdminPopover from '../components/AdminPopover';
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
  create,
  eye,
  eyeOff
} from 'ionicons/icons';
import apiService from '../services/api';
import { useNetwork } from '../contexts/NetworkContext';
import { AuthContext } from '../App';
import './AdminManager.css';

const PAGE_SIZE = 20;

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
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const protectedAdminEmail = 'brownjh18@gmail.com';

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

  const handleApiError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      console.log(`🗑️ Resource not found during ${action}, clearing cache and refreshing`);
      clearUsersCache();
      sessionStorage.setItem('usersNeedRefresh', 'true');
      setTimeout(() => loadUsers(true), 1000);
      return true;
    }
    
    return false;
  };

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
          const maxAge = 5 * 60 * 1000;
          
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
    setDisplayCount(PAGE_SIZE);
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

  const isProtectedAdmin = (user: any) => {
    return user.email === protectedAdminEmail;
  };

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

  const allFiltered = getFilteredUsers();
  const displayedUsers = allFiltered.slice(0, displayCount);
  const hasMore = displayCount < allFiltered.length;

  const handleInfiniteScroll = async (ev: CustomEvent<void>) => {
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }, 300);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>User Manager</IonTitle>

        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="am-page">

          <div className="am-stats">
            {statsModules.map((mod, i) => (
              <div key={i} className="am-stat-pill" onClick={() => {
                if (mod.name === 'Total Users') setFilterBy('all');
                else if (mod.name === 'Active') setFilterBy(filterBy === 'active' ? 'all' : 'active');
                else if (mod.name === 'Inactive') setFilterBy(filterBy === 'inactive' ? 'all' : 'inactive');
                else if (mod.name === 'Admins') setFilterBy(filterBy === 'admins' ? 'all' : 'admins');
              }}>
                <div className="am-stat-dot" style={{ background: mod.color }} />
                <div className="am-stat-data">
                  <span className="am-stat-num" style={{ color: mod.color }}>{mod.val}</span>
                  <span className="am-stat-txt">{mod.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="am-section">
            <div className="am-search">
              <div className="am-search-box">
                <IonIcon icon={search} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filterBy !== 'all' && (
              <div className="am-filter-badge">
                <span className="am-filter-badge-text">
                  Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                </span>
                <div className="am-filter-badge-close" onClick={() => setFilterBy('all')}>
                  <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
                </div>
              </div>
            )}
          </div>

          {loading && users.length === 0 ? (
            <div className="am-loading">
              <div className="am-loading-spinner" />
              <p>Loading users...</p>
            </div>
          ) : allFiltered.length === 0 ? (
            <div className="am-empty">
              <IonIcon icon={people} />
              <p className="am-empty-title">No users found</p>
              <p className="am-empty-text">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No users have been registered yet'}
              </p>
            </div>
          ) : (
            <div className="am-list">
              {displayedUsers.map((user) => (
                <div
                  key={user._id || user.id}
                  className="am-card"
                  onClick={(e) => handleOptionsClick(user, e)}
                >
                  <div className={`am-accent ${user.role === 'admin' ? 'amber' : user.isActive ? 'green' : 'red'}`} />

                  <div
                    className="am-avatar"
                    style={user.role === 'admin' ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' } : undefined}
                  >
                    <IonIcon icon={person} className="am-avatar-icon" />
                  </div>

                  <div className="am-content">
                    <div className="am-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name || 'Untitled'}
                      </span>
                      {user.role === 'admin' && (
                        <span className="am-status admin">Admin</span>
                      )}
                      {isProtectedAdmin(user) && (
                        <span className="am-status owner">Owner</span>
                      )}
                    </div>
                    <p className="am-subtitle">{user.email}</p>
                    <div className="am-meta">
                      <p className="am-meta-item">
                        <IonIcon icon={calendar} />
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {user.lastLogin && (
                        <p className="am-meta-item">
                          <IonIcon icon={checkmarkCircle} />
                          Last: {new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="am-actions">
                    <span className={`am-status ${isProtectedAdmin(user) ? 'owner' : user.role === 'admin' ? 'admin' : user.isActive ? 'active' : 'inactive'}`}>
                      {isProtectedAdmin(user) ? 'Owner' : user.role === 'admin' ? 'Admin' : user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="am-btns">
                      <div
                        className={`am-btn toggle ${!user.isActive ? 'inactive' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleActive(user._id || user.id); }}
                      >
                        <IonIcon icon={user.isActive ? eyeOff : eye} />
                      </div>
                      <div
                        className="am-btn role"
                        onClick={(e) => { e.stopPropagation(); openRoleModal(user); }}
                      >
                        <IonIcon icon={shield} />
                      </div>
                      <div
                        className="am-btn more"
                        onClick={(e) => { e.stopPropagation(); handleOptionsClick(user, e); }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <IonInfiniteScroll onIonInfinite={handleInfiniteScroll} disabled={!hasMore}>
                <IonInfiniteScrollContent />
              </IonInfiniteScroll>
            </div>
          )}

          <div className="am-footer">
            <IonText>Dove Church • Admin Panel v2.0</IonText>
          </div>
        </div>

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

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />

        <IonAlert
          isOpen={showRoleModal}
          onDidDismiss={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          header={`Change Role for ${selectedUser?.name}`}
          message="Select the new role for this user:"
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

        {/* Action Popover */}
        <AdminPopover
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={selectedUser?.name || 'User Options'}
          options={[
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
              role: 'cancel',
              handler: () => {}
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUserManager;

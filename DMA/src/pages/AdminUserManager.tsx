import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  IonLoading,
  IonPopover,
  IonActionSheet
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  add,
  create,
  trash,
  people,
  mail,
  person,
  checkmarkCircle,
  closeCircle,
  time,
  calendar,
  ellipsisVertical,
  arrowBack
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
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Refresh the users list when coming back online
      loadUsers();
    }
  }, [isOnline]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Starting to load users...');
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const apiPromise = apiService.getUsers();
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('Users loaded successfully:', response);
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      
      // Show specific error message based on error type
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
      
      // Set empty users array on error to show no users rather than blank screen
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
      
      // If the user being updated is the currently logged-in user, update the auth context
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.id || currentUser._id;
      if (currentUserId === id && !newStatus) {
        console.log('🔄 Currently logged-in user was deactivated, logging out');
        // If the currently logged-in user is being deactivated, log them out
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
      
      // Provide specific error messages based on error type
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
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const changeRole = async (newRole: string) => {
    if (selectedUser) {
      try {
        const userId = selectedUser._id || selectedUser.id;
        
        // Validate role
        if (!['user', 'admin'].includes(newRole)) {
          setAlertMessage('Invalid role specified');
          setShowAlert(true);
          return;
        }

        console.log(`🔄 Changing role for user ${userId} from ${selectedUser.role} to ${newRole}`);
        
        const response = await apiService.updateUser(userId, { role: newRole });
        console.log('✅ Backend response:', response);

        // Update local state with the returned user data from backend
        if (response.user) {
          setUsers(users.map(user => {
            const currentUserId = user._id || user.id;
            if (currentUserId === userId) {
              console.log(`🔄 Updating local state for user ${user.name}: ${user.role} → ${response.user.role}`);
              return { ...user, ...response.user };
            }
            return user;
          }));
          
          // If the user being updated is the currently logged-in user, update the auth context
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserId = currentUser.id || currentUser._id;
          if (currentUserId === userId) {
            console.log('🔄 Updating currently logged-in user in auth context');
            updateAuthUser(response.user);
          }
        } else {
          // Fallback: update role manually if no user data returned
          const updatedUserData = users.find(u => (u._id === userId || u.id === userId));
          setUsers(users.map(user =>
            (user._id === userId || user.id === userId)
              ? { ...user, role: newRole }
              : user
          ));
          
          // If the user being updated is the currently logged-in user, update the auth context
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
        
        // Provide specific error messages based on error type
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

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'active' || statType === 'inactive' || statType === 'admins' ? statType : 'all');
  };

  const getSortedAndFilteredUsers = () => {
    // Apply filter
    let filtered = users;
    if (filterBy === 'active') {
      filtered = users.filter(u => u.isActive === true);
    } else if (filterBy === 'inactive') {
      filtered = users.filter(u => u.isActive === false);
    } else if (filterBy === 'admins') {
      filtered = users.filter(u => u.role === 'admin');
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
      case 'active':
      case 'inactive':
      case 'admins':
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  const getArrowIconColor = () => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000';
    } catch (error) {
      return '#000000'; // fallback color
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - -5px)',
              left: 20,
              width: 45,
              height: 45,
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(0.8)';
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 200);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                color: getArrowIconColor(),
                fontSize: '20px',
              }}
            />
          </div>
          <IonTitle className="title-ios">User Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={people}
              style={{
                fontSize: '3em',
                color: 'var(--ion-color-primary)',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              User Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Manage user accounts and permissions
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('date')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'date' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#3b82f6',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {users.length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Total</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('active')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'active' ? 'scale(1.2) rotate(3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'active' ? '0 8px 25px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'active' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#10b981',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'active' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {users.filter(u => u.isActive).length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Active</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('inactive')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'inactive' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'inactive' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'inactive' ? '0 8px 25px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'inactive' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#ef4444',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'inactive' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {users.filter(u => !u.isActive).length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Inactive</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('admins')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'admins' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'admins' ? 'scale(1.2) rotate(2deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'admins' ? '0 8px 25px rgba(139, 92, 246, 0.6), 0 0 0 4px rgba(139, 92, 246, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'admins' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#8b5cf6',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'admins' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {users.filter(u => u.role === 'admin').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Admins</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => history.push('/admin/users/add')}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.8) 0%, rgba(56, 189, 248, 0.6) 50%, rgba(56, 189, 248, 0.4) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                boxShadow: '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '--border-radius': '24px'
              }}
              onMouseDown={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.98)';
                target.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget as HTMLElement;
                setTimeout(() => {
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }, 200);
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(1)';
                target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add User
            </IonButton>
          </div>

          {/* Users List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.3em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              {filterBy === 'all' ? 'All Users' :
               filterBy === 'active' ? 'Active Users' :
               filterBy === 'inactive' ? 'Inactive Users' :
               filterBy === 'admins' ? 'Admin Users' :
               'All Users'}
              {sortBy === 'date' && ' (Sorted by Date)'}
            </h2>

            {getSortedAndFilteredUsers().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--ion-color-medium)'
              }}>
                <IonIcon
                  icon={people}
                  style={{
                    fontSize: '4em',
                    marginBottom: '16px',
                    opacity: 0.5
                  }}
                />
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.2em',
                  fontWeight: '600'
                }}>
                  {loading ? 'Loading users...' : 'No users found'}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  lineHeight: '1.4'
                }}>
                  {loading
                    ? 'Please wait while we fetch the user list'
                    : filterBy === 'all'
                      ? 'No users have been registered yet'
                      : `No users match the current ${filterBy} filter`
                  }
                </p>
                {!loading && (
                  <IonButton
                    fill="outline"
                    onClick={() => {
                      setFilterBy('all');
                      setSortBy('date');
                    }}
                    style={{
                      marginTop: '16px',
                      '--border-color': 'var(--ion-color-primary)',
                      '--color': 'var(--ion-color-primary)'
                    }}
                  >
                    Show all users
                  </IonButton>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                {getSortedAndFilteredUsers().map((user) => (
                  <div
                    key={user._id || user.id}
                    className="podcast-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'var(--ion-background-color)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: '12px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      maxWidth: '500px',
                      position: 'relative'
                    }}
                    onClick={() => handleOptionsClick(user, { stopPropagation: () => {} } as any)}
                  >
                    <div className="podcast-options-btn">
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOptionsClick(user, e);
                        }}
                        style={{
                          margin: '0',
                          padding: '0',
                          minWidth: 'auto',
                          height: 'auto',
                          '--color': 'white'
                        }}
                      >
                        <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.2em' }} />
                      </IonButton>
                    </div>

                    <div className="podcast-thumbnail-container" style={{ position: 'relative', marginRight: '16px' }}>
                      <div
                        className="podcast-thumbnail"
                        style={{
                          background: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IonIcon icon={person} style={{ fontSize: '2em', color: 'white' }} />
                      </div>
                      <div className={`podcast-badge ${!user.isActive ? 'live' : ''}`}>
                        {user.role === 'admin' ? 'ADMIN' : 'USER'}
                      </div>
                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ width: '100%' }}>
                        <h4 className="podcast-title" style={{ marginBottom: '6px' }}>
                          {user.name}
                        </h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>
                          {user.email}
                        </p>
                        <div className="podcast-meta">
                          <div className="podcast-meta-item">
                            <IonIcon icon={calendar} />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          {user.lastLogin && (
                            <div className="podcast-meta-item">
                              <IonIcon icon={time} />
                              <span>Last login {new Date(user.lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa - User Management
            </IonText>
          </div>
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
            handler: (data) => {
              if (data.role) {
                changeRole(data.role);
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
            icon: create,
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
          border-radius: 12px !important;
        }
        .rounded-alert {
          --backdrop-opacity: 0.5;
        }
        .rounded-alert::part(backdrop) {
          backdrop-filter: blur(10px);
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </IonPage>
  );
};

export default AdminUserManager;
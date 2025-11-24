import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
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
  IonAlert
} from '@ionic/react';
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
  calendar
} from 'ionicons/icons';

const AdminUserManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    // Mock data - replace with API call
    const mockUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@doveministriesafrica.org',
        role: 'admin',
        isActive: true,
        createdAt: '2024-01-01',
        lastLogin: '2025-01-20'
      },
      {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        isActive: true,
        createdAt: '2024-06-15',
        lastLogin: '2025-01-18'
      },
      {
        id: '3',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'moderator',
        isActive: false,
        createdAt: '2024-03-10',
        lastLogin: '2024-12-15'
      },
      {
        id: '4',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'user',
        isActive: true,
        createdAt: '2024-08-22',
        lastLogin: '2025-01-19'
      }
    ];
    setUsers(mockUsers);
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadUsers();
    event.detail.complete();
  };

  const toggleActive = (id: string) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  const changeRole = (id: string, newRole: string) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, role: newRole }
        : user
    ));
    setAlertMessage('User role updated successfully');
    setShowAlert(true);
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    setAlertMessage('User deleted successfully');
    setShowAlert(true);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#3b82f6' }}>
                {users.length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Users</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>
                {users.filter(u => u.isActive).length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Active</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#ef4444' }}>
                {users.filter(u => !u.isActive).length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Inactive</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#8b5cf6' }}>
                {users.filter(u => u.role === 'admin' || u.role === 'moderator').length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Admins</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              routerLink="/admin/users/add"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
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
              All Users
            </h2>

            {users.map((user) => (
              <IonCard key={user.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: 'var(--ion-text-color)'
                      }}>
                        {user.name}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        {user.email}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} />
                          Joined {user.createdAt}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={time} />
                          Last login {user.lastLogin}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <IonBadge
                          style={{
                            backgroundColor: user.role === 'admin' ? '#ef4444' : user.role === 'moderator' ? '#f59e0b' : '#10b981',
                            color: 'white',
                            fontWeight: '600',
                            borderRadius: '8px'
                          }}
                        >
                          {user.role}
                        </IonBadge>
                        <IonBadge
                          style={{
                            backgroundColor: user.isActive ? '#10b981' : '#ef4444',
                            color: 'white',
                            fontWeight: '600',
                            borderRadius: '8px'
                          }}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </IonBadge>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => toggleActive(user.id)}
                          style={{ color: user.isActive ? '#ef4444' : '#10b981' }}
                        >
                          <IonIcon icon={user.isActive ? closeCircle : checkmarkCircle} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{ color: 'var(--ion-color-primary)' }}
                          onClick={() => {
                            const newRole = user.role === 'admin' ? 'moderator' : user.role === 'moderator' ? 'user' : 'admin';
                            changeRole(user.id, newRole);
                          }}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{ color: '#ef4444' }}
                          onClick={() => deleteUser(user.id)}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
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
    </IonPage>
  );
};

export default AdminUserManager;
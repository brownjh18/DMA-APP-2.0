import React, { useState, useEffect } from 'react';
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
  IonItem,
  IonLabel,
  IonInput,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  add,
  create,
  trash,
  cardOutline,
  cash,
  calendar,
  eye,
  eyeOff,
  closeCircle,
  arrowBack
} from 'ionicons/icons';

const AdminGivingManager: React.FC = () => {
  const history = useHistory();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);

  useEffect(() => {
    loadDonations();
  }, []);

  // Check for updated donation data from EditDonation page
  useEffect(() => {
    const updatedDonationData = localStorage.getItem('updatedDonation');
    if (updatedDonationData) {
      try {
        const updatedDonation = JSON.parse(updatedDonationData);
        setDonations(prevDonations =>
          prevDonations.map(donation =>
            donation.id === updatedDonation.id ? updatedDonation : donation
          )
        );
        localStorage.removeItem('updatedDonation'); // Clean up
      } catch (error) {
        console.error('Error parsing updated donation data:', error);
      }
    }
  }, []);

  const loadDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/giving?page=1&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedDonations = data.donations.map((donation: any) => ({
          id: donation._id,
          donor: donation.isAnonymous ? 'Anonymous' : donation.donorName,
          amount: donation.amount,
          purpose: donation.purpose,
          date: donation.createdAt.split('T')[0], // Format date
          method: donation.paymentMethod,
          status: donation.status
        }));
        setDonations(formattedDonations);
      } else {
        console.error('Failed to load donations');
      }
    } catch (error) {
      console.error('Error loading donations:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDonations();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const donation = donations.find(d => d.id === id);
      if (!donation) return;

      const newStatus = donation.status === 'completed' ? 'pending' : 'completed';

      const response = await fetch(`/api/giving/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setDonations(donations.map(donation =>
          donation.id === id
            ? { ...donation, status: newStatus }
            : donation
        ));
      } else {
        console.error('Failed to update donation status');
      }
    } catch (error) {
      console.error('Error updating donation status:', error);
    }
  };

  const deleteDonation = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/giving/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDonations(donations.filter(donation => donation.id !== id));
      } else {
        console.error('Failed to delete donation');
      }
    } catch (error) {
      console.error('Error deleting donation:', error);
    }
  };

  const openEditPage = (donation: any) => {
    history.push(`/admin/giving/edit/${donation.id}`, { donation });
  };

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'completed' || statType === 'pending' ? statType : 'all');
  };

  const getSortedAndFilteredDonations = () => {
    // Apply filter
    let filtered = donations;
    if (filterBy === 'completed') {
      filtered = donations.filter(d => d.status === 'completed');
    } else if (filterBy === 'pending') {
      filtered = donations.filter(d => d.status === 'pending');
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'amount':
        sorted.sort((a, b) => {
          const amountA = a.amount || 0;
          const amountB = b.amount || 0;
          return amountB - amountA;
        });
        break;
      case 'completed':
      case 'pending':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

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
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                fontSize: '20px',
              }}
            />
          </div>
          <IonTitle className="title-ios">Giving Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon icon={cardOutline} style={{ fontSize: '3em', color: 'var(--ion-color-primary)', marginBottom: '16px' }} />
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8em', fontWeight: '700', color: 'var(--ion-text-color)' }}>
              Giving Management
            </h1>
            <p style={{ margin: '0', color: 'var(--ion-text-color)', opacity: 0.7, fontSize: '1em' }}>
              Track and manage donations and giving
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
                onClick={() => handleStatClick('amount')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'amount' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'amount' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'amount' ? '0 8px 25px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'amount' && (
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
                  animation: animatingStat === 'amount' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  ${totalAmount}
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
                onClick={() => handleStatClick('completed')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'completed' ? 'scale(1.2) rotate(3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'completed' ? '0 8px 25px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'completed' && (
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
                  animation: animatingStat === 'completed' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {donations.filter(d => d.status === 'completed').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Completed</div>
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
                onClick={() => handleStatClick('pending')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'pending' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'pending' ? '0 8px 25px rgba(245, 158, 11, 0.6), 0 0 0 4px rgba(245, 158, 11, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'pending' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#f59e0b',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'pending' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {donations.filter(d => d.status === 'pending').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Pending</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              routerLink="/admin/giving/add"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Donation
            </IonButton>
          </div>

          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              {filterBy === 'all' ? 'Recent Donations' :
               filterBy === 'completed' ? 'Completed Donations' :
               filterBy === 'pending' ? 'Pending Donations' :
               'Recent Donations'}
              {sortBy === 'amount' && ' (Sorted by Amount)'}
              {sortBy === 'date' && ' (Sorted by Date)'}
            </h2>

            {getSortedAndFilteredDonations().map((donation) => (
              <IonCard key={donation.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: '0', fontSize: '1.1em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                          ${donation.amount}
                        </h3>
                        <IonBadge style={{ backgroundColor: donation.status === 'completed' ? '#10b981' : '#f59e0b', color: 'white', fontWeight: '600', borderRadius: '8px' }}>
                          {donation.status}
                        </IonBadge>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                        {donation.donor} • {donation.purpose}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} />
                          {donation.date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={cash} />
                          {donation.method}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <IonButton fill="clear" size="small" onClick={() => toggleStatus(donation.id)} style={{ color: 'var(--ion-color-primary)' }}>
                        <IonIcon icon={donation.status === 'completed' ? eyeOff : eye} />
                      </IonButton>
                      <IonButton fill="clear" size="small" style={{ color: 'var(--ion-color-primary)' }} onClick={() => openEditPage(donation)}>
                        <IonIcon icon={create} />
                      </IonButton>
                      <IonButton fill="clear" size="small" style={{ color: '#ef4444' }} onClick={() => deleteDonation(donation.id)}>
                        <IonIcon icon={trash} />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Giving Management
            </IonText>
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default AdminGivingManager;
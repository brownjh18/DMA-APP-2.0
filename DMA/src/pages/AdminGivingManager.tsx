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
  IonItem,
  IonLabel,
  IonInput,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import {
  add,
  create,
  trash,
  cardOutline,
  cash,
  calendar,
  eye,
  eyeOff,
  closeCircle
} from 'ionicons/icons';

const AdminGivingManager: React.FC = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    donor: '',
    amount: '',
    purpose: '',
    date: '',
    method: ''
  });

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    const mockDonations = [
      {
        id: '1',
        donor: 'Anonymous',
        amount: 500,
        purpose: 'Building Fund',
        date: '2025-01-15',
        method: 'Online',
        status: 'completed'
      },
      {
        id: '2',
        donor: 'John Smith',
        amount: 200,
        purpose: 'Missions',
        date: '2025-01-12',
        method: 'Cash',
        status: 'completed'
      },
      {
        id: '3',
        donor: 'Mary Johnson',
        amount: 1000,
        purpose: 'Youth Ministry',
        date: '2025-01-10',
        method: 'Check',
        status: 'pending'
      }
    ];
    setDonations(mockDonations);
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDonations();
    event.detail.complete();
  };

  const toggleStatus = (id: string) => {
    setDonations(donations.map(donation =>
      donation.id === id
        ? { ...donation, status: donation.status === 'completed' ? 'pending' : 'completed' }
        : donation
    ));
  };

  const deleteDonation = (id: string) => {
    setDonations(donations.filter(donation => donation.id !== id));
  };

  const openEditModal = (donation: any) => {
    setSelectedDonation(donation);
    setEditForm({
      donor: donation.donor,
      amount: donation.amount.toString(),
      purpose: donation.purpose,
      date: donation.date,
      method: donation.method
    });
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!selectedDonation) return;

    setDonations(donations.map(donation =>
      donation.id === selectedDonation.id
        ? { ...donation, ...editForm, amount: parseFloat(editForm.amount) }
        : donation
    ));
    setShowEditModal(false);
    setSelectedDonation(null);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#ef4444' }}>${totalAmount}</div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Donations</div>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>{donations.filter(d => d.status === 'completed').length}</div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Completed</div>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#f59e0b' }}>{donations.filter(d => d.status === 'pending').length}</div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Pending</div>
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
              Recent Donations
            </h2>

            {donations.map((donation) => (
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
                      <IonButton fill="clear" size="small" style={{ color: 'var(--ion-color-primary)' }} onClick={() => openEditModal(donation)}>
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

        {/* Edit Donation Modal */}
        {showEditModal && (
          <>
            {/* INLINE CSS */}
            <style>{`
              .edit-sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0);
                z-index: 9998;
                opacity: 1;
                visibility: visible;
                transition: all 0.3s ease-in-out;
              }

              .edit-floating-sidebar {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 90%;
                max-width: 500px;
                max-height: 70vh;
                height: auto;
                padding: 20px;
                border-radius: 24px;
                border: 1px solid var(--ion-color-medium);
                backdrop-filter: blur(22px);
                -webkit-backdrop-filter: blur(22px);
                background: rgba(var(--ion-background-color-rgb), 0.9);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                flex-direction: column;
                overflow: visible;
              }

              .edit-floating-sidebar.open {
                transform: translate(-50%, -50%) scale(1);
              }

              .edit-close-button {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(var(--ion-background-color-rgb), 0.3);
                border: 1px solid var(--ion-color-step-200);
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s ease-in-out;
                z-index: 10000;
              }

              .edit-close-button:hover {
                background: rgba(var(--ion-background-color-rgb), 0.5);
                transform: scale(1.1);
              }

              .edit-close-button ion-icon {
                font-size: 18px;
              }

              .edit-content {
                margin-top: 40px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-height: calc(70vh - 80px);
                overflow-y: auto;
                overflow-x: hidden;
                padding-right: 8px;
                -webkit-overflow-scrolling: touch;
              }

              .edit-content::-webkit-scrollbar {
                width: 4px;
              }

              .edit-content::-webkit-scrollbar-track {
                background: rgba(var(--ion-background-color-rgb), 0.1);
                border-radius: 2px;
              }

              .edit-content::-webkit-scrollbar-thumb {
                background: var(--ion-color-step-400);
                border-radius: 2px;
              }

              .edit-content::-webkit-scrollbar-thumb:hover {
                background: var(--ion-color-step-500);
              }

              .edit-submit-btn {
                margin-top: 16px;
                --border-radius: 16px;
                font-weight: 600;
              }

              @media (max-width: 576px) {
                .edit-floating-sidebar {
                  width: 95%;
                  max-width: 460px;
                  max-height: 75vh;
                  padding: 16px;
                  top: 45%;
                  transform: translate(-50%, -50%) scale(0.8);
                }

                .edit-floating-sidebar.open {
                  top: 50%;
                  transform: translate(-50%, -50%) scale(1);
                }

                .edit-content {
                  max-height: calc(75vh - 80px);
                  gap: 12px;
                }
              }

              @media (max-height: 600px) {
                .edit-floating-sidebar {
                  max-height: 80vh;
                  top: 45%;
                }

                .edit-content {
                  max-height: calc(80vh - 80px);
                }
              }

              @media (prefers-color-scheme: dark) {
                .edit-floating-sidebar {
                  border-color: rgba(255,255,255,0.18);
                  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                }
              }
            `}</style>

            {/* SIDEBAR OVERLAY */}
            <div className="edit-sidebar-overlay" onClick={() => setShowEditModal(false)}></div>

            {/* SIDEBAR CONTENT */}
            <div className={`edit-floating-sidebar ${showEditModal ? 'open' : ''}`}>
              {/* Close Button */}
              <div className="edit-close-button" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={closeCircle} />
              </div>

              {/* Content */}
              <div className="edit-content">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                    Edit Donation
                  </h2>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Donor Name</IonLabel>
                    <IonInput
                      value={editForm.donor}
                      onIonChange={(e) => handleEditInputChange('donor', e.detail.value!)}
                      placeholder="Enter donor name"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Amount ($)</IonLabel>
                    <IonInput
                      type="number"
                      value={editForm.amount}
                      onIonChange={(e) => handleEditInputChange('amount', e.detail.value!)}
                      placeholder="Enter donation amount"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Purpose</IonLabel>
                    <IonInput
                      value={editForm.purpose}
                      onIonChange={(e) => handleEditInputChange('purpose', e.detail.value!)}
                      placeholder="Enter donation purpose"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Date</IonLabel>
                    <IonInput
                      value={editForm.date}
                      onIonChange={(e) => handleEditInputChange('date', e.detail.value!)}
                      placeholder="Enter date (YYYY-MM-DD)"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Payment Method</IonLabel>
                    <IonInput
                      value={editForm.method}
                      onIonChange={(e) => handleEditInputChange('method', e.detail.value!)}
                      placeholder="Enter payment method"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>
                </div>

                {/* Submit Button */}
                <IonButton
                  expand="block"
                  onClick={handleEditSave}
                  className="edit-submit-btn"
                >
                  <IonIcon icon={create} slot="start" />
                  Save Changes
                </IonButton>
              </div>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminGivingManager;
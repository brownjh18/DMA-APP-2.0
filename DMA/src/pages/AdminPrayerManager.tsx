import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonText,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonAlert,
  IonTextarea
} from '@ionic/react';
import {
  chatbubble,
  checkmarkCircle,
  closeCircle,
  time,
  person,
  calendar,
  eye,
  checkmark,
  close,
  arrowBack
} from 'ionicons/icons';

interface PrayerRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  request: string;
  status: 'pending' | 'answered' | 'archived';
  createdAt: string;
  answeredAt?: string;
  answeredBy?: string;
  response?: string;
}

const AdminPrayerManager: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<'pending' | 'answered' | 'all'>('pending');
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);

  useEffect(() => {
    loadPrayerRequests();
  }, []);

  useEffect(() => {
    const handleFocus = () => setIsKeyboardOpen(true);
    const handleBlur = () => setIsKeyboardOpen(false);

    const handleResize = () => {
      // Detect keyboard by checking if viewport height changed significantly
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const initialHeight = window.innerHeight;
      if (initialHeight - currentHeight > 150) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const loadPrayerRequests = () => {
    // Mock data - in real app, fetch from API
    const mockRequests: PrayerRequest[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+256 700 123 456',
        request: 'Please pray for my mother who is in the hospital. She needs healing and strength.',
        status: 'pending',
        createdAt: '2025-11-20T10:30:00Z'
      },
      {
        id: '2',
        name: 'Mary Smith',
        email: 'mary@example.com',
        request: 'Thank you for praying for my job interview. I got the position!',
        status: 'answered',
        createdAt: '2025-11-18T14:20:00Z',
        answeredAt: '2025-11-19T09:15:00Z',
        answeredBy: 'Pastor Johnson',
        response: 'Praise God! We are so happy to hear this wonderful news. May God continue to bless you in your new role.'
      },
      {
        id: '3',
        name: 'David Wilson',
        email: 'david@example.com',
        request: 'Please pray for peace in our family during this difficult time.',
        status: 'pending',
        createdAt: '2025-11-19T16:45:00Z'
      },
      {
        id: '4',
        name: 'Sarah Brown',
        email: 'sarah@example.com',
        phone: '+256 755 987 654',
        request: 'Prayers for my upcoming exams. I need wisdom and focus.',
        status: 'answered',
        createdAt: '2025-11-15T11:00:00Z',
        answeredAt: '2025-11-16T13:30:00Z',
        answeredBy: 'Sister Grace',
        response: 'May God grant you wisdom and peace during your exams. Remember Philippians 4:6-7.'
      }
    ];
    setPrayerRequests(mockRequests);
  };

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'pending' || statType === 'answered' ? statType : 'all');

    // Update segment to match filter
    if (statType === 'pending') {
      setActiveSegment('pending');
    } else if (statType === 'answered') {
      setActiveSegment('answered');
    } else {
      setActiveSegment('all');
    }
  };

  const getSortedAndFilteredRequests = () => {
    // Apply filter based on activeSegment and filterBy
    let filtered = prayerRequests;
    if (activeSegment === 'pending') {
      filtered = prayerRequests.filter(req => req.status === 'pending');
    } else if (activeSegment === 'answered') {
      filtered = prayerRequests.filter(req => req.status === 'answered');
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
      default:
        break;
    }

    return sorted;
  };


  const handleArchiveRequest = (requestId: string) => {
    const updatedRequests = prayerRequests.map(req =>
      req.id === requestId
        ? { ...req, status: 'archived' as const }
        : req
    );
    setPrayerRequests(updatedRequests);
    setAlertMessage('Prayer request archived successfully!');
    setShowAlert(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest || !responseText.trim()) return;

    const updatedRequests = prayerRequests.map(req =>
      req.id === selectedRequest.id
        ? {
            ...req,
            status: 'answered' as const,
            answeredAt: new Date().toISOString(),
            answeredBy: 'Admin', // In real app, get from user context
            response: responseText.trim()
          }
        : req
    );
    setPrayerRequests(updatedRequests);
    setAlertMessage('Response submitted successfully!');
    setShowAlert(true);
    setShowViewModal(false);
    setResponseText('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'answered': return 'success';
      case 'archived': return 'medium';
      default: return 'primary';
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <div
            onClick={() => history.back()}
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
          <IonTitle className="title-ios">Prayer Requests</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={chatbubble}
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
              Prayer Request Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Review and respond to prayer requests from the community
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
                  transform: animatingStat === 'pending' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
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
                  {prayerRequests.filter(r => r.status === 'pending').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Pending</div>
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
                onClick={() => handleStatClick('answered')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'answered' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'answered' ? 'scale(1.2) rotate(3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'answered' ? '0 8px 25px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'answered' && (
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
                  animation: animatingStat === 'answered' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {prayerRequests.filter(r => r.status === 'answered').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Answered</div>
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
                onClick={() => handleStatClick('date')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(107, 114, 128, 0.6), 0 0 0 4px rgba(107, 114, 128, 0.3)' : 'none',
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
                    background: 'radial-gradient(circle, rgba(107, 114, 128, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#6b7280',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {prayerRequests.length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Total</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <IonSegment
            value={activeSegment}
            onIonChange={(e) => setActiveSegment(e.detail.value as any)}
            style={{ marginBottom: '24px' }}
          >
            <IonSegmentButton value="pending">
              <IonLabel>Pending ({prayerRequests.filter(r => r.status === 'pending').length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="answered">
              <IonLabel>Answered ({prayerRequests.filter(r => r.status === 'answered').length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all">
              <IonLabel>All ({prayerRequests.length})</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <h3 style={{
              margin: '0',
              fontSize: '1.1em',
              fontWeight: '600',
              color: 'var(--ion-text-color)',
              opacity: 0.8
            }}>
              {activeSegment === 'pending' ? 'Pending Prayer Requests' :
               activeSegment === 'answered' ? 'Answered Prayer Requests' :
               'All Prayer Requests'}
              {sortBy === 'date' && ' (Sorted by Date)'}
            </h3>
          </div>

          {/* Prayer Requests List */}
          <div style={{ marginBottom: '20px' }}>
            {getSortedAndFilteredRequests().map((request) => (
              <IonCard key={request.id} style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <IonCardHeader style={{ paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <IonCardTitle style={{ fontSize: '1.1em', marginBottom: '4px' }}>
                        {request.name}
                      </IonCardTitle>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <IonIcon icon={person} style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }} />
                        <IonText style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                          {request.email}
                        </IonText>
                      </div>
                      {request.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IonIcon icon={time} style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }} />
                          <IonText style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                            {request.phone}
                          </IonText>
                        </div>
                      )}
                    </div>
                    <IonBadge color={getStatusColor(request.status)} style={{ fontSize: '0.8em' }}>
                      {request.status}
                    </IonBadge>
                  </div>
                </IonCardHeader>

                <IonCardContent>
                  <p style={{ marginBottom: '12px', color: 'var(--ion-text-color)' }}>
                    {request.request}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <IonIcon icon={calendar} style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }} />
                    <IonText style={{ fontSize: '0.85em', color: 'var(--ion-color-medium)' }}>
                      Submitted: {formatDate(request.createdAt)}
                    </IonText>
                  </div>

                  {request.status === 'answered' && request.answeredAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <IonIcon icon={checkmarkCircle} style={{ fontSize: '0.9em', color: '#10b981' }} />
                      <IonText style={{ fontSize: '0.85em', color: '#10b981' }}>
                        Answered: {formatDate(request.answeredAt)} by {request.answeredBy}
                      </IonText>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <IonButton
                      fill="outline"
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedRequest(request);
                        setResponseText('');
                        setShowViewModal(true);
                      }}
                      style={{ '--border-radius': '20px' }}
                    >
                      <IonIcon icon={eye} slot="start" />
                      View
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      color="danger"
                      onClick={() => handleArchiveRequest(request.id)}
                      style={{ '--border-radius': '20px' }}
                    >
                      <IonIcon icon={close} slot="start" />
                      Archive
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}

            {getSortedAndFilteredRequests().length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ion-color-medium)' }}>
                <IonIcon icon={chatbubble} style={{ fontSize: '3em', marginBottom: '16px', opacity: 0.5 }} />
                <p>No prayer requests in this category</p>
              </div>
            )}
          </div>
        </div>


        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notice"
          message={alertMessage}
          buttons={['OK']}
        />

        {/* View Prayer Request Sidebar */}
        {showViewModal && (
          <>
            {/* INLINE CSS */}
            <style>{`
              .prayer-sidebar-overlay {
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

              .prayer-floating-sidebar {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 85%;
                max-width: 400px;
                max-height: 50vh;
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
                overflow: hidden;
              }

              .prayer-floating-sidebar.open {
                transform: translate(-50%, -50%) scale(1);
              }

              .prayer-floating-sidebar.keyboard-open {
                max-height: 50vh;
                top: 25%;
                transform: translate(-50%, 0) scale(1);
              }

              .prayer-close-button {
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

              .prayer-close-button:hover {
                background: rgba(var(--ion-background-color-rgb), 0.5);
                transform: scale(1.1);
              }

              .prayer-close-button ion-icon {
                font-size: 18px;
              }

              .prayer-content {
                margin-top: 40px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                flex: 1;
                overflow-y: auto;
                padding-right: 4px;
              }

              .prayer-content::-webkit-scrollbar {
                width: 4px;
              }

              .prayer-content::-webkit-scrollbar-track {
                background: rgba(var(--ion-background-color-rgb), 0.1);
                border-radius: 2px;
              }

              .prayer-content::-webkit-scrollbar-thumb {
                background: var(--ion-color-step-400);
                border-radius: 2px;
              }

              .prayer-content::-webkit-scrollbar-thumb:hover {
                background: var(--ion-color-step-500);
              }

              .prayer-info-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 14px;
                border-radius: 16px;
                background: rgba(var(--ion-background-color-rgb), 0.3);
                border: 1px solid var(--ion-color-step-200);
              }

              .prayer-info-item ion-icon {
                font-size: 20px;
                color: var(--ion-color-primary);
              }

              .prayer-request-section {
                padding: 16px;
                border-radius: 16px;
                background: rgba(var(--ion-background-color-rgb), 0.4);
                border: 1px solid var(--ion-color-step-150);
              }

              .prayer-response-section {
                padding: 16px;
                border-radius: 16px;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.2);
              }

              .prayer-submit-btn {
                margin-top: 16px;
                --border-radius: 16px;
                font-weight: 600;
              }

              @media (max-width: 576px) {
                .prayer-floating-sidebar {
                  width: 95%;
                  max-width: 360px;
                  max-height: 70vh;
                  padding: 16px;
                }

                .prayer-floating-sidebar.keyboard-open {
                  max-height: 50vh;
                  top: 15%;
                }
              }

              @media (prefers-color-scheme: dark) {
                .prayer-floating-sidebar {
                  border-color: rgba(255,255,255,0.18);
                  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                }
                .prayer-info-item,
                .prayer-request-section {
                  border-color: rgba(255,255,255,0.18);
                }
              }
            `}</style>

            {/* SIDEBAR OVERLAY */}
            <div className="prayer-sidebar-overlay" onClick={() => setShowViewModal(false)}></div>

            {/* SIDEBAR CONTENT */}
            <div className={`prayer-floating-sidebar ${showViewModal ? 'open' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''}`}>
              {/* Close Button */}
              <div className="prayer-close-button" onClick={() => setShowViewModal(false)}>
                <IonIcon icon={close} />
              </div>

              {/* Content */}
              {selectedRequest && (
                <div className="prayer-content">
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                      Prayer Request Details
                    </h2>
                  </div>

                  {/* Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <IonBadge color={getStatusColor(selectedRequest.status)} style={{ fontSize: '0.9em', padding: '8px 12px' }}>
                      {selectedRequest.status}
                    </IonBadge>
                  </div>

                  {/* Request Details */}
                  <div className="prayer-info-item">
                    <IonIcon icon={person} />
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>{selectedRequest.name}</div>
                      <div style={{ fontSize: '0.85em', color: 'var(--ion-color-medium)' }}>{selectedRequest.email}</div>
                    </div>
                  </div>

                  {selectedRequest.phone && (
                    <div className="prayer-info-item">
                      <IonIcon icon={time} />
                      <div style={{ color: 'var(--ion-text-color)' }}>{selectedRequest.phone}</div>
                    </div>
                  )}

                  <div className="prayer-info-item">
                    <IonIcon icon={calendar} />
                    <div style={{ color: 'var(--ion-text-color)' }}>
                      Submitted: {formatDate(selectedRequest.createdAt)}
                    </div>
                  </div>

                  {/* Prayer Request */}
                  <div className="prayer-request-section">
                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                      Prayer Request
                    </h3>
                    <p style={{ margin: '0', color: 'var(--ion-text-color)', lineHeight: '1.5', fontSize: '0.95em' }}>
                      {selectedRequest.request}
                    </p>
                  </div>

                  {/* Response Section */}
                  {selectedRequest.status === 'answered' ? (
                    <div className="prayer-response-section">
                      <h3 style={{ margin: '0 0 12px 0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                        Response
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <IonIcon icon={checkmarkCircle} style={{ fontSize: '1.1em', color: '#10b981' }} />
                        <span style={{ color: '#10b981', fontSize: '0.9em' }}>
                          Answered: {formatDate(selectedRequest.answeredAt!)} by {selectedRequest.answeredBy}
                        </span>
                      </div>
                      <p style={{ margin: '0', color: 'var(--ion-text-color)', lineHeight: '1.5', fontSize: '0.95em' }}>
                        {selectedRequest.response}
                      </p>
                    </div>
                  ) : (
                    <div className="prayer-request-section">
                      <h3 style={{ margin: '0 0 12px 0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                        Add Response
                      </h3>
                      <IonTextarea
                        value={responseText}
                        onIonChange={(e) => setResponseText(e.detail.value!)}
                        onFocus={() => setIsKeyboardOpen(true)}
                        onBlur={() => setIsKeyboardOpen(false)}
                        placeholder="Write your response to this prayer request..."
                        rows={4}
                        style={{
                          '--background': 'rgba(var(--ion-background-color-rgb), 0.3)',
                          '--border-radius': '12px',
                          '--border-color': 'var(--ion-color-step-200)',
                          marginBottom: '16px'
                        }}
                      />
                      <IonButton
                        expand="block"
                        onClick={handleSubmitResponse}
                        disabled={!responseText.trim()}
                        className="prayer-submit-btn"
                      >
                        <IonIcon icon={checkmark} slot="start" />
                        Submit Response
                      </IonButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminPrayerManager;
import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonLoading,
  IonAlert
} from '@ionic/react';
import {
  save,
  cardOutline,
  person,
  calendar,
  cash,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const AddDonation: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    donorName: '',
    amount: '',
    date: '',
    paymentMethod: '',
    purpose: '',
    notes: '',
    status: 'completed'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.donorName || !formData.amount || !formData.date) {
      setAlertMessage('Please fill in all required fields (Donor Name, Amount, Date)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const donationData = {
        donorName: formData.donorName,
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes
      };

      const response = await fetch('/api/giving', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationData)
      });

      if (response.ok) {
        setAlertMessage('Donation recorded successfully!');
        setShowAlert(true);

        // Navigate back after success
        setTimeout(() => {
          history.push('/admin/giving');
        }, 1500);
      } else {
        const error = await response.json();
        setAlertMessage(error.error || 'Failed to record donation');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error saving donation:', error);
      setAlertMessage('Failed to record donation. Please try again.');
      setShowAlert(true);
    }

    setLoading(false);
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
                  color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                  fontSize: '20px',
                }}
              />
            </div>
            <IonTitle className="title-ios">Add Donation</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={loading}>
              <IonIcon icon={save} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={cardOutline}
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
              Record New Donation
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Add a new donation record
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Donor Name *</IonLabel>
              <IonInput
                value={formData.donorName}
                onIonChange={(e) => handleInputChange('donorName', e.detail.value!)}
                placeholder="Enter donor's full name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Donation Amount *</IonLabel>
              <IonInput
                type="number"
                value={formData.amount}
                onIonChange={(e) => handleInputChange('amount', e.detail.value!)}
                placeholder="Enter amount (e.g., 50000)"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Date *</IonLabel>
              <IonInput
                type="date"
                value={formData.date}
                onIonChange={(e) => handleInputChange('date', e.detail.value!)}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Payment Method</IonLabel>
              <IonSelect
                value={formData.paymentMethod}
                onIonChange={(e) => handleInputChange('paymentMethod', e.detail.value)}
                placeholder="Select payment method"
              >
                <IonSelectOption value="cash">Cash</IonSelectOption>
                <IonSelectOption value="bank_transfer">Bank Transfer</IonSelectOption>
                <IonSelectOption value="mobile_money">Mobile Money</IonSelectOption>
                <IonSelectOption value="check">Check</IonSelectOption>
                <IonSelectOption value="online">Online Payment</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Purpose</IonLabel>
              <IonInput
                value={formData.purpose}
                onIonChange={(e) => handleInputChange('purpose', e.detail.value!)}
                placeholder="e.g., Building Fund, Missions, General"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Status</IonLabel>
              <IonSelect
                value={formData.status}
                onIonChange={(e) => handleInputChange('status', e.detail.value)}
              >
                <IonSelectOption value="completed">Completed</IonSelectOption>
                <IonSelectOption value="pending">Pending</IonSelectOption>
                <IonSelectOption value="failed">Failed</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Additional Notes</IonLabel>
              <IonTextarea
                value={formData.notes}
                onIonChange={(e) => handleInputChange('notes', e.detail.value!)}
                placeholder="Any additional notes or reference information"
                rows={3}
              />
            </IonItem>
          </div>

          <IonButton
            expand="block"
            onClick={handleSave}
            disabled={loading}
            style={{
              height: '48px',
              borderRadius: '24px',
              fontWeight: '600',
              backgroundColor: 'var(--ion-color-primary)',
              '--border-radius': '24px'
            }}
          >
            <IonIcon icon={save} slot="start" />
            Save Donation
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Giving Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Saving donation..." />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notice"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddDonation;
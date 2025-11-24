import React, { useState } from 'react';
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
  cash
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

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setAlertMessage('Donation recorded successfully!');
      setShowAlert(true);

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/giving');
      }, 1500);
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/giving" />
          </IonButtons>
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
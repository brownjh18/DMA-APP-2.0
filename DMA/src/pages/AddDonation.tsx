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
  IonText,
  IonLoading,
  IonAlert
} from '@ionic/react';
import {
  save,
  cardOutline,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import './AdminForm.css';
import './AdminDashboard.css';

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

        setTimeout(() => {
          history.replace('/admin/giving');
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
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}><IonIcon icon={arrowBack} style={{ fontSize: '22px' }} /></IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-28px' }}>Add Donation</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={loading}>
              <IonIcon icon={save} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="af-page">
          <div className="af-section">
            <div className="af-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={cardOutline} style={{ color: '#fff', fontSize: '28px' }} />
              </div>
              <h1 className="nd-title" style={{ margin: '0 0 6px 0', fontSize: '22px' }}>Record New Donation</h1>
              <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '14px' }}>Add a new donation record</p>
            </div>
          </div>

          <div className="af-section">
            <div className="af-card">
              <div className="af-field">
                <label className="af-label">Donor Name <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.donorName} onChange={(e) => handleInputChange('donorName', e.target.value)} placeholder="Enter donor's full name" />
              </div>

              <div className="af-field">
                <label className="af-label">Donation Amount <span className="af-required">*</span></label>
                <input type="number" className="af-input" value={formData.amount} onChange={(e) => handleInputChange('amount', e.target.value)} placeholder="Enter amount (e.g., 50000)" />
              </div>

              <div className="af-field">
                <label className="af-label">Date <span className="af-required">*</span></label>
                <input type="date" className="af-input" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
              </div>

              <div className="af-field">
                <label className="af-label">Payment Method</label>
                <select className="af-input af-select" value={formData.paymentMethod} onChange={(e) => handleInputChange('paymentMethod', e.target.value)}>
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Check</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              <div className="af-field">
                <label className="af-label">Purpose</label>
                <input type="text" className="af-input" value={formData.purpose} onChange={(e) => handleInputChange('purpose', e.target.value)} placeholder="e.g., Building Fund, Missions, General" />
              </div>

              <div className="af-field">
                <label className="af-label">Status</label>
                <select className="af-input af-select" value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)}>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="af-field">
                <label className="af-label">Additional Notes</label>
                <textarea className="af-input af-textarea" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Any additional notes or reference information" rows={3} />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="af-submit">
            <IonIcon icon={save} style={{ fontSize: '18px', marginRight: '8px' }} />
            Save Donation
          </button>

          <div className="af-footer">
            <IonText>Dove Church - Giving Management</IonText>
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

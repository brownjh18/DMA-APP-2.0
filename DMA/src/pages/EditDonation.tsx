import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText,
  IonLoading,
  IonAlert
} from '@ionic/react';
import {
  save,
  cardOutline
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

interface RouteParams {
  id: string;
}

const EditDonation: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
  const { isDarkMode } = useSettings();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    donor: '',
    amount: '',
    purpose: '',
    date: '',
    method: ''
  });

  useEffect(() => {
    const donation = (location.state as any)?.donation;
    if (donation) {
      setFormData({
        donor: donation.donor || '',
        amount: donation.amount?.toString() || '',
        purpose: donation.purpose || '',
        date: donation.date || '',
        method: donation.method || ''
      });
    } else {
      loadDonation();
    }
  }, [location.state]);

  const loadDonation = async () => {};

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.donor || !formData.amount || !formData.date) {
      setAlertMessage('Please fill in all required fields (Donor, Amount, Date)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedDonation = {
        ...(location.state as any)?.donation,
        donor: formData.donor,
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        date: formData.date,
        method: formData.method
      };

      localStorage.setItem('updatedDonation', JSON.stringify(updatedDonation));

      setLoading(false);
      setAlertMessage('Donation updated successfully!');
      setShowAlert(true);

      setTimeout(() => {
        history.push('/admin/giving');
      }, 1500);
    } catch (error) {
      setLoading(false);
      setAlertMessage('Failed to update donation');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios" style={{ background: 'transparent' }}>
          <BackButton />
          <IonTitle className="nd-title">Edit Donation</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="af-page">
          <div className="af-section">
            <div className="af-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={cardOutline} style={{ color: '#fff', fontSize: '28px' }} />
              </div>
              <h1 className="nd-title" style={{ margin: '0 0 6px 0', fontSize: '22px' }}>Edit Donation</h1>
              <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '14px' }}>Update donation details and information</p>
            </div>
          </div>

          <div className="af-section">
            <div className="af-card">
              <div className="af-field">
                <label className="af-label">Donor Name <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.donor} onChange={(e) => handleInputChange('donor', e.target.value)} placeholder="Enter donor name" />
              </div>

              <div className="af-field">
                <label className="af-label">Amount ($) <span className="af-required">*</span></label>
                <input type="number" className="af-input" value={formData.amount} onChange={(e) => handleInputChange('amount', e.target.value)} placeholder="Enter donation amount" />
              </div>

              <div className="af-field">
                <label className="af-label">Purpose</label>
                <input type="text" className="af-input" value={formData.purpose} onChange={(e) => handleInputChange('purpose', e.target.value)} placeholder="Enter donation purpose" />
              </div>

              <div className="af-field">
                <label className="af-label">Date <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} placeholder="Enter date (YYYY-MM-DD)" />
              </div>

              <div className="af-field">
                <label className="af-label">Payment Method</label>
                <input type="text" className="af-input" value={formData.method} onChange={(e) => handleInputChange('method', e.target.value)} placeholder="Enter payment method" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="af-submit">
            <IonIcon icon={save} style={{ fontSize: '18px', marginRight: '8px' }} />
            Update Donation
          </button>

          <div className="af-footer">
            <IonText>Dove Church - Giving Management</IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Updating donation..." />
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

export default EditDonation;

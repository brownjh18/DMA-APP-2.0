import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonLoading
} from '@ionic/react';
import { personAdd, mail, lockClosed, person, call, eye, eyeOff } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import apiService from '../services/api';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const history = useHistory();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();


    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setSuccess('');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      // Show success message and redirect to sign in
      setSuccess('Account created successfully! Redirecting to sign in...');

      // Redirect to sign in after a short delay
      setTimeout(() => {
        history.push('/signin');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/signin" />
          </IonButtons>
          <IonTitle className="title-ios">Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={personAdd}
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
              Join Our Community
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Create your account to get started
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <IonText style={{
                color: '#dc2626',
                fontSize: '0.9em',
                fontWeight: '500'
              }}>
                {error}
              </IonText>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <IonText style={{
                color: '#059669',
                fontSize: '0.9em',
                fontWeight: '500'
              }}>
                {success}
              </IonText>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp}>
            {/* Name Input */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={person} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="text"
                value={formData.name}
                onIonChange={(e) => {
                  handleInputChange('name', e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Full name"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Email Input */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={mail} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="email"
                value={formData.email}
                onIonChange={(e) => {
                  handleInputChange('email', e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Email address"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Phone Input */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={call} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="tel"
                value={formData.phone}
                onIonChange={(e) => {
                  handleInputChange('phone', e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Phone number (optional)"
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Password Input */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={lockClosed} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onIonChange={(e) => {
                  handleInputChange('password', e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Password (min. 6 characters)"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  '--color': 'var(--ion-color-medium)',
                  '--padding-start': '8px',
                  '--padding-end': '8px'
                }}
              >
                <IonIcon icon={showPassword ? eyeOff : eye} />
              </IonButton>
            </IonItem>

            {/* Confirm Password Input */}
            <IonItem
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={lockClosed} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onIonChange={(e) => {
                  handleInputChange('confirmPassword', e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Confirm password"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  '--color': 'var(--ion-color-medium)',
                  '--padding-start': '8px',
                  '--padding-end': '8px'
                }}
              >
                <IonIcon icon={showConfirmPassword ? eyeOff : eye} />
              </IonButton>
            </IonItem>

            {/* Sign Up Button */}
            <IonButton
              expand="block"
              type="submit"
              style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}
              disabled={loading}
            >
              <IonIcon icon={personAdd} slot="start" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </IonButton>
          </form>

          {/* Sign In Link */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '0.9em'
            }}>
              Already have an account?{' '}
              <span
                style={{
                  color: 'var(--ion-color-primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onClick={() => history.push('/signin')}
              >
                Sign In
              </span>
            </IonText>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em'
            }}>
              Dove Ministries Africa
            </IonText>
          </div>
        </div>

        {/* Loading Spinner */}
        <IonLoading
          isOpen={loading}
          message="Creating your account..."
          spinner="crescent"
        />

      </IonContent>
    </IonPage>
  );
};

export default SignUp;
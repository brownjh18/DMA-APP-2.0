import React, { useState, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonLoading
} from '@ionic/react';
import { logIn, personCircle, mail, lockClosed, eye, eyeOff, arrowBack } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import './SignIn.css';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  // Get redirect URL from location state, or default to /tab1
  const from = (location.state as any)?.from?.pathname || '/tab1';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Redirect to the original destination or home page after successful login
      history.push(from);
    } catch (err: any) {
      const errorMessage = err.message || 'Sign in failed. Please try again.';
      // Show specific message for authentication errors
      if (errorMessage.includes('Invalid email or password') ||
          errorMessage.includes('Account not found')) {
        setError('Wrong username or password, please try again');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="signin-page">
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '40px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={personCircle}
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
              Sign In
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Welcome back to Dove Ministries
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-box">
              <IonText className="error-box-text">
                {error}
              </IonText>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn}>
            <IonItem
              className="signin-input-item"
              lines="none"
            >
              <IonIcon icon={mail} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => {
                  setEmail(e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Email address"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            <IonItem
              className="signin-input-item"
              style={{ marginBottom: '24px' }}
              lines="none"
            >
              <IonIcon icon={lockClosed} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onIonChange={(e) => {
                  setPassword(e.detail.value!);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="Password"
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
              <IonIcon icon={logIn} slot="start" />
              {loading ? 'Signing In...' : 'Sign In'}
            </IonButton>
          </form>

          {/* Register Link */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              fontSize: '0.9em'
            }}>
              <span style={{ opacity: 0.7 }}>
                Don't have an account?{' '}
              </span>
              <span
                style={{
                  color: 'var(--ion-color-primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  opacity: 1
                }}
                onClick={() => history.push('/signup')}
              >
                Register
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
          message="Signing you in..."
          spinner="crescent"
        />

      </IonContent>
    </IonPage>
  );
};

export default SignIn;

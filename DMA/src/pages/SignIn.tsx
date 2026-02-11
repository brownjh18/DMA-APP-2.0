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
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../App';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();
  const { login } = useContext(AuthContext);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Redirect to home page after successful login
      history.push('/tab1');
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
    <IonPage>
      <IonHeader translucent>
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
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Sign In</IonTitle>
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

          {/* Sign In Form */}
          <form onSubmit={handleSignIn}>
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                '--border-radius': '12px'
              }}
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
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                '--border-radius': '12px'
              }}
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
              opacity: 0.7,
              fontSize: '0.9em'
            }}>
              Don't have an account?{' '}
              <span
                style={{
                  color: 'var(--ion-color-primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
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

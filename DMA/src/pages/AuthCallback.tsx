import React, { useEffect, useContext } from 'react';
import { IonPage, IonContent, IonSpinner, IonText } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import apiService from '../services/api';

const AuthCallback: React.FC = () => {
  const { updateUser } = useContext(AuthContext);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token and user data from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const userData = urlParams.get('user');

        if (token && userData) {
          const user = JSON.parse(decodeURIComponent(userData));

          // Set the token in API service
          apiService.setToken(token);

          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Update the auth context
          updateUser(user);

          // Redirect to home page
          history.replace('/tab1');
        } else {
          // Handle error case
          console.error('Missing token or user data in callback');
          history.replace('/signin?error=auth_failed');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        history.replace('/signin?error=auth_failed');
      }
    };

    handleCallback();
  }, [location, history, updateUser]);

  return (
    <IonPage>
      <IonContent className="ion-text-center ion-padding">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}>
          <IonSpinner name="crescent" />
          <IonText style={{ marginTop: '16px' }}>
            <h2>Signing you in...</h2>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuthCallback;
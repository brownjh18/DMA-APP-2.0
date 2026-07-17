import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

interface BackButtonProps {
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  const history = useHistory();

  return (
    <IonButton
      fill="clear"
      slot="start"
      onClick={onClick || (() => history.goBack())}
      style={{ marginLeft: '4px' }}
    >
      <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
    </IonButton>
  );
};

export default BackButton;
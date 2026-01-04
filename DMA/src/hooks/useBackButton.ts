import { useHistory } from 'react-router-dom';

/**
 * Custom hook for consistent back button behavior
 * Falls back to a default href if there's no history
 */
export const useBackButton = (defaultHref: string = '/tab1') => {
  const history = useHistory();

  const handleBack = () => {
    // Try to go back in history
    if (window.history.length > 1) {
      history.goBack();
    } else {
      // No history, go to default
      history.push(defaultHref);
    }
  };

  return handleBack;
};

export default useBackButton;

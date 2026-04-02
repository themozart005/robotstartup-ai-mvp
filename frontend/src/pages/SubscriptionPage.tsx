// frontend/src/pages/SubscriptionPage.tsx
// Redirects to the new institutional pricing page

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/pricing', { replace: true });
  }, [navigate]);

  return null;
};

export default SubscriptionPage;
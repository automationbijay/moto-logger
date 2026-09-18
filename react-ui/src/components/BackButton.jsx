import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

export const BackButton = ({ label = 'Back', to, className = '', onClick }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button className={`back-button ${className}`} onClick={handleBack} aria-label={label}>
      <ArrowLeft size={20} />
      <span>{label}</span>
    </button>
  );
};

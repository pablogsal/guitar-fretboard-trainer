import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface FeedbackDisplayProps {
  message: string;
  show: boolean;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ message, show }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);
  
  if (!isVisible && !show) return null;
  
  const getFeedbackType = () => {
    if (message.includes('Correct')) return 'success';
    if (message.includes('Incorrect')) return 'error';
    if (message.includes('failed')) return 'error';
    if (message.includes('completed')) return 'info';
    return 'info';
  };
  
  const feedbackType = getFeedbackType();
  
  const getStyles = () => {
    switch (feedbackType) {
      case 'success':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-300',
          border: 'border-green-500/30',
          icon: <CheckCircle className="mr-2 text-green-400" size={20} />
        };
      case 'error':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-300',
          border: 'border-red-500/30',
          icon: <AlertTriangle className="mr-2 text-red-400" size={20} />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-300',
          border: 'border-blue-500/30',
          icon: <Info className="mr-2 text-blue-400" size={20} />
        };
    }
  };
  
  const styles = getStyles();
  
  return (
    <div 
      className={`mb-8 p-4 rounded-lg border ${styles.bg} ${styles.text} ${styles.border} 
        transition-all duration-300 ${show ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}
    >
      <div className="flex items-center justify-center text-lg font-medium">
        {styles.icon}
        {message}
      </div>
    </div>
  );
};

export default FeedbackDisplay;
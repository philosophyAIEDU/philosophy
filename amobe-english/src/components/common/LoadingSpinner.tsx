import React from 'react';
import { Loader2 } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeStyles: Record<SpinnerSize, { spinner: string; text: string }> = {
  sm: { spinner: 'h-4 w-4', text: 'text-sm' },
  md: { spinner: 'h-6 w-6', text: 'text-base' },
  lg: { spinner: 'h-8 w-8', text: 'text-lg' },
  xl: { spinner: 'h-12 w-12', text: 'text-xl' },
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
  fullScreen = false,
}) => {
  const { spinner: spinnerSize, text: textSize } = sizeStyles[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${spinnerSize} animate-spin text-blue-600`} />
      {text && (
        <p className={`${textSize} text-gray-600 font-medium`}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

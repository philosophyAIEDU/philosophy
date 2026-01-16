import React from 'react';

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div
    className={`px-6 py-4 border-b border-gray-200 font-semibold text-gray-800 ${className}`}
  >
    {children}
  </div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div
    className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
  >
    {children}
  </div>
);

const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({ children, header, footer, hoverable = false, className = '', style, onClick }) => {
  const baseStyles =
    'bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200';
  const hoverStyles = hoverable
    ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} style={style} onClick={onClick}>
      {header && <CardHeader>{header}</CardHeader>}
      <CardBody>{children}</CardBody>
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

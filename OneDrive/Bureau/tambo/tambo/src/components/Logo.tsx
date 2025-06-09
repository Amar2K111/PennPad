import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`text-5xl font-extrabold text-[#2686F8] tracking-tight select-none ${className}`}>
      TAMBO
    </div>
  );
};

export default Logo; 
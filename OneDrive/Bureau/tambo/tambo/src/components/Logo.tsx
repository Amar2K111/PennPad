import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`text-3xl font-extrabold text-[#2686F8] tracking-tight select-none ${className}`}
      style={{
        textShadow: `
          -1px -1px 0 #fff,
          1px -1px 0 #fff,
          -1px 1px 0 #fff,
          1px 1px 0 #fff
        `
      }}
    >
      TAMBO
    </div>
  );
};

export default Logo; 
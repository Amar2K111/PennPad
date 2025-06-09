import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`text-2xl font-extrabold text-[#2686F8] tracking-tight select-none ${className}`}
      style={{
        textShadow: `
          -2px -2px 0 #fff,
          2px -2px 0 #fff,
          -2px 2px 0 #fff,
          2px 2px 0 #fff,
          0px 2px 0 #fff,
          2px 0px 0 #fff,
          0px -2px 0 #fff,
          -2px 0px 0 #fff
        `
      }}
    >
      TAMBO
    </div>
  );
};

export default Logo; 
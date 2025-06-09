import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{
        transform: 'perspective(1000px) rotateY(-25deg)',
        transformStyle: 'preserve-3d',
        marginLeft: '-20px'
      }}
    >
      <div 
        className="text-3xl font-extrabold tracking-tight select-none"
        style={{
          color: '#2686F8',
          textShadow: `
            -1px -1px 0 rgba(0, 0, 0, 0.5),
            1px -1px 0 rgba(0, 0, 0, 0.5),
            -1px 1px 0 rgba(0, 0, 0, 0.5),
            1px 1px 0 rgba(0, 0, 0, 0.5)
          `,
          transform: 'translateZ(20px)',
        }}
      >
        TAMBO
      </div>
    </div>
  );
};

export default Logo; 
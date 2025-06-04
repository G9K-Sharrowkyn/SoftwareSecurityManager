import React, { useEffect, useState } from 'react';

interface StarBackgroundProps {
  className?: string;
}

function generateBoxShadows(numberOfStars: number, width: number, height: number): string {
  let boxShadow = '';
  for (let i = 0; i < numberOfStars; i++) {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * (height * 2));
    boxShadow += `${x}px ${y}px #FFF, `;
  }
  return boxShadow.slice(0, -2);
}

const StarBackground: React.FC<StarBackgroundProps> = ({ className = '' }) => {
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const smallStars = generateBoxShadows(2100, dimensions.width, dimensions.height);
  const mediumStars = generateBoxShadows(500, dimensions.width, dimensions.height);
  const bigStars = generateBoxShadows(500, dimensions.width, dimensions.height);

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`} style={{
      background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
      zIndex: -1
    }}>
      <div 
        className="absolute inset-0"
        style={{ 
          width: '1px',
          height: '1px',
          background: 'transparent',
          boxShadow: smallStars,
          animation: 'animStar 50s linear infinite'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{ 
          width: '2px',
          height: '2px',
          background: 'transparent',
          boxShadow: mediumStars,
          animation: 'animStar 100s linear infinite'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{ 
          width: '3px',
          height: '3px',
          background: 'transparent',
          boxShadow: bigStars,
          animation: 'animStar 150s linear infinite'
        }}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-star-silver">
          Proteus Nebula
          <br />
          <span className="text-2xl md:text-3xl">
            Battle Card Game
          </span>
        </span>
      </div>

      <style jsx>{`
        @keyframes animStar {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-100vh);
          }
        }
      `}</style>
    </div>
  );
};

export default StarBackground;

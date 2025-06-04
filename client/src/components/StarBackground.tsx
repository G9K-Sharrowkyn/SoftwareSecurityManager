import React, { useEffect, useState } from 'react';

function generateBoxShadows(numberOfStars: number, width: number, height: number) {
  let boxShadow = '';
  for (let i = 0; i < numberOfStars; i++) {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * (height * 2));
    boxShadow += `${x}px ${y}px #FFF, `;
  }
  return boxShadow.slice(0, -2);
}

const StarBackground: React.FC = () => {
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const smallStars = generateBoxShadows(2100, dimensions.width, dimensions.height);
  const mediumStars = generateBoxShadows(500, dimensions.width, dimensions.height);
  const bigStars = generateBoxShadows(300, dimensions.width, dimensions.height);

  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-b from-cosmic-blue to-space-black overflow-hidden">
      <div 
        id="stars" 
        className="absolute inset-0 w-1 h-1 animate-starfield"
        style={{ boxShadow: smallStars }}
      />
      <div 
        id="stars2" 
        className="absolute inset-0 w-2 h-2 animate-starfield"
        style={{ 
          boxShadow: mediumStars,
          animationDuration: '100s'
        }}
      />
      <div 
        id="stars3" 
        className="absolute inset-0 w-3 h-3 animate-starfield"
        style={{ 
          boxShadow: bigStars,
          animationDuration: '150s'
        }}
      />
    </div>
  );
};

export default StarBackground;

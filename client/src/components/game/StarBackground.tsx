import { useEffect, useState } from 'react';

function generateBoxShadows(numberOfStars: number, width: number, height: number) {
  let boxShadow = '';
  for (let i = 0; i < numberOfStars; i++) {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * (height * 2));
    boxShadow += `${x}px ${y}px #FFF, `;
  }
  return boxShadow.slice(0, -2);
}

const StarBackground = () => {
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
    <div className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-deep-blue via-cosmic-blue to-space-black">
        <div className="absolute inset-0 opacity-80">
          <div 
            className="absolute inset-0 animate-starfield"
            style={{ 
              width: '1px', 
              height: '1px',
              boxShadow: smallStars,
              animationDuration: '50s'
            }}
          />
          <div 
            className="absolute inset-0 animate-starfield"
            style={{ 
              width: '2px', 
              height: '2px',
              boxShadow: mediumStars,
              animationDuration: '100s'
            }}
          />
          <div 
            className="absolute inset-0 animate-starfield"
            style={{ 
              width: '3px', 
              height: '3px',
              boxShadow: bigStars,
              animationDuration: '150s'
            }}
          />
        </div>
        
        {/* Nebula Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-purple-500/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-gradient-radial from-blue-500/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-radial from-mystic-gold/10 to-transparent rounded-full blur-xl" />
        </div>
        
        {/* Cosmic Title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold via-amber to-mystic-gold animate-glow opacity-20">
              Proteus Nebula
            </h1>
            <p className="text-xl md:text-2xl text-star-silver/30 mt-4">
              Battle Card Game
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StarBackground;

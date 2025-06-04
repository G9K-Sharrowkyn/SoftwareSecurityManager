import React, { useEffect, useState } from 'react';
import './StarBackground.css';

function generateBoxShadows(numberOfStars, width, height) {
  let boxShadow = '';
  for (let i = 0; i < numberOfStars; i++) {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * (height * 2));
    boxShadow += `${x}px ${y}px #FFF, `;
  }
  return boxShadow.slice(0, -2);
}

const StarBackground = () => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const smallStars = generateBoxShadows(2100, dimensions.width, dimensions.height);
  const mediumStars = generateBoxShadows(500, dimensions.width, dimensions.height);
  const bigStars = generateBoxShadows(500, dimensions.width, dimensions.height);

  return (
    <div className="stars-background">
      <div id="stars" style={{ boxShadow: smallStars }}></div>
      <div id="stars2" style={{ boxShadow: mediumStars }}></div>
      <div id="stars3" style={{ boxShadow: bigStars }}></div>
      <div id="title">
        <span>
          Proteus Nebule
          <br />
          Battle Card Game
        </span>
      </div>
    </div>
  );
};

export default StarBackground;

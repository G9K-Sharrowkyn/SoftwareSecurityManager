import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import ParticleCanvas from './BoosterAnimation';

import '../../assets/css/BoosterPack.css';

import BoosterPack from '../../assets/cards/BoosterPack.png';

const CardInfo = ({ onDeckCreated }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [boosterPacks, setBoosterPacks] = useState(10);
    const [showBoosterPack, setShowBoosterPack] = useState(false);
    const [revealedCards, setRevealedCards] = useState([]);
    const [particlesVisible, setParticlesVisible] = useState(false);
    const particleCanvasRef = useRef(null);

    const cardsContext = require.context('../../assets/cards', false, /\.png$/);
    const cards = cardsContext.keys()
                    .filter(fileName => fileName !== './BoosterPack.png')
                    .map((fileName) => {
                        const cardName = fileName.replace('./', '').replace('.png', '');
                        return {
                            name: cardName,
                            image: cardsContext(fileName),
                        };
                    });

        useEffect(() => {
        const newDeck = createDeck();
        onDeckCreated(newDeck);
    });

    const createDeck = () => {
        return [...cards];
    };

    const openBooster = () => {
        if (boosterPacks > 0) {
            setShowBoosterPack(true);
            setRevealedCards([]);
        }
    };

    const handleBoosterPackClick = (event) => {
        setBoosterPacks(boosterPacks - 1);
        setIsAnimating(true);

        if (particleCanvasRef.current) {
            particleCanvasRef.current.triggerExplosion(event.clientX, event.clientY);
            setParticlesVisible(true);
            setTimeout(() => {
                setParticlesVisible(false);
            }, 1000);
        }

        let randomCards = [];
        for (let i = 0; i < 5; i++) {
            randomCards.push(cards[Math.floor(Math.random() * cards.length)]);
        }
        
        setTimeout(() => {
            setRevealedCards(randomCards);
            setShowBoosterPack(false);
            setIsAnimating(false);
        }, 1000);
    };

    const addBoosterPack = () => {
        setBoosterPacks(boosterPacks + 1);
    };

    return (
        <div>
            <button className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" onClick={openBooster}>
                Open Booster ({boosterPacks})
            </button>
            <button className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" onClick={addBoosterPack}>
                Add Booster
            </button>

            {showBoosterPack && (
                <div className="booster-pack flex justify-center items-center">
                    <img 
                      src={BoosterPack} 
                      alt="Booster Pack" 
                      className={`w-64 h-auto cursor-pointer ${isAnimating ? 'animate-spinAndShrink' : ''}`} 
                      onClick={handleBoosterPackClick} 
                    />
                    {particlesVisible && <ParticleCanvas ref={particleCanvasRef} />}
                </div>
            )}

            <div className="revealed-cards flex justify-center flex-wrap gap-4 mt-4">
                {revealedCards.map((card, index) => (
                    <div key={index} className="card bg-white shadow-lg rounded overflow-hidden">
                        <img src={card.image} alt={card.name} className="w-48 h-100" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default connect(state => ({
    boosterPacks: state.cards.boosterPacks,
    revealedCards: state.cards.revealedCards
}))(CardInfo);

import React, { useState, useCallback  } from 'react';
// import DosComponent from './Dos.js';
import CardInfo from '../Cards/CardInfo';
import ExplosiveButtonComponent from '../Cards/BoosterAnimation';
import GameInterface from '../Cards/GameInterface';

import '../../assets/css/DosComponent.css';

const DosPage = () => {
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [deck, setDeck] = useState([]);

    const startGame = () => {
        setIsGameStarted(true);
    };

    const handleDeckCreated = useCallback((newDeck) => {
        setDeck(newDeck);
    }, []); 

    if (isGameStarted) {
        return (
            <div className="game-interface">
                <GameInterface deck={deck} setDeck={setDeck} />
            </div>
        );
    }

    return (
        <div className="DosPage">
            <section>
                <div className="button-group">
                    <button onClick={startGame} className="play-game-button text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
                        PLAY
                    </button>
                    <CardInfo onDeckCreated={handleDeckCreated} />
                    <ExplosiveButtonComponent />
                </div>
            </section>
        </div>
    );
};

export default DosPage;
export const openBooster = () => dispatch => {
    dispatch({ type: 'CARDS.OPEN_BOOSTER' });
};

export const addBoosterPack = () => dispatch => {
    dispatch({ type: 'CARDS.ADD_BOOSTER_PACK' });
};

export const revealCards = (cards) => dispatch => {
    dispatch({ type: 'CARDS.REVEAL_CARDS', cards });
};

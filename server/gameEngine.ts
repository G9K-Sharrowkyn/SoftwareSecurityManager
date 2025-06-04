import { cardsSpecifics } from "../client/src/components/game/CardsSpecifics";

export const Phases = {
  COMMAND: "Command Phase",
  DEPLOYMENT: "Deployment Phase", 
  BATTLE: "Battle Phase",
  END_TURN: "End Turn",
};

export interface GameState {
  gameId?: number;
  currentPhase: string;
  currentPlayer: string;
  turnNumber: number;
  playerStates: {
    [playerId: string]: PlayerState;
  };
  battleQueue: BattleAction[];
  isGameOver: boolean;
  winner?: string;
}

export interface PlayerState {
  health: number;
  deck: GameCard[];
  hand: GameCard[];
  commandZone: GameCard[];
  unitZone: GameCard[];
  graveyard: GameCard[];
  commandPoints: number;
  hasDrawnCard: boolean;
  hasPlayedCommandCard: boolean;
}

export interface GameCard {
  id: number;
  name: string;
  type: string[];
  commandCost: number;
  attack: number;
  defense: number;
  unitMembers: number;
  redCounters: number;
  blueCounters: number;
  specialAbility: string;
  imageUrl?: string;
  instanceId: string; // Unique instance ID for this card in the game
}

export interface BattleAction {
  attackerId: string;
  targetId?: string;
  damage: number;
  type: 'unit' | 'direct';
}

class GameEngine {
  async initializeGame(playerDeck: any, aiDifficulty?: string): Promise<GameState> {
    const gameState: GameState = {
      currentPhase: Phases.COMMAND,
      currentPlayer: 'player1',
      turnNumber: 1,
      playerStates: {
        player1: this.initializePlayerState(playerDeck),
        ai: aiDifficulty ? this.initializeAIPlayerState(aiDifficulty) : this.initializePlayerState(playerDeck)
      },
      battleQueue: [],
      isGameOver: false
    };

    // Draw initial hands
    this.drawInitialHand(gameState.playerStates.player1);
    this.drawInitialHand(gameState.playerStates.ai);

    return gameState;
  }

  private initializePlayerState(deck: any): PlayerState {
    const gameCards = this.convertDeckToGameCards(deck.cards);
    
    return {
      health: 100,
      deck: this.shuffleDeck(gameCards),
      hand: [],
      commandZone: [],
      unitZone: [],
      graveyard: [],
      commandPoints: 0,
      hasDrawnCard: false,
      hasPlayedCommandCard: false
    };
  }

  private initializeAIPlayerState(difficulty: string): PlayerState {
    // Generate AI deck based on difficulty
    const aiDeck = this.generateAIDeck(difficulty);
    return this.initializePlayerState({ cards: aiDeck });
  }

  private convertDeckToGameCards(deckCards: {cardId: number, quantity: number}[]): GameCard[] {
    const gameCards: GameCard[] = [];
    
    deckCards.forEach(({ cardId, quantity }) => {
      const cardSpec = cardsSpecifics.find(c => c.name === cardId.toString()) || cardsSpecifics[0];
      
      for (let i = 0; i < quantity; i++) {
        gameCards.push({
          id: cardId,
          name: cardSpec.name,
          type: cardSpec.type,
          commandCost: cardSpec.commandCost,
          attack: cardSpec.attack,
          defense: cardSpec.defense,
          unitMembers: cardSpec.unitMembers,
          redCounters: cardSpec.redCounters,
          blueCounters: cardSpec.blueCounters,
          specialAbility: cardSpec.specialAbility,
          instanceId: `${cardId}_${Date.now()}_${Math.random()}`
        });
      }
    });

    return gameCards;
  }

  private generateAIDeck(difficulty: string): {cardId: number, quantity: number}[] {
    // Generate balanced AI deck based on difficulty
    const deck: {cardId: number, quantity: number}[] = [];
    
    // Add some shipyard cards (command zone)
    deck.push({ cardId: 1, quantity: 4 }); // Shipyards
    deck.push({ cardId: 2, quantity: 3 });
    
    // Add unit cards based on difficulty
    if (difficulty === 'easy') {
      // Weaker units
      deck.push({ cardId: 10, quantity: 6 });
      deck.push({ cardId: 11, quantity: 6 });
    } else if (difficulty === 'medium') {
      // Balanced units
      deck.push({ cardId: 15, quantity: 4 });
      deck.push({ cardId: 16, quantity: 4 });
      deck.push({ cardId: 17, quantity: 4 });
    } else {
      // Strong units
      deck.push({ cardId: 20, quantity: 3 });
      deck.push({ cardId: 21, quantity: 3 });
      deck.push({ cardId: 22, quantity: 3 });
    }

    return deck;
  }

  private shuffleDeck(cards: GameCard[]): GameCard[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private drawInitialHand(playerState: PlayerState): void {
    for (let i = 0; i < 7 && playerState.deck.length > 0; i++) {
      const card = playerState.deck.shift()!;
      playerState.hand.push(card);
    }
  }

  async processPlayerAction(gameState: GameState, action: string, data: any): Promise<GameState> {
    const newGameState = { ...gameState };
    const currentPlayerState = newGameState.playerStates[newGameState.currentPlayer];

    switch (action) {
      case 'drawCard':
        if (newGameState.currentPhase === Phases.COMMAND && !currentPlayerState.hasDrawnCard) {
          this.drawCard(currentPlayerState);
          currentPlayerState.hasDrawnCard = true;
        }
        break;

      case 'playCard':
        this.playCard(newGameState, data.cardInstanceId, data.targetZone);
        break;

      case 'endPhase':
        this.endPhase(newGameState);
        break;

      case 'attack':
        if (newGameState.currentPhase === Phases.BATTLE) {
          this.processAttack(newGameState, data.attackerInstanceId, data.targetInstanceId);
        }
        break;

      default:
        console.log('Unknown action:', action);
    }

    // Check for game over conditions
    this.checkGameOver(newGameState);

    return newGameState;
  }

  async processAIAction(gameState: GameState, aiAction: any): Promise<GameState> {
    // AI actions will be processed here
    return this.processPlayerAction(gameState, aiAction.action, aiAction.data);
  }

  private drawCard(playerState: PlayerState): void {
    if (playerState.deck.length > 0) {
      const card = playerState.deck.shift()!;
      playerState.hand.push(card);
    }
  }

  private playCard(gameState: GameState, cardInstanceId: string, targetZone: string): void {
    const currentPlayerState = gameState.playerStates[gameState.currentPlayer];
    const cardIndex = currentPlayerState.hand.findIndex(c => c.instanceId === cardInstanceId);
    
    if (cardIndex === -1) return;

    const card = currentPlayerState.hand[cardIndex];
    
    // Check if card can be played in current phase and zone
    if (!this.canPlayCardInZone(card, targetZone, gameState.currentPhase)) {
      return;
    }

    // Check cost requirements
    if (gameState.currentPhase === Phases.DEPLOYMENT && card.commandCost > currentPlayerState.commandPoints) {
      return;
    }

    // Remove card from hand
    currentPlayerState.hand.splice(cardIndex, 1);

    // Add to appropriate zone
    if (targetZone === 'command') {
      currentPlayerState.commandZone.push(card);
      if (gameState.currentPhase === Phases.COMMAND) {
        const pointsToAdd = card.type.includes("Shipyard") ? 2 : 1;
        currentPlayerState.commandPoints += pointsToAdd;
        currentPlayerState.hasPlayedCommandCard = true;
      }
    } else if (targetZone === 'unit') {
      currentPlayerState.unitZone.push(card);
      if (gameState.currentPhase === Phases.DEPLOYMENT) {
        currentPlayerState.commandPoints -= card.commandCost;
      }
    }
  }

  private canPlayCardInZone(card: GameCard, zone: string, phase: string): boolean {
    if (phase === Phases.COMMAND) {
      return zone === 'command';
    } else if (phase === Phases.DEPLOYMENT) {
      if (zone === 'unit') {
        return !card.type.includes("Shipyard");
      }
    }
    return false;
  }

  private endPhase(gameState: GameState): void {
    const currentPlayerState = gameState.playerStates[gameState.currentPlayer];

    switch (gameState.currentPhase) {
      case Phases.COMMAND:
        gameState.currentPhase = Phases.DEPLOYMENT;
        break;
      case Phases.DEPLOYMENT:
        gameState.currentPhase = Phases.BATTLE;
        this.initializeBattlePhase(gameState);
        break;
      case Phases.BATTLE:
        gameState.currentPhase = Phases.END_TURN;
        this.processBattlePhase(gameState);
        break;
      case Phases.END_TURN:
        this.startNewTurn(gameState);
        break;
    }
  }

  private initializeBattlePhase(gameState: GameState): void {
    // Prepare battle queue with all possible attacks
    gameState.battleQueue = [];
    
    const currentPlayerState = gameState.playerStates[gameState.currentPlayer];
    const otherPlayer = gameState.currentPlayer === 'player1' ? 'ai' : 'player1';
    const otherPlayerState = gameState.playerStates[otherPlayer];

    // Add attacks from current player's units
    currentPlayerState.unitZone.forEach(unit => {
      if (unit.attack > 0) {
        // Check for valid targets
        if (otherPlayerState.unitZone.length > 0) {
          // Attack enemy units
          otherPlayerState.unitZone.forEach(target => {
            gameState.battleQueue.push({
              attackerId: unit.instanceId,
              targetId: target.instanceId,
              damage: unit.attack,
              type: 'unit'
            });
          });
        } else {
          // Direct attack on player
          gameState.battleQueue.push({
            attackerId: unit.instanceId,
            damage: unit.attack,
            type: 'direct'
          });
        }
      }
    });
  }

  private processBattlePhase(gameState: GameState): void {
    const currentPlayerState = gameState.playerStates[gameState.currentPlayer];
    const otherPlayer = gameState.currentPlayer === 'player1' ? 'ai' : 'player1';
    const otherPlayerState = gameState.playerStates[otherPlayer];

    // Process all battles in queue
    gameState.battleQueue.forEach(battle => {
      if (battle.type === 'unit' && battle.targetId) {
        // Unit vs unit combat
        const target = otherPlayerState.unitZone.find(u => u.instanceId === battle.targetId);
        if (target) {
          target.defense -= battle.damage;
          
          // Remove destroyed units
          if (target.defense <= 0) {
            const targetIndex = otherPlayerState.unitZone.findIndex(u => u.instanceId === battle.targetId);
            if (targetIndex >= 0) {
              const destroyedUnit = otherPlayerState.unitZone.splice(targetIndex, 1)[0];
              otherPlayerState.graveyard.push(destroyedUnit);
            }
          }
        }
      } else if (battle.type === 'direct') {
        // Direct damage to player
        otherPlayerState.health -= battle.damage;
      }
    });

    gameState.battleQueue = [];
  }

  private processAttack(gameState: GameState, attackerInstanceId: string, targetInstanceId?: string): void {
    const currentPlayerState = gameState.playerStates[gameState.currentPlayer];
    const otherPlayer = gameState.currentPlayer === 'player1' ? 'ai' : 'player1';
    const otherPlayerState = gameState.playerStates[otherPlayer];

    const attacker = currentPlayerState.unitZone.find(u => u.instanceId === attackerInstanceId);
    if (!attacker) return;

    if (targetInstanceId) {
      // Attack specific target
      const target = otherPlayerState.unitZone.find(u => u.instanceId === targetInstanceId);
      if (target) {
        target.defense -= attacker.attack;
        attacker.defense -= target.attack; // Counter-attack

        // Remove destroyed units
        if (target.defense <= 0) {
          const targetIndex = otherPlayerState.unitZone.findIndex(u => u.instanceId === targetInstanceId);
          if (targetIndex >= 0) {
            const destroyedUnit = otherPlayerState.unitZone.splice(targetIndex, 1)[0];
            otherPlayerState.graveyard.push(destroyedUnit);
          }
        }

        if (attacker.defense <= 0) {
          const attackerIndex = currentPlayerState.unitZone.findIndex(u => u.instanceId === attackerInstanceId);
          if (attackerIndex >= 0) {
            const destroyedUnit = currentPlayerState.unitZone.splice(attackerIndex, 1)[0];
            currentPlayerState.graveyard.push(destroyedUnit);
          }
        }
      }
    } else {
      // Direct attack on player
      otherPlayerState.health -= attacker.attack;
    }
  }

  private startNewTurn(gameState: GameState): void {
    // Switch to other player
    gameState.currentPlayer = gameState.currentPlayer === 'player1' ? 'ai' : 'player1';
    gameState.currentPhase = Phases.COMMAND;
    gameState.turnNumber++;

    // Reset player state for new turn
    const currentPlayerState = gameState.playerStates[gameState.currentPlayer];
    currentPlayerState.hasDrawnCard = false;
    currentPlayerState.hasPlayedCommandCard = false;
  }

  private checkGameOver(gameState: GameState): void {
    Object.keys(gameState.playerStates).forEach(playerId => {
      if (gameState.playerStates[playerId].health <= 0) {
        gameState.isGameOver = true;
        gameState.winner = playerId === 'player1' ? 'ai' : 'player1';
      }
    });
  }
}

export const gameEngine = new GameEngine();

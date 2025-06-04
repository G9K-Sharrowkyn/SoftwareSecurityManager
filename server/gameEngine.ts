import { Card } from "@shared/schema";

export interface GameState {
  gameId: string;
  currentPlayer: string;
  currentPhase: "Command" | "Deployment" | "Battle" | "End Turn";
  turnNumber: number;
  players: {
    [playerId: string]: PlayerState;
  };
}

export interface PlayerState {
  id: string;
  health: number;
  hand: Card[];
  deck: Card[];
  graveyard: Card[];
  commandZone: Card[];
  unitZone: Card[];
  commandPoints: number;
  hasDrawnCard: boolean;
  hasPlayedCommandCard: boolean;
}

export interface GameMove {
  type: "draw_card" | "play_card" | "end_phase" | "attack" | "activate_ability";
  data: any;
}

class GameEngine {
  initializeGame(player1Id: string, player2Id: string | null): GameState {
    const initialDeck = this.createStarterDeck();
    
    const gameState: GameState = {
      gameId: "",
      currentPlayer: player1Id,
      currentPhase: "Command",
      turnNumber: 1,
      players: {}
    };

    // Initialize player 1
    gameState.players[player1Id] = this.initializePlayer(player1Id, [...initialDeck]);
    
    // Initialize player 2 (AI or human)
    if (player2Id) {
      gameState.players[player2Id] = this.initializePlayer(player2Id, [...initialDeck]);
    } else {
      // AI player
      gameState.players["ai"] = this.initializePlayer("ai", [...initialDeck]);
    }

    // Draw initial hands
    this.drawInitialHand(gameState.players[player1Id]);
    this.drawInitialHand(gameState.players[player2Id || "ai"]);

    return gameState;
  }

  private initializePlayer(playerId: string, deck: Card[]): PlayerState {
    this.shuffleDeck(deck);
    
    return {
      id: playerId,
      health: 100,
      hand: [],
      deck,
      graveyard: [],
      commandZone: [],
      unitZone: [],
      commandPoints: 0,
      hasDrawnCard: false,
      hasPlayedCommandCard: false
    };
  }

  private createStarterDeck(): Card[] {
    // Create a balanced starter deck with mock cards
    const starterCards: Card[] = [];
    
    // Add some basic units and commands
    for (let i = 0; i < 20; i++) {
      starterCards.push({
        id: 1000 + i,
        name: `Starter Unit ${i + 1}`,
        type: "Unit",
        cost: Math.floor(Math.random() * 5) + 1,
        attack: Math.floor(Math.random() * 4) + 1,
        defense: Math.floor(Math.random() * 4) + 1,
        commandCost: Math.floor(Math.random() * 5) + 1,
        unitMembers: 1,
        specialAbility: "Basic unit",
        rarity: "Common",
        imageUrl: "/api/placeholder/unit",
        createdAt: new Date()
      });
    }

    return starterCards;
  }

  private drawInitialHand(player: PlayerState): void {
    for (let i = 0; i < 7; i++) {
      if (player.deck.length > 0) {
        const card = player.deck.pop()!;
        player.hand.push(card);
      }
    }
  }

  private shuffleDeck(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  processMove(gameState: GameState, playerId: string, moveType: string, moveData: any): GameState {
    const newState = JSON.parse(JSON.stringify(gameState)); // Deep clone
    const player = newState.players[playerId];

    if (!player) {
      throw new Error("Player not found");
    }

    if (newState.currentPlayer !== playerId) {
      throw new Error("Not your turn");
    }

    try {
      switch (moveType) {
        case "draw_card":
          this.processDrawCard(newState, player);
          break;
        
        case "play_card":
          this.processPlayCard(newState, player, moveData);
          break;
        
        case "end_phase":
          this.processEndPhase(newState);
          break;
        
        case "attack":
          this.processAttack(newState, player, moveData);
          break;
        
        case "activate_ability":
          this.processActivateAbility(newState, player, moveData);
          break;
        
        default:
          throw new Error("Unknown move type");
      }
    } catch (error) {
      console.error("Error processing move:", error);
      throw error;
    }

    return newState;
  }

  private processDrawCard(gameState: GameState, player: PlayerState): void {
    if (gameState.currentPhase !== "Command" || player.hasDrawnCard) {
      throw new Error("Cannot draw card now");
    }

    if (player.deck.length === 0) {
      throw new Error("No cards left in deck");
    }

    const card = player.deck.pop()!;
    player.hand.push(card);
    player.hasDrawnCard = true;
  }

  private processPlayCard(gameState: GameState, player: PlayerState, moveData: { cardId: number; zone: string }): void {
    const cardIndex = player.hand.findIndex(card => card.id === moveData.cardId);
    if (cardIndex === -1) {
      throw new Error("Card not found in hand");
    }

    const card = player.hand[cardIndex];

    // Validate the move based on current phase and card type
    if (gameState.currentPhase === "Command") {
      if (moveData.zone !== "command" || !card.type.includes("Shipyard")) {
        throw new Error("Can only play Shipyard cards to command zone in Command phase");
      }
      
      if (player.hasPlayedCommandCard) {
        throw new Error("Can only play one command card per turn");
      }

      player.commandZone.push(card);
      player.commandPoints += card.type.includes("Shipyard") ? 2 : 1;
      player.hasPlayedCommandCard = true;
      
    } else if (gameState.currentPhase === "Deployment") {
      if (moveData.zone === "unit" && card.type === "Unit") {
        if (card.commandCost > player.commandPoints) {
          throw new Error("Not enough command points");
        }
        
        player.unitZone.push(card);
        player.commandPoints -= card.commandCost;
        
      } else if (moveData.zone === "command" && card.type === "Command") {
        if (card.commandCost > player.commandPoints) {
          throw new Error("Not enough command points");
        }
        
        // Execute command card effect immediately
        this.executeCommandEffect(gameState, player, card);
        player.graveyard.push(card);
        player.commandPoints -= card.commandCost;
        
      } else {
        throw new Error("Invalid card placement");
      }
    } else {
      throw new Error("Cannot play cards in this phase");
    }

    player.hand.splice(cardIndex, 1);
  }

  private executeCommandEffect(gameState: GameState, player: PlayerState, card: Card): void {
    // Basic command card effects
    switch (card.name) {
      case "Tactical Strike":
        // Deal damage logic would go here
        break;
      case "Shield Matrix":
        // Buff units logic would go here
        break;
      case "Fleet Mobilization":
        // Draw cards logic
        for (let i = 0; i < 2 && player.deck.length > 0; i++) {
          const drawnCard = player.deck.pop()!;
          player.hand.push(drawnCard);
        }
        break;
    }
  }

  private processEndPhase(gameState: GameState): void {
    const currentPlayer = gameState.players[gameState.currentPlayer];

    switch (gameState.currentPhase) {
      case "Command":
        gameState.currentPhase = "Deployment";
        break;
      case "Deployment":
        gameState.currentPhase = "Battle";
        break;
      case "Battle":
        gameState.currentPhase = "End Turn";
        break;
      case "End Turn":
        // Switch to next player and reset phase
        this.switchToNextPlayer(gameState);
        gameState.currentPhase = "Command";
        gameState.turnNumber++;
        
        // Reset turn-based flags
        const nextPlayer = gameState.players[gameState.currentPlayer];
        nextPlayer.hasDrawnCard = false;
        nextPlayer.hasPlayedCommandCard = false;
        
        // Calculate command points for new turn
        nextPlayer.commandPoints = this.calculateCommandPoints(nextPlayer);
        break;
    }
  }

  private switchToNextPlayer(gameState: GameState): void {
    const playerIds = Object.keys(gameState.players);
    const currentIndex = playerIds.indexOf(gameState.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    gameState.currentPlayer = playerIds[nextIndex];
  }

  private calculateCommandPoints(player: PlayerState): number {
    return player.commandZone.reduce((total, card) => {
      return total + (card.type.includes("Shipyard") ? 2 : 1);
    }, 0);
  }

  private processAttack(gameState: GameState, player: PlayerState, moveData: { attackerId: number; targetId?: number }): void {
    if (gameState.currentPhase !== "Battle") {
      throw new Error("Can only attack during Battle phase");
    }

    const attackerCard = player.unitZone.find(card => card.id === moveData.attackerId);
    if (!attackerCard) {
      throw new Error("Attacker card not found");
    }

    if (moveData.targetId) {
      // Attack specific unit
      const opponentId = this.getOpponentId(gameState, player.id);
      const opponent = gameState.players[opponentId];
      const targetCard = opponent.unitZone.find(card => card.id === moveData.targetId);
      
      if (targetCard) {
        this.resolveCombat(attackerCard, targetCard, player, opponent);
      }
    } else {
      // Direct attack on opponent
      const opponentId = this.getOpponentId(gameState, player.id);
      const opponent = gameState.players[opponentId];
      opponent.health -= attackerCard.attack;
      
      if (opponent.health <= 0) {
        this.endGame(gameState, player.id);
      }
    }
  }

  private resolveCombat(attacker: Card, defender: Card, attackingPlayer: PlayerState, defendingPlayer: PlayerState): void {
    // Simple combat resolution
    const attackerSurvives = attacker.defense > defender.attack;
    const defenderSurvives = defender.defense > attacker.attack;

    if (!attackerSurvives) {
      const attackerIndex = attackingPlayer.unitZone.findIndex(card => card.id === attacker.id);
      if (attackerIndex !== -1) {
        const removedCard = attackingPlayer.unitZone.splice(attackerIndex, 1)[0];
        attackingPlayer.graveyard.push(removedCard);
      }
    }

    if (!defenderSurvives) {
      const defenderIndex = defendingPlayer.unitZone.findIndex(card => card.id === defender.id);
      if (defenderIndex !== -1) {
        const removedCard = defendingPlayer.unitZone.splice(defenderIndex, 1)[0];
        defendingPlayer.graveyard.push(removedCard);
      }
    }
  }

  private processActivateAbility(gameState: GameState, player: PlayerState, moveData: { cardId: number; abilityData?: any }): void {
    const card = [...player.unitZone, ...player.commandZone].find(c => c.id === moveData.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Execute card-specific abilities
    this.executeCardAbility(gameState, player, card, moveData.abilityData);
  }

  private executeCardAbility(gameState: GameState, player: PlayerState, card: Card, abilityData: any): void {
    // This would contain specific card ability implementations
    console.log(`Executing ability for ${card.name}`);
  }

  private getOpponentId(gameState: GameState, playerId: string): string {
    const playerIds = Object.keys(gameState.players);
    return playerIds.find(id => id !== playerId) || "";
  }

  private endGame(gameState: GameState, winnerId: string): void {
    gameState.currentPhase = "End Turn";
    // Additional game end logic would go here
  }

  // Validation methods
  canPlayCard(gameState: GameState, playerId: string, cardId: number, zone: string): boolean {
    const player = gameState.players[playerId];
    const card = player.hand.find(c => c.id === cardId);
    
    if (!card) return false;

    if (gameState.currentPhase === "Command") {
      return zone === "command" && card.type.includes("Shipyard") && !player.hasPlayedCommandCard;
    } else if (gameState.currentPhase === "Deployment") {
      if (zone === "unit" && card.type === "Unit") {
        return card.commandCost <= player.commandPoints;
      } else if (zone === "command" && card.type === "Command") {
        return card.commandCost <= player.commandPoints;
      }
    }
    
    return false;
  }

  getValidMoves(gameState: GameState, playerId: string): string[] {
    const moves: string[] = [];
    const player = gameState.players[playerId];

    if (gameState.currentPlayer !== playerId) {
      return moves;
    }

    switch (gameState.currentPhase) {
      case "Command":
        if (!player.hasDrawnCard && player.deck.length > 0) {
          moves.push("draw_card");
        }
        if (!player.hasPlayedCommandCard) {
          moves.push("play_command_card");
        }
        moves.push("end_phase");
        break;
        
      case "Deployment":
        moves.push("play_unit");
        moves.push("play_command");
        moves.push("end_phase");
        break;
        
      case "Battle":
        if (player.unitZone.length > 0) {
          moves.push("attack");
        }
        moves.push("end_phase");
        break;
        
      case "End Turn":
        moves.push("end_phase");
        break;
    }

    return moves;
  }
}

export const gameEngine = new GameEngine();

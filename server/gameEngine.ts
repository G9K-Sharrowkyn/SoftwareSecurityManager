import { IStorage } from "./storage";
import { Game, Card, Deck, DeckCard } from "@shared/schema";

export interface GameState {
  gameId: string;
  status: "waiting" | "active" | "finished";
  currentPhase: "Command Phase" | "Deployment Phase" | "Battle Phase" | "End Turn";
  currentPlayerId: string;
  turnNumber: number;
  players: {
    [playerId: string]: PlayerState;
  };
}

export interface PlayerState {
  id: string;
  username: string;
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
  playerId: string;
  action: "draw_card" | "play_card" | "attack" | "end_phase" | "end_turn";
  data?: any;
}

export interface MoveResult {
  success: boolean;
  error?: string;
  gameEnded?: boolean;
  winnerId?: string;
}

export class GameEngine {
  private storage: IStorage;
  private gameState: GameState | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async initializeGame(game: Game): Promise<void> {
    const player1 = await this.storage.getUser(game.player1Id);
    if (!player1) throw new Error("Player 1 not found");

    let player2 = null;
    if (game.player2Id) {
      player2 = await this.storage.getUser(game.player2Id);
      if (!player2) throw new Error("Player 2 not found");
    }

    // Initialize game state
    this.gameState = {
      gameId: game.id,
      status: game.status,
      currentPhase: "Command Phase",
      currentPlayerId: game.player1Id,
      turnNumber: 1,
      players: {}
    };

    // Initialize player 1
    const player1Deck = await this.getPlayerDeck(game.player1Id);
    this.gameState.players[game.player1Id] = await this.initializePlayerState(player1, player1Deck);

    // Initialize player 2 or AI
    if (game.gameType === "AI") {
      // Create AI player state
      const aiDeck = await this.generateAIDeck();
      this.gameState.players["AI"] = {
        id: "AI",
        username: `AI Commander (${game.aiDifficulty})`,
        health: 100,
        hand: this.drawInitialHand(aiDeck),
        deck: aiDeck.slice(7), // Remove drawn cards
        graveyard: [],
        commandZone: [],
        unitZone: [],
        commandPoints: 0,
        hasDrawnCard: false,
        hasPlayedCommandCard: false
      };
    } else if (player2 && game.player2Id) {
      const player2Deck = await this.getPlayerDeck(game.player2Id);
      this.gameState.players[game.player2Id] = await this.initializePlayerState(player2, player2Deck);
    }

    // Update game status to active
    await this.storage.updateGame(game.id, { status: "active" });
  }

  private async getPlayerDeck(playerId: string): Promise<Card[]> {
    const userDecks = await this.storage.getUserDecks(playerId);
    const activeDeck = userDecks.find(deck => deck.isActive);
    
    if (!activeDeck) {
      throw new Error("No active deck found for player");
    }

    const fullDeck = await this.storage.getDeck(activeDeck.id);
    if (!fullDeck) {
      throw new Error("Deck not found");
    }

    // Convert deck cards to card array with quantities
    const cards: Card[] = [];
    for (const deckCard of fullDeck.deckCards) {
      for (let i = 0; i < deckCard.quantity; i++) {
        cards.push(deckCard.card);
      }
    }

    // Shuffle deck
    return this.shuffleDeck(cards);
  }

  private async generateAIDeck(): Promise<Card[]> {
    const allCards = await this.storage.getAllCards();
    const deck: Card[] = [];

    // AI deck composition: balanced mix of cards
    const shipyards = allCards.filter(c => c.type.includes("Shipyard")).slice(0, 8);
    const units = allCards.filter(c => c.type.includes("Unit") || c.type.includes("Machine") || c.type.includes("Biological")).slice(0, 40);
    const commands = allCards.filter(c => !c.type.includes("Shipyard") && !c.type.includes("Unit") && !c.type.includes("Machine") && !c.type.includes("Biological")).slice(0, 12);

    deck.push(...shipyards);
    deck.push(...units);
    deck.push(...commands);

    return this.shuffleDeck(deck);
  }

  private async initializePlayerState(user: any, deck: Card[]): Promise<PlayerState> {
    return {
      id: user.id,
      username: user.username,
      health: 100,
      hand: this.drawInitialHand(deck),
      deck: deck.slice(7), // Remove drawn cards
      graveyard: [],
      commandZone: [],
      unitZone: [],
      commandPoints: 0,
      hasDrawnCard: false,
      hasPlayedCommandCard: false
    };
  }

  private drawInitialHand(deck: Card[]): Card[] {
    return deck.slice(0, 7);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async processMove(move: GameMove): Promise<MoveResult> {
    if (!this.gameState) {
      return { success: false, error: "Game not initialized" };
    }

    const player = this.gameState.players[move.playerId];
    if (!player) {
      return { success: false, error: "Player not found" };
    }

    if (this.gameState.currentPlayerId !== move.playerId) {
      return { success: false, error: "Not your turn" };
    }

    try {
      switch (move.action) {
        case "draw_card":
          return await this.handleDrawCard(move.playerId);
        case "play_card":
          return await this.handlePlayCard(move.playerId, move.data);
        case "attack":
          return await this.handleAttack(move.playerId, move.data);
        case "end_phase":
          return await this.handleEndPhase();
        case "end_turn":
          return await this.handleEndTurn();
        default:
          return { success: false, error: "Unknown action" };
      }
    } catch (error) {
      console.error("Error processing move:", error);
      return { success: false, error: "Failed to process move" };
    }
  }

  private async handleDrawCard(playerId: string): Promise<MoveResult> {
    const player = this.gameState!.players[playerId];
    
    if (this.gameState!.currentPhase !== "Command Phase") {
      return { success: false, error: "Can only draw cards during Command Phase" };
    }

    if (player.hasDrawnCard) {
      return { success: false, error: "Already drawn a card this turn" };
    }

    if (player.deck.length === 0) {
      return { success: false, error: "No cards left in deck" };
    }

    // Draw card
    const drawnCard = player.deck.shift()!;
    player.hand.push(drawnCard);
    player.hasDrawnCard = true;

    await this.storage.addGameMove({
      gameId: this.gameState!.gameId,
      playerId,
      moveType: "draw_card",
      moveData: { cardId: drawnCard.id },
      turnNumber: this.gameState!.turnNumber
    });

    return { success: true };
  }

  private async handlePlayCard(playerId: string, data: any): Promise<MoveResult> {
    const player = this.gameState!.players[playerId];
    const { cardIndex, zone } = data;

    if (cardIndex >= player.hand.length) {
      return { success: false, error: "Invalid card index" };
    }

    const card = player.hand[cardIndex];

    // Validate card placement based on current phase
    if (this.gameState!.currentPhase === "Command Phase") {
      if (zone !== "command") {
        return { success: false, error: "Can only play to command zone during Command Phase" };
      }

      if (player.hasPlayedCommandCard) {
        return { success: false, error: "Already played a command card this turn" };
      }

      // Add to command zone
      player.commandZone.push(card);
      player.hand.splice(cardIndex, 1);
      player.hasPlayedCommandCard = true;

      // Add command points
      const points = card.type.includes("Shipyard") ? 2 : 1;
      player.commandPoints += points;

    } else if (this.gameState!.currentPhase === "Deployment Phase") {
      if (zone === "unit") {
        if (card.commandCost > player.commandPoints) {
          return { success: false, error: "Not enough command points" };
        }

        // Deploy to unit zone
        player.unitZone.push(card);
        player.hand.splice(cardIndex, 1);
        player.commandPoints -= card.commandCost;
      } else {
        return { success: false, error: "Can only deploy units during Deployment Phase" };
      }
    } else {
      return { success: false, error: "Cannot play cards during this phase" };
    }

    await this.storage.addGameMove({
      gameId: this.gameState!.gameId,
      playerId,
      moveType: "play_card",
      moveData: { cardId: card.id, zone },
      turnNumber: this.gameState!.turnNumber
    });

    return { success: true };
  }

  private async handleAttack(playerId: string, data: any): Promise<MoveResult> {
    if (this.gameState!.currentPhase !== "Battle Phase") {
      return { success: false, error: "Can only attack during Battle Phase" };
    }

    const attacker = this.gameState!.players[playerId];
    const { attackerIndex, targetPlayerId, targetIndex } = data;

    if (attackerIndex >= attacker.unitZone.length) {
      return { success: false, error: "Invalid attacker" };
    }

    const attackingUnit = attacker.unitZone[attackerIndex];
    const defender = this.gameState!.players[targetPlayerId];

    if (!defender) {
      return { success: false, error: "Invalid target player" };
    }

    let damage = attackingUnit.attack;
    let targetDestroyed = false;

    if (targetIndex !== undefined && targetIndex >= 0) {
      // Attack unit
      if (targetIndex >= defender.unitZone.length) {
        return { success: false, error: "Invalid target unit" };
      }

      const targetUnit = defender.unitZone[targetIndex];
      
      // Combat resolution
      if (damage >= targetUnit.defense) {
        // Target destroyed
        defender.graveyard.push(targetUnit);
        defender.unitZone.splice(targetIndex, 1);
        targetDestroyed = true;
      }

      // Counter-attack if target survives
      if (!targetDestroyed && targetUnit.attack >= attackingUnit.defense) {
        attacker.graveyard.push(attackingUnit);
        attacker.unitZone.splice(attackerIndex, 1);
      }
    } else {
      // Direct attack on player
      defender.health -= damage;
    }

    await this.storage.addGameMove({
      gameId: this.gameState!.gameId,
      playerId,
      moveType: "attack",
      moveData: { attackerIndex, targetPlayerId, targetIndex, damage },
      turnNumber: this.gameState!.turnNumber
    });

    // Check for game end
    if (defender.health <= 0) {
      return { 
        success: true, 
        gameEnded: true, 
        winnerId: playerId 
      };
    }

    return { success: true };
  }

  private async handleEndPhase(): Promise<MoveResult> {
    switch (this.gameState!.currentPhase) {
      case "Command Phase":
        this.gameState!.currentPhase = "Deployment Phase";
        break;
      case "Deployment Phase":
        this.gameState!.currentPhase = "Battle Phase";
        break;
      case "Battle Phase":
        this.gameState!.currentPhase = "End Turn";
        break;
      case "End Turn":
        return await this.handleEndTurn();
    }

    return { success: true };
  }

  private async handleEndTurn(): Promise<MoveResult> {
    const currentPlayer = this.gameState!.players[this.gameState!.currentPlayerId];
    
    // Reset player state for next turn
    currentPlayer.hasDrawnCard = false;
    currentPlayer.hasPlayedCommandCard = false;

    // Switch to next player
    const playerIds = Object.keys(this.gameState!.players);
    const currentIndex = playerIds.indexOf(this.gameState!.currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.gameState!.currentPlayerId = playerIds[nextIndex];

    // If back to first player, increment turn
    if (nextIndex === 0) {
      this.gameState!.turnNumber++;
    }

    // Reset to Command Phase
    this.gameState!.currentPhase = "Command Phase";

    return { success: true };
  }

  async getGameState(): Promise<GameState> {
    if (!this.gameState) {
      throw new Error("Game not initialized");
    }
    return { ...this.gameState };
  }

  async saveGameState(): Promise<void> {
    if (!this.gameState) return;

    await this.storage.updateGame(this.gameState.gameId, {
      gameState: this.gameState,
      currentPhase: this.gameState.currentPhase,
      currentTurn: this.gameState.turnNumber
    });
  }
}

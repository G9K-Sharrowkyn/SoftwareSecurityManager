import { cardsSpecifics } from './CardsSpecifics';

export const Phases = {
  COMMAND: "Command Phase",
  DEPLOYMENT: "Deployment Phase",
  BATTLE: "Battle Phase",
  END_TURN: "End Turn",
};

export class GameMechanics {
  private currentPhase: string;
  private isPlayerTurn: boolean;

  constructor() {
    this.currentPhase = Phases.COMMAND;
    this.isPlayerTurn = true;
  }

  startNewRound() {
    this.currentPhase = Phases.COMMAND;
    this.isPlayerTurn = !this.isPlayerTurn;
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  endCurrentPhase() {
    switch (this.currentPhase) {
      case Phases.COMMAND:
        this.currentPhase = Phases.DEPLOYMENT;
        break;
      case Phases.DEPLOYMENT:
        this.currentPhase = Phases.BATTLE;
        break;
      case Phases.BATTLE:
        this.currentPhase = Phases.END_TURN;
        break;
      case Phases.END_TURN:
        this.startNewRound();
        break;
      default:
        throw new Error("Unknown game phase");
    }
  }

  canPlayCardInZone(cardName: string, zone: string) {
    const card = cardsSpecifics.find(c => c.name === cardName);

    if (!card) {
      console.error("Card not found:", cardName);
      return false;
    }

    if (card.type.includes("Shipyard")) {
      return zone === "player-command-zone";
    } else {
      return zone === "player-unit-zone" || zone === "player-command-zone";
    }
  }

  isPlayersTurn() {
    return this.isPlayerTurn;
  }

  calculateDamage(attacker: any, defender: any) {
    // Basic damage calculation
    const damage = Math.max(0, attacker.attack - defender.defense);
    return damage;
  }

  checkWinCondition(playerHealth: number, opponentHealth: number) {
    if (playerHealth <= 0) {
      return { gameEnded: true, winner: 'opponent' };
    }
    if (opponentHealth <= 0) {
      return { gameEnded: true, winner: 'player' };
    }
    return { gameEnded: false, winner: null };
  }
}

export default GameMechanics;

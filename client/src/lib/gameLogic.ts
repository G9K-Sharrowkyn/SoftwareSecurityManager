import { Card } from "@shared/schema";

export interface GamePhase {
  name: "Command Phase" | "Deployment Phase" | "Battle Phase" | "End Turn";
  description: string;
  allowedActions: string[];
}

export const GAME_PHASES: GamePhase[] = [
  {
    name: "Command Phase",
    description: "Draw cards and play command cards to generate command points",
    allowedActions: ["draw_card", "play_command_card", "end_phase"]
  },
  {
    name: "Deployment Phase", 
    description: "Deploy units using command points",
    allowedActions: ["play_unit_card", "end_phase"]
  },
  {
    name: "Battle Phase",
    description: "Attack with your units",
    allowedActions: ["attack", "end_phase"]
  },
  {
    name: "End Turn",
    description: "End your turn and pass to opponent",
    allowedActions: ["end_turn"]
  }
];

export interface GameAction {
  type: "draw_card" | "play_card" | "attack" | "end_phase" | "end_turn";
  data?: any;
}

export class ClientGameLogic {
  static canPlayCard(card: Card, zone: "command" | "unit", phase: string, commandPoints: number): boolean {
    if (phase === "Command Phase") {
      return zone === "command";
    }
    
    if (phase === "Deployment Phase") {
      return zone === "unit" && card.commandCost <= commandPoints;
    }
    
    return false;
  }

  static calculateCommandPoints(commandCards: Card[]): number {
    return commandCards.reduce((total, card) => {
      return total + (card.type.includes("Shipyard") ? 2 : 1);
    }, 0);
  }

  static canAttack(phase: string): boolean {
    return phase === "Battle Phase";
  }

  static canDrawCard(phase: string, hasDrawnCard: boolean): boolean {
    return phase === "Command Phase" && !hasDrawnCard;
  }

  static canEndPhase(phase: string): boolean {
    return phase !== "End Turn";
  }

  static getNextPhase(currentPhase: string): string {
    const phases = ["Command Phase", "Deployment Phase", "Battle Phase", "End Turn"];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[(currentIndex + 1) % phases.length];
  }

  static validateCardPlay(card: Card, zone: "command" | "unit", gameState: any): { valid: boolean; error?: string } {
    if (!this.canPlayCard(card, zone, gameState.phase, gameState.commandPoints)) {
      return { valid: false, error: "Cannot play this card in the current phase or zone" };
    }

    if (zone === "unit" && card.commandCost > gameState.commandPoints) {
      return { valid: false, error: "Not enough command points" };
    }

    if (zone === "command" && gameState.phase === "Command Phase" && gameState.hasPlayedCommandCard) {
      return { valid: false, error: "Already played a command card this turn" };
    }

    return { valid: true };
  }

  static calculateDamage(attacker: Card, defender?: Card): { attackerSurvives: boolean; defenderSurvives: boolean; damageToPlayer: number } {
    if (!defender) {
      // Direct attack on player
      return {
        attackerSurvives: true,
        defenderSurvives: false,
        damageToPlayer: attacker.attack
      };
    }

    // Unit vs unit combat
    const attackerSurvives = defender.attack < attacker.defense;
    const defenderSurvives = attacker.attack < defender.defense;

    return {
      attackerSurvives,
      defenderSurvives,
      damageToPlayer: 0
    };
  }

  static isShipyard(card: Card): boolean {
    return card.type.includes("Shipyard");
  }

  static isUnit(card: Card): boolean {
    return card.type.includes("Unit") || 
           card.type.includes("Machine") || 
           card.type.includes("Biological");
  }

  static getCardRarityColor(rarity: string): string {
    switch (rarity.toLowerCase()) {
      case "common": return "text-gray-400";
      case "uncommon": return "text-green-400";
      case "rare": return "text-blue-400";
      case "legendary": return "text-purple-400";
      default: return "text-gray-400";
    }
  }

  static getCardTypeIcon(card: Card): string {
    if (this.isShipyard(card)) return "fas fa-industry";
    if (card.type.includes("Machine")) return "fas fa-robot";
    if (card.type.includes("Biological")) return "fas fa-dna";
    return "fas fa-rocket";
  }
}

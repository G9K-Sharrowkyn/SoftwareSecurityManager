export const Phases = {
  COMMAND: "Command Phase",
  DEPLOYMENT: "Deployment Phase", 
  BATTLE: "Battle Phase",
  END_TURN: "End Turn",
} as const;

export type Phase = typeof Phases[keyof typeof Phases];

export class GameMechanics {
  private currentPhase: Phase = Phases.COMMAND;
  private isPlayerTurn = true;

  getCurrentPhase(): Phase {
    return this.currentPhase;
  }

  getNextPhase(currentPhase: Phase): Phase {
    switch (currentPhase) {
      case Phases.COMMAND:
        return Phases.DEPLOYMENT;
      case Phases.DEPLOYMENT:
        return Phases.BATTLE;
      case Phases.BATTLE:
        return Phases.END_TURN;
      case Phases.END_TURN:
        return Phases.COMMAND;
      default:
        return Phases.COMMAND;
    }
  }

  endCurrentPhase(): Phase {
    this.currentPhase = this.getNextPhase(this.currentPhase);
    
    if (this.currentPhase === Phases.COMMAND) {
      this.isPlayerTurn = !this.isPlayerTurn;
    }
    
    return this.currentPhase;
  }

  canPlayCardInZone(card: any, zone: string, currentPhase: Phase): boolean {
    // Command phase: only command and shipyard cards can be played in command zone
    if (currentPhase === Phases.COMMAND) {
      return zone === "command" && (
        card.type?.includes("Shipyard") || 
        card.type?.includes("Command")
      );
    }
    
    // Deployment phase: unit cards can be played in unit zone
    if (currentPhase === Phases.DEPLOYMENT) {
      return zone === "unit" && card.type?.includes("Unit");
    }
    
    // Battle phase: no card playing allowed
    if (currentPhase === Phases.BATTLE) {
      return false;
    }
    
    return false;
  }

  calculateCommandPoints(commandCards: any[]): number {
    return commandCards.reduce((total, card) => {
      return total + (card.type?.includes("Shipyard") ? 2 : 1);
    }, 0);
  }

  canAffordCard(card: any, availableCommandPoints: number): boolean {
    return (card.commandCost || 0) <= availableCommandPoints;
  }

  resolveBattle(playerUnits: any[], opponentUnits: any[]) {
    // Simple battle resolution logic
    const playerPower = playerUnits.reduce((sum, unit) => sum + (unit.attack || 0), 0);
    const opponentPower = opponentUnits.reduce((sum, unit) => sum + (unit.attack || 0), 0);
    
    return {
      playerDamage: Math.max(0, opponentPower - playerUnits.reduce((sum, unit) => sum + (unit.defense || 0), 0)),
      opponentDamage: Math.max(0, playerPower - opponentUnits.reduce((sum, unit) => sum + (unit.defense || 0), 0)),
      playerWins: playerPower > opponentPower
    };
  }

  isGameOver(playerHealth: number, opponentHealth: number): { gameOver: boolean; winner?: string } {
    if (playerHealth <= 0) {
      return { gameOver: true, winner: "opponent" };
    }
    if (opponentHealth <= 0) {
      return { gameOver: true, winner: "player" };
    }
    return { gameOver: false };
  }
}

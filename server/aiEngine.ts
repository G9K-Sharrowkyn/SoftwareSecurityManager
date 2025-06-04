import { GameState, GameAction, Card } from './gameEngine';

export type AIDifficulty = 'Easy' | 'Medium' | 'Hard';

export class AIEngine {
  private difficulty: AIDifficulty;

  constructor(difficulty: AIDifficulty = 'Medium') {
    this.difficulty = difficulty;
  }

  getNextAction(gameState: GameState): GameAction {
    switch (gameState.currentPhase) {
      case 'Command':
        return this.getCommandPhaseAction(gameState);
      case 'Deployment':
        return this.getDeploymentPhaseAction(gameState);
      case 'Battle':
        return this.getBattlePhaseAction(gameState);
      case 'End Turn':
        return { type: 'end_phase' };
      default:
        return { type: 'end_phase' };
    }
  }

  private getCommandPhaseAction(gameState: GameState): GameAction {
    const aiHand = gameState.player2Hand;
    const commandCards = aiHand.filter(card => this.canPlayInCommand(card));

    // Difficulty-based decision making
    if (this.difficulty === 'Easy') {
      // Easy AI: Random command card or end phase
      if (commandCards.length > 0 && Math.random() > 0.5) {
        const randomCard = commandCards[Math.floor(Math.random() * commandCards.length)];
        return {
          type: 'play_card',
          cardId: randomCard.id,
          zoneType: 'command'
        };
      }
    } else if (this.difficulty === 'Medium') {
      // Medium AI: Prioritize shipyards, then other command cards
      const shipyards = commandCards.filter(card => card.type === 'Shipyard');
      if (shipyards.length > 0) {
        return {
          type: 'play_card',
          cardId: shipyards[0].id,
          zoneType: 'command'
        };
      } else if (commandCards.length > 0) {
        return {
          type: 'play_card',
          cardId: commandCards[0].id,
          zoneType: 'command'
        };
      }
    } else if (this.difficulty === 'Hard') {
      // Hard AI: Strategic command card selection
      const bestCommand = this.selectBestCommandCard(commandCards, gameState);
      if (bestCommand) {
        return {
          type: 'play_card',
          cardId: bestCommand.id,
          zoneType: 'command'
        };
      }
    }

    return { type: 'end_phase' };
  }

  private getDeploymentPhaseAction(gameState: GameState): GameAction {
    const aiHand = gameState.player2Hand;
    const unitCards = aiHand.filter(card => this.canPlayInDeployment(card, gameState.player2CommandPoints));

    if (this.difficulty === 'Easy') {
      // Easy AI: Deploy random affordable unit
      if (unitCards.length > 0 && Math.random() > 0.3) {
        const randomCard = unitCards[Math.floor(Math.random() * unitCards.length)];
        return {
          type: 'play_card',
          cardId: randomCard.id,
          zoneType: 'unit'
        };
      }
    } else if (this.difficulty === 'Medium') {
      // Medium AI: Deploy strongest affordable unit
      const bestUnit = unitCards.sort((a, b) => (b.attack + b.defense) - (a.attack + a.defense))[0];
      if (bestUnit) {
        return {
          type: 'play_card',
          cardId: bestUnit.id,
          zoneType: 'unit'
        };
      }
    } else if (this.difficulty === 'Hard') {
      // Hard AI: Strategic unit deployment
      const bestUnit = this.selectBestUnitCard(unitCards, gameState);
      if (bestUnit) {
        return {
          type: 'play_card',
          cardId: bestUnit.id,
          zoneType: 'unit'
        };
      }
    }

    return { type: 'end_phase' };
  }

  private getBattlePhaseAction(gameState: GameState): GameAction {
    const aiUnits = gameState.player2Field.units;
    const playerUnits = gameState.player1Field.units;

    if (aiUnits.length === 0) {
      return { type: 'end_phase' };
    }

    if (this.difficulty === 'Easy') {
      // Easy AI: Random attacks
      if (Math.random() > 0.5 && aiUnits.length > 0) {
        const attacker = aiUnits[Math.floor(Math.random() * aiUnits.length)];
        const target = playerUnits.length > 0 ? 
          playerUnits[Math.floor(Math.random() * playerUnits.length)] : 
          null;
        
        return {
          type: 'attack',
          cardId: attacker.id,
          targetId: target?.id
        };
      }
    } else if (this.difficulty === 'Medium') {
      // Medium AI: Attack strongest enemy units first
      if (aiUnits.length > 0 && playerUnits.length > 0) {
        const strongestPlayer = playerUnits.sort((a, b) => (b.attack + b.defense) - (a.attack + a.defense))[0];
        const bestAttacker = aiUnits.sort((a, b) => b.attack - a.attack)[0];
        
        return {
          type: 'attack',
          cardId: bestAttacker.id,
          targetId: strongestPlayer.id
        };
      }
    } else if (this.difficulty === 'Hard') {
      // Hard AI: Strategic combat decisions
      const bestAttack = this.calculateBestAttack(aiUnits, playerUnits, gameState);
      if (bestAttack) {
        return bestAttack;
      }
    }

    return { type: 'end_phase' };
  }

  private canPlayInCommand(card: Card): boolean {
    return card.type === 'Shipyard' || card.type === 'Command';
  }

  private canPlayInDeployment(card: Card, commandPoints: number): boolean {
    return card.type === 'Unit' && card.commandCost <= commandPoints;
  }

  private selectBestCommandCard(cards: Card[], gameState: GameState): Card | null {
    if (cards.length === 0) return null;

    // Prioritize shipyards for more command points
    const shipyards = cards.filter(card => card.type === 'Shipyard');
    if (shipyards.length > 0) {
      return shipyards[0];
    }

    // Otherwise, select based on strategic value
    return cards.sort((a, b) => this.evaluateCommandValue(b, gameState) - this.evaluateCommandValue(a, gameState))[0];
  }

  private selectBestUnitCard(cards: Card[], gameState: GameState): Card | null {
    if (cards.length === 0) return null;

    return cards.sort((a, b) => this.evaluateUnitValue(b, gameState) - this.evaluateUnitValue(a, gameState))[0];
  }

  private evaluateCommandValue(card: Card, gameState: GameState): number {
    let value = 0;
    
    if (card.type === 'Shipyard') {
      value += 10; // High value for resource generation
    }
    
    // Add value based on special abilities
    if (card.specialAbility) {
      value += 5;
    }
    
    return value;
  }

  private evaluateUnitValue(card: Card, gameState: GameState): number {
    let value = card.attack + card.defense;
    
    // Efficiency: value per command cost
    if (card.commandCost > 0) {
      value = value / card.commandCost;
    }
    
    // Bonus for special traits
    if (card.traits.includes('Flying')) value += 2;
    if (card.traits.includes('Reach')) value += 2;
    if (card.traits.includes('Blocker')) value += 1;
    
    return value;
  }

  private calculateBestAttack(aiUnits: Card[], playerUnits: Card[], gameState: GameState): GameAction | null {
    let bestAttack: GameAction | null = null;
    let bestValue = -1;

    for (const attacker of aiUnits) {
      // Consider direct attack on player
      const directAttackValue = this.evaluateDirectAttack(attacker, gameState);
      if (directAttackValue > bestValue) {
        bestValue = directAttackValue;
        bestAttack = {
          type: 'attack',
          cardId: attacker.id
        };
      }

      // Consider attacks on player units
      for (const target of playerUnits) {
        const attackValue = this.evaluateUnitAttack(attacker, target, gameState);
        if (attackValue > bestValue) {
          bestValue = attackValue;
          bestAttack = {
            type: 'attack',
            cardId: attacker.id,
            targetId: target.id
          };
        }
      }
    }

    return bestAttack;
  }

  private evaluateDirectAttack(attacker: Card, gameState: GameState): number {
    // Value of attacking player directly
    let value = attacker.attack;
    
    // Higher value if player has low health
    if (gameState.player1Health < 30) {
      value *= 2;
    }
    
    return value;
  }

  private evaluateUnitAttack(attacker: Card, target: Card, gameState: GameState): number {
    let value = 0;
    
    // Can we destroy the target without dying?
    if (attacker.attack >= target.defense && target.attack < attacker.defense) {
      value = target.attack + target.defense + 5; // Bonus for favorable trade
    } else if (attacker.attack >= target.defense) {
      value = target.attack + target.defense; // Mutual destruction value
    } else {
      value = -5; // Penalty for unfavorable attack
    }
    
    return value;
  }
}

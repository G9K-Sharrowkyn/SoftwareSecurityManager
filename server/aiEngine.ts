import { GameState, PlayerState, GameCard } from "./gameEngine";

export interface AIAction {
  action: string;
  data: any;
  priority: number;
}

class AIEngine {
  async getAIAction(gameState: GameState, difficulty = 'medium'): Promise<AIAction> {
    const aiPlayerState = gameState.playerStates.ai;
    const humanPlayerState = gameState.playerStates.player1;

    // Determine AI strategy based on difficulty
    const strategy = this.getAIStrategy(difficulty);
    
    // Get possible actions for current phase
    const possibleActions = this.getPossibleActions(gameState, aiPlayerState);
    
    // Evaluate and prioritize actions
    const evaluatedActions = possibleActions.map(action => ({
      ...action,
      priority: this.evaluateAction(action, gameState, strategy)
    }));

    // Sort by priority and pick the best action
    evaluatedActions.sort((a, b) => b.priority - a.priority);
    
    return evaluatedActions[0] || { action: 'endPhase', data: {}, priority: 0 };
  }

  private getAIStrategy(difficulty: string) {
    const strategies = {
      easy: {
        aggression: 0.3,
        planning: 0.2,
        cardEfficiency: 0.3,
        riskTolerance: 0.8
      },
      medium: {
        aggression: 0.6,
        planning: 0.5,
        cardEfficiency: 0.6,
        riskTolerance: 0.5
      },
      hard: {
        aggression: 0.8,
        planning: 0.9,
        cardEfficiency: 0.9,
        riskTolerance: 0.2
      }
    };

    return strategies[difficulty as keyof typeof strategies] || strategies.medium;
  }

  private getPossibleActions(gameState: GameState, aiPlayerState: PlayerState): AIAction[] {
    const actions: AIAction[] = [];

    switch (gameState.currentPhase) {
      case 'Command Phase':
        // Draw card if not done
        if (!aiPlayerState.hasDrawnCard && aiPlayerState.deck.length > 0) {
          actions.push({
            action: 'drawCard',
            data: {},
            priority: 0
          });
        }

        // Play command cards
        if (!aiPlayerState.hasPlayedCommandCard) {
          const commandCards = aiPlayerState.hand.filter(card => 
            card.type.includes("Shipyard") || this.canPlayInCommandPhase(card)
          );
          
          commandCards.forEach(card => {
            actions.push({
              action: 'playCard',
              data: { cardInstanceId: card.instanceId, targetZone: 'command' },
              priority: 0
            });
          });
        }

        // End phase
        actions.push({
          action: 'endPhase',
          data: {},
          priority: 0
        });
        break;

      case 'Deployment Phase':
        // Play unit cards
        const playableUnits = aiPlayerState.hand.filter(card => 
          !card.type.includes("Shipyard") && card.commandCost <= aiPlayerState.commandPoints
        );
        
        playableUnits.forEach(card => {
          actions.push({
            action: 'playCard',
            data: { cardInstanceId: card.instanceId, targetZone: 'unit' },
            priority: 0
          });
        });

        // End phase
        actions.push({
          action: 'endPhase',
          data: {},
          priority: 0
        });
        break;

      case 'Battle Phase':
        // Attack with units
        aiPlayerState.unitZone.forEach(unit => {
          if (unit.attack > 0) {
            const humanUnits = gameState.playerStates.player1.unitZone;
            
            if (humanUnits.length > 0) {
              // Attack enemy units
              humanUnits.forEach(target => {
                actions.push({
                  action: 'attack',
                  data: { 
                    attackerInstanceId: unit.instanceId, 
                    targetInstanceId: target.instanceId 
                  },
                  priority: 0
                });
              });
            } else {
              // Direct attack
              actions.push({
                action: 'attack',
                data: { attackerInstanceId: unit.instanceId },
                priority: 0
              });
            }
          }
        });

        // End phase
        actions.push({
          action: 'endPhase',
          data: {},
          priority: 0
        });
        break;

      case 'End Turn':
        actions.push({
          action: 'endPhase',
          data: {},
          priority: 0
        });
        break;
    }

    return actions;
  }

  private canPlayInCommandPhase(card: GameCard): boolean {
    // Define which non-shipyard cards can be played in command phase
    return card.type.includes("Command") || card.type.includes("Infrastructure");
  }

  private evaluateAction(action: AIAction, gameState: GameState, strategy: any): number {
    const aiPlayerState = gameState.playerStates.ai;
    const humanPlayerState = gameState.playerStates.player1;
    let priority = 0;

    switch (action.action) {
      case 'drawCard':
        // Always good to draw cards
        priority = 70;
        break;

      case 'playCard':
        const card = this.findCardByInstanceId(aiPlayerState.hand, action.data.cardInstanceId);
        if (card) {
          priority = this.evaluateCardPlay(card, gameState, strategy);
        }
        break;

      case 'attack':
        priority = this.evaluateAttack(action, gameState, strategy);
        break;

      case 'endPhase':
        // Default action, usually lower priority unless nothing else to do
        priority = 10;
        break;
    }

    return priority;
  }

  private evaluateCardPlay(card: GameCard, gameState: GameState, strategy: any): number {
    let priority = 30;

    // Shipyard cards are valuable for command points
    if (card.type.includes("Shipyard")) {
      priority += 50 * strategy.planning;
    }

    // Unit cards for combat
    if (!card.type.includes("Shipyard")) {
      priority += (card.attack + card.defense) * 5 * strategy.aggression;
      
      // Higher priority if we need units for defense
      const humanUnitCount = gameState.playerStates.player1.unitZone.length;
      const aiUnitCount = gameState.playerStates.ai.unitZone.length;
      
      if (humanUnitCount > aiUnitCount) {
        priority += 20;
      }
    }

    // Cost efficiency
    if (card.commandCost > 0) {
      const efficiency = (card.attack + card.defense) / card.commandCost;
      priority += efficiency * 10 * strategy.cardEfficiency;
    }

    return priority;
  }

  private evaluateAttack(action: AIAction, gameState: GameState, strategy: any): number {
    const attacker = this.findCardByInstanceId(
      gameState.playerStates.ai.unitZone, 
      action.data.attackerInstanceId
    );
    
    if (!attacker) return 0;

    let priority = 40;

    if (action.data.targetInstanceId) {
      // Unit vs unit combat
      const target = this.findCardByInstanceId(
        gameState.playerStates.player1.unitZone,
        action.data.targetInstanceId
      );
      
      if (target) {
        // Prioritize attacks where we can destroy the target without dying
        if (attacker.attack >= target.defense && target.attack < attacker.defense) {
          priority += 60;
        }
        
        // Prioritize removing threats
        if (target.attack > attacker.defense) {
          priority += 30;
        }
        
        // Consider value trade
        const valueGained = target.attack + target.defense;
        const valueLost = Math.max(0, target.attack - attacker.defense);
        priority += (valueGained - valueLost) * 2;
      }
    } else {
      // Direct attack
      const humanHealth = gameState.playerStates.player1.health;
      
      // Prioritize direct attacks when human is low on health
      if (humanHealth <= attacker.attack) {
        priority += 100; // Game winning move
      } else if (humanHealth < 30) {
        priority += 50 * strategy.aggression;
      } else {
        priority += 20 * strategy.aggression;
      }
      
      // Less priority if human has strong units that can counter-attack
      const humanThreatLevel = gameState.playerStates.player1.unitZone
        .reduce((total, unit) => total + unit.attack, 0);
      
      if (humanThreatLevel > attacker.defense) {
        priority -= 20 * (1 - strategy.riskTolerance);
      }
    }

    return priority;
  }

  private findCardByInstanceId(cards: GameCard[], instanceId: string): GameCard | undefined {
    return cards.find(card => card.instanceId === instanceId);
  }

  // AI deck building for different difficulties
  generateAIDeck(difficulty: string): {cardId: number, quantity: number}[] {
    const deck: {cardId: number, quantity: number}[] = [];
    
    // Base deck structure
    const deckTemplates = {
      easy: {
        shipyards: [
          { cardId: 1, quantity: 2 },
          { cardId: 2, quantity: 2 }
        ],
        units: [
          { cardId: 10, quantity: 6 },
          { cardId: 11, quantity: 4 },
          { cardId: 12, quantity: 3 }
        ]
      },
      medium: {
        shipyards: [
          { cardId: 1, quantity: 3 },
          { cardId: 2, quantity: 2 },
          { cardId: 3, quantity: 2 }
        ],
        units: [
          { cardId: 15, quantity: 4 },
          { cardId: 16, quantity: 4 },
          { cardId: 17, quantity: 3 },
          { cardId: 18, quantity: 3 }
        ]
      },
      hard: {
        shipyards: [
          { cardId: 1, quantity: 3 },
          { cardId: 2, quantity: 3 },
          { cardId: 3, quantity: 2 },
          { cardId: 4, quantity: 2 }
        ],
        units: [
          { cardId: 20, quantity: 3 },
          { cardId: 21, quantity: 3 },
          { cardId: 22, quantity: 2 },
          { cardId: 23, quantity: 2 },
          { cardId: 24, quantity: 2 }
        ]
      }
    };

    const template = deckTemplates[difficulty as keyof typeof deckTemplates] || deckTemplates.medium;
    
    // Add shipyards
    template.shipyards.forEach(card => deck.push(card));
    
    // Add units
    template.units.forEach(card => deck.push(card));
    
    return deck;
  }
}

export const aiEngine = new AIEngine();

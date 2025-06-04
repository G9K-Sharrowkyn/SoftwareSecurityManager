export interface CardDetails {
  name: string;
  redCounters: number;
  blueCounters: number;
  attack: number;
  defense: number;
  commandCost: number;
  unitMembers: number;
  type: string[];
  specialAbility: string;
  rarity?: string;
}

export const cardSpecifics: CardDetails[] = [
  // Shipyards
  {
    name: 'Yazzilan_Industry_Zone',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generates 2 command points per turn",
    rarity: "uncommon"
  },
  {
    name: 'Terran_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generates 2 command points per turn",
    rarity: "common"
  },
  {
    name: 'Syalis_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generates 2 command points per turn",
    rarity: "rare"
  },
  
  // Units
  {
    name: 'Aberran_Firenaute',
    redCounters: 0,
    blueCounters: 2,
    attack: 2,
    defense: 2,
    commandCost: 2,
    unitMembers: 2,
    type: ["BloodThirsty", "Biological", "Unit"],
    specialAbility: "Merciless Strike: Deal +1 damage when attacking wounded enemies",
    rarity: "common"
  },
  {
    name: 'Aelgallan_Flamers',
    redCounters: 0,
    blueCounters: 3,
    attack: 3,
    defense: 2,
    commandCost: 6,
    unitMembers: 3,
    type: ['Mech Quad', 'Machine', 'Unit'],
    specialAbility: "Kill With Fire: Deal damage to all enemy units",
    rarity: "rare"
  },
  {
    name: 'Aneankae_Lady_of_War',
    redCounters: 0,
    blueCounters: 0,
    attack: 6,
    defense: 4,
    commandCost: 8,
    unitMembers: 1,
    type: ["Dread", "Tactician", "Biological", "Unit"],
    specialAbility: "Glorious Death: When destroyed, deal damage equal to attack to enemy",
    rarity: "legendary"
  },
  {
    name: 'Anokemi_the_Giant',
    redCounters: 0,
    blueCounters: 0,
    attack: 7,
    defense: 3,
    commandCost: 7,
    unitMembers: 1,
    type: ["Dread", "Reach", "Machine", "Unit"],
    specialAbility: "The Big Gun: Can attack enemy command zone directly",
    rarity: "epic"
  },
  {
    name: 'Black_Watch_BattleMech',
    redCounters: 0,
    blueCounters: 3,
    attack: 4,
    defense: 4,
    commandCost: 7,
    unitMembers: 3,
    type: ["Machine", "Unit"],
    specialAbility: "No Negotiations: Cannot be affected by enemy abilities",
    rarity: "rare"
  },
  
  // Command Cards
  {
    name: 'Plasma_Strike',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 2,
    unitMembers: 0,
    type: ["Command", "Instant"],
    specialAbility: "Deal 3 damage to target unit or enemy",
    rarity: "common"
  },
  {
    name: 'Shield_Generator',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 1,
    unitMembers: 0,
    type: ["Command"],
    specialAbility: "Give all friendly units +0/+2 defense this turn",
    rarity: "common"
  },
  {
    name: 'Tactical_Retreat',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 1,
    unitMembers: 0,
    type: ["Command", "Instant"],
    specialAbility: "Return target unit to owner's hand",
    rarity: "uncommon"
  }
];

export function getCardDetails(cardName: string): CardDetails | undefined {
  return cardSpecifics.find(card => card.name === cardName);
}

export function applyCardTraits(card: CardDetails): CardDetails {
  // Apply any universal traits or modifications
  const modifiedCard = { ...card };
  
  // Example: BloodThirsty units get +1 attack when enemy is wounded
  if (card.type.includes("BloodThirsty")) {
    // This would be handled during battle resolution
  }
  
  // Example: Reach units can attack from anywhere
  if (card.type.includes("Reach")) {
    // This affects targeting rules
  }
  
  return modifiedCard;
}

export function validateDeck(cards: CardDetails[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check deck size
  if (cards.length < 40) {
    errors.push("Deck must contain at least 40 cards");
  }
  if (cards.length > 60) {
    errors.push("Deck cannot contain more than 60 cards");
  }
  
  // Check card limits (max 3 of any card except basic lands/shipyards)
  const cardCounts = new Map<string, number>();
  cards.forEach(card => {
    const count = cardCounts.get(card.name) || 0;
    cardCounts.set(card.name, count + 1);
  });
  
  cardCounts.forEach((count, cardName) => {
    const card = cardSpecifics.find(c => c.name === cardName);
    if (card && !card.type.includes("Basic") && count > 3) {
      errors.push(`Cannot have more than 3 copies of ${cardName}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default cardSpecifics;

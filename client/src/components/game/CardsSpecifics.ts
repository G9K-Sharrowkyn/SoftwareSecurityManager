export interface CardSpecification {
  name: string;
  redCounters: number;
  blueCounters: number;
  attack: number;
  defense: number;
  commandCost: number;
  unitMembers: number;
  type: string[];
  specialAbility: string;
}

export const cardsSpecifics: CardSpecification[] = [
  {
    name: 'Yazzilan_Industry_Zone',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Yazzilan_Dockyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
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
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Terran_Dockyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
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
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Sallen_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Sallen_Industry_Zone',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Rallak_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Orynthian_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Nova_Industry_Zone',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Lakuvall_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Ganimaraci_Star_Forge',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Ekken_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Celloid_Industry_Zone',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Black_Watch_Shipyard',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn when in command zone."
  },
  {
    name: 'Aberran_Firenaute',
    redCounters: 0,
    blueCounters: 2,
    attack: 2,
    defense: 2,
    commandCost: 2,
    unitMembers: 2,
    type: ["BloodThirsty", "Biological"],
    specialAbility: "Merciless Strike: Deal 1 additional damage to wounded units."
  },
  {
    name: 'Aelgallan_Flamers',
    redCounters: 0,
    blueCounters: 3,
    attack: 3,
    defense: 2,
    commandCost: 6,
    unitMembers: 3,
    type: ['Mech Quad', 'Machine'],
    specialAbility: "Kill With Fire: Deal damage to all enemy units when deployed."
  },
  {
    name: 'Ahorhee_Laron_the_explorer',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 2,
    commandCost: 2,
    unitMembers: 1,
    type: ["Harmless", "Machine"],
    specialAbility: "Wastelander: Draw a card when deployed."
  },
  {
    name: 'Aneankae_Lady_of_War',
    redCounters: 0,
    blueCounters: 0,
    attack: 6,
    defense: 4,
    commandCost: 8,
    unitMembers: 1,
    type: ["Dread", "Tactician", "Biological"],
    specialAbility: "Glorious Death: When destroyed, deal damage equal to attack to target."
  },
  {
    name: 'Anokemi_the_Giant',
    redCounters: 0,
    blueCounters: 0,
    attack: 7,
    defense: 3,
    commandCost: 7,
    unitMembers: 1,
    type: ["Dread", "Reach", "Machine"],
    specialAbility: "The Big Gun: Can attack units directly, ignoring other units."
  },
  {
    name: 'Aoruth_Walker',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 5,
    commandCost: 3,
    unitMembers: 1,
    type: ["Blocker", "Machine"],
    specialAbility: "Despair Defense: Must be attacked before other units."
  },
  {
    name: 'Arhvan_the_Prophet',
    redCounters: 0,
    blueCounters: 0,
    attack: 3,
    defense: 3,
    commandCost: 4,
    unitMembers: 1,
    type: ["Flying", "Biological"],
    specialAbility: "Wisdom of Centuries: Gain 1 command point when deployed."
  },
  {
    name: 'Arn_Wettid_Clones',
    redCounters: 0,
    blueCounters: 3,
    attack: 2,
    defense: 1,
    commandCost: 3,
    unitMembers: 3,
    type: ["Clones", "Biological"],
    specialAbility: "Fast Growth: Create a copy when another clone is deployed."
  },
  {
    name: 'Arquariaq_the_Hired_Gun',
    redCounters: 0,
    blueCounters: 0,
    attack: 4,
    defense: 2,
    commandCost: 4,
    unitMembers: 1,
    type: ["Killer", "Biological"],
    specialAbility: "Better With Each Kill: Gain +1/+1 when destroying a unit."
  },
  {
    name: 'Artakan_Fire_Squad',
    redCounters: 0,
    blueCounters: 3,
    attack: 2,
    defense: 1,
    commandCost: 2,
    unitMembers: 3,
    type: ["Biological"],
    specialAbility: "Cold Blooded: Immune to fire-based special abilities."
  }
];

export function applyCardTraits(card: CardSpecification, trait: string): CardSpecification {
  const modifiedCard = { ...card };
  
  switch (trait) {
    case 'enhanced':
      modifiedCard.attack += 1;
      modifiedCard.defense += 1;
      break;
    case 'weakened':
      modifiedCard.attack = Math.max(0, modifiedCard.attack - 1);
      modifiedCard.defense = Math.max(1, modifiedCard.defense - 1);
      break;
    case 'energized':
      modifiedCard.commandCost = Math.max(0, modifiedCard.commandCost - 1);
      break;
  }
  
  return modifiedCard;
}

export default cardsSpecifics;

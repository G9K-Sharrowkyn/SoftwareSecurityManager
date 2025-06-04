const cardsSpecifics = [
  {
    name: 'Stellar Destroyer',
    redCounters: 0,
    blueCounters: 0,
    attack: 6,
    defense: 8,
    commandCost: 8,
    unitMembers: 1,
    type: ["Unit", "Spacecraft"],
    specialAbility: "Orbital Strike: Deal 2 damage to any target when deployed"
  },
  {
    name: 'Fighter Wing',
    redCounters: 0,
    blueCounters: 3,
    attack: 4,
    defense: 2,
    commandCost: 3,
    unitMembers: 3,
    type: ["Unit", "Squadron"],
    specialAbility: "Swarm: +1 attack for each other Fighter Wing in play"
  },
  {
    name: 'Star Forge',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 4,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate +2 command points per turn"
  },
  {
    name: 'Plasma Strike',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 2,
    unitMembers: 0,
    type: ["Command", "Instant"],
    specialAbility: "Deal 6 damage to target unit"
  },
  {
    name: 'Cyber Elite',
    redCounters: 0,
    blueCounters: 0,
    attack: 3,
    defense: 4,
    commandCost: 4,
    unitMembers: 1,
    type: ["Unit", "Cyborg"],
    specialAbility: "Shield: First damage each turn is prevented"
  }
];

export const applyCardTraits = (card: any) => {
  // Apply any card-specific traits or abilities
  return card;
};

export default cardsSpecifics;

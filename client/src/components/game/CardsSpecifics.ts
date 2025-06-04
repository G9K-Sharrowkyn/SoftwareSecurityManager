export interface CardSpecific {
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

export const cardsSpecifics: CardSpecific[] = [
  {
    name: 'Yazzilan_Industry_Zone',
    redCounters: 0,
    blueCounters: 0,
    attack: 0,
    defense: 0,
    commandCost: 0,
    unitMembers: 0,
    type: ["Shipyard"],
    specialAbility: "Generate 2 command points per turn."
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
    specialAbility: "Allows construction of advanced units."
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
    specialAbility: "Standard shipyard facility."
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
    specialAbility: "Repair and maintenance facility."
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
    specialAbility: "Advanced alien technology."
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
    specialAbility: "Specialized unit production."
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
    specialAbility: "Industrial manufacturing complex."
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
    specialAbility: "Rapid construction facility."
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
    specialAbility: "High-tech production center."
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
    specialAbility: "Energy-efficient production."
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
    specialAbility: "Multi-purpose construction."
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
    specialAbility: "Legendary construction facility."
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
    specialAbility: "Compact but efficient."
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
    specialAbility: "Biological construction methods."
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
    specialAbility: "Military-grade construction."
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
    specialAbility: "Merciless Strike: Deal extra damage to wounded targets."
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
    specialAbility: "Kill With Fire: Area damage to multiple targets."
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
    specialAbility: "Wastelander: Can traverse any terrain."
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
    specialAbility: "Glorious Death: When destroyed, deal damage to all enemies."
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
    specialAbility: "The Big Gun: Can attack from long range."
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
    specialAbility: "Despair Defense: Blocks incoming attacks for other units."
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
    specialAbility: "Wisdom of Centuries: Draw extra cards when played."
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
    specialAbility: "Fast Growth: Multiply when conditions are met."
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
    specialAbility: "Better With Each Kill: Gains attack for each enemy destroyed."
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
    specialAbility: "Cold Blooded: Immune to fear and panic effects."
  },
  {
    name: 'Artakan_SAGR_Unit',
    redCounters: 0,
    blueCounters: 3,
    attack: 3,
    defense: 3,
    commandCost: 5,
    unitMembers: 3,
    type: ["Biological"],
    specialAbility: "SAGR Training: Advanced combat tactics."
  },
  {
    name: "Aucul'Ruzi_the_Historian",
    redCounters: 0,
    blueCounters: 0,
    attack: 4,
    defense: 4,
    commandCost: 7,
    unitMembers: 1,
    type: ["Psionic", "Biological"],
    specialAbility: "All Knowing: Can predict opponent moves."
  },
  {
    name: 'Black_Watch_BattleMech',
    redCounters: 0,
    blueCounters: 3,
    attack: 4,
    defense: 4,
    commandCost: 7,
    unitMembers: 3,
    type: ["Machine"],
    specialAbility: "No Negotiations: Cannot be targeted by diplomacy."
  },
  {
    name: 'Black_Watch_Duelist',
    redCounters: 0,
    blueCounters: 0,
    attack: 2,
    defense: 2,
    commandCost: 2,
    unitMembers: 1,
    type: ["Bleed", "Biological"],
    specialAbility: "Plasma Blade: Causes ongoing damage."
  },
  {
    name: 'Black_Watch_Infernal_Tank',
    redCounters: 0,
    blueCounters: 0,
    attack: 4,
    defense: 4,
    commandCost: 6,
    unitMembers: 1,
    type: ["Machine"],
    specialAbility: "Peace At All Cost: Heavy armor and weaponry."
  },
  {
    name: 'Black_Watch_Killer-Droid',
    redCounters: 0,
    blueCounters: 3,
    attack: 2,
    defense: 2,
    commandCost: 2,
    unitMembers: 3,
    type: ["Machine"],
    specialAbility: "Expendable Force: Can be sacrificed for strategic advantage."
  },
  {
    name: 'Black_Watch_Legionist',
    redCounters: 0,
    blueCounters: 0,
    attack: 2,
    defense: 2,
    commandCost: 0,
    unitMembers: 0,
    type: ["Tactician", "Biological"],
    specialAbility: "Fight As Legion: Bonuses when multiple units are present."
  },
  {
    name: 'Black_Watch_Officer',
    redCounters: 0,
    blueCounters: 0,
    attack: 2,
    defense: 2,
    commandCost: 3,
    unitMembers: 1,
    type: ["Man Of Law", "Biological"],
    specialAbility: "Justice Served: Bonus against criminal units."
  },
  {
    name: 'Black_Watch_Overseer',
    redCounters: 0,
    blueCounters: 0,
    attack: 1,
    defense: 1,
    commandCost: 1,
    unitMembers: 1,
    type: ["Man Of Law", "Biological"],
    specialAbility: "All Quiet: Prevents enemy special abilities."
  },
  {
    name: 'Black_Watch_Priests',
    redCounters: 0,
    blueCounters: 3,
    attack: 1,
    defense: 1,
    commandCost: 4,
    unitMembers: 3,
    type: ["Biological"],
    specialAbility: "Last Communion: Healing and support abilities."
  }
];

export const applyCardTraits = (card: CardSpecific, gameState: any) => {
  // Apply special abilities and traits based on card type
  const appliedEffects: any[] = [];

  if (card.type.includes("Flying")) {
    appliedEffects.push({ type: "flying", description: "Can bypass ground defenses" });
  }

  if (card.type.includes("Reach")) {
    appliedEffects.push({ type: "reach", description: "Can attack distant targets" });
  }

  if (card.type.includes("BloodThirsty")) {
    appliedEffects.push({ type: "bloodthirsty", description: "Gains power from combat" });
  }

  if (card.type.includes("Dread")) {
    appliedEffects.push({ type: "dread", description: "Intimidates enemy units" });
  }

  if (card.type.includes("Psionic")) {
    appliedEffects.push({ type: "psionic", description: "Mental powers and telepathy" });
  }

  if (card.type.includes("Shipyard")) {
    appliedEffects.push({ type: "shipyard", description: "Generates command points" });
  }

  return appliedEffects;
};

export default cardsSpecifics;

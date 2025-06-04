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
    // Shipyard Cards
    {
        name: 'Yazzilan_Industry_Zone',
        redCounters: 0,
        blueCounters: 0,
        attack: 0,
        defense: 0,
        commandCost: 0,
        unitMembers: 0,
        type: ["Shipyard"],
        specialAbility: "Generates 2 command points per turn"
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
        specialAbility: "Produces Terran units at reduced cost"
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
        specialAbility: "Specialized military unit production"
    },

    // Unit Cards
    {
        name: 'Aberran_Firenaute',
        redCounters: 0,
        blueCounters: 2,
        attack: 2,
        defense: 2,
        commandCost: 2,
        unitMembers: 2,
        type: ["BloodThirsty","Biological"],
        specialAbility: "Merciless Strike"
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
        specialAbility: "Kill With Fire"
    },
    {
        name: 'Aneankae_Lady_of_War',
        redCounters: 0,
        blueCounters: 0,
        attack: 6,
        defense: 4,
        commandCost: 8,
        unitMembers: 1,
        type: ["Dread","Tactician","Biological"],
        specialAbility: "Glorious Death"
    },
    {
        name: 'Anokemi_the_Giant',
        redCounters: 0,
        blueCounters: 0,
        attack: 7,
        defense: 3,
        commandCost: 7,
        unitMembers: 1,
        type: ["Dread","Reach","Machine"],
        specialAbility: "The Big Gun"
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
        specialAbility: "No Negotiations"
    },
    {
        name: 'Black_Watch_Duelist',
        redCounters: 0,
        blueCounters: 0,
        attack: 2,
        defense: 2,
        commandCost: 2,
        unitMembers: 1,
        type: ["Bleed","Biological"],
        specialAbility: "Plasma Blade"
    },
    {
        name: 'Arn_Wettid_Clones',
        redCounters: 0,
        blueCounters: 3,
        attack: 2,
        defense: 1,
        commandCost: 3,
        unitMembers: 3,
        type: ["Clones","Biological"],
        specialAbility: "Fast Growth"
    }
];

export function applyCardTraits(card: CardSpecific): CardSpecific {
    // Apply any universal card trait modifications
    let modifiedCard = { ...card };

    // Example trait applications
    if (card.type.includes("Dread")) {
        // Dread units might have intimidation effects
        modifiedCard.specialAbility += " (Intimidates enemy units)";
    }

    if (card.type.includes("Machine")) {
        // Machine units might be immune to certain effects
        modifiedCard.specialAbility += " (Immune to biological effects)";
    }

    if (card.type.includes("Flying")) {
        // Flying units can bypass ground defenses
        modifiedCard.specialAbility += " (Can bypass ground units)";
    }

    return modifiedCard;
}

export default cardsSpecifics;

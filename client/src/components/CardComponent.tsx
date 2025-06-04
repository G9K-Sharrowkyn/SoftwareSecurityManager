import { Card, CardContent } from "@/components/ui/card";

interface CardComponentProps {
  card: {
    id?: number;
    name: string;
    type: string;
    cost: number;
    attack?: number;
    defense?: number;
    rarity?: string;
    specialAbility?: string;
  };
  compact?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}

export default function CardComponent({ 
  card, 
  compact = false, 
  showDetails = true, 
  onClick 
}: CardComponentProps) {
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case "Common":
        return "border-gray-400";
      case "Uncommon":
        return "border-green-400";
      case "Rare":
        return "border-blue-400";
      case "Legendary":
        return "border-purple-400";
      default:
        return "border-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Unit":
        return "text-blue-400";
      case "Command":
        return "text-green-400";
      case "Shipyard":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Unit":
        return "fas fa-rocket";
      case "Command":
        return "fas fa-bolt";
      case "Shipyard":
        return "fas fa-industry";
      default:
        return "fas fa-star";
    }
  };

  if (compact) {
    return (
      <Card 
        className={`bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${getRarityColor(card.rarity)} hover:border-yellow-400 transition-all cursor-pointer ${compact ? 'w-24 h-36' : 'w-32 h-48'}`}
        onClick={onClick}
      >
        <CardContent className="p-2 h-full flex flex-col">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {card.cost}
            </div>
            <i className={`${getTypeIcon(card.type)} ${getTypeColor(card.type)} text-sm`}></i>
          </div>

          {/* Card Art */}
          <div className="flex-1 bg-gray-700 rounded mb-2 flex items-center justify-center">
            <i className={`${getTypeIcon(card.type)} text-gray-500 text-2xl`}></i>
          </div>

          {/* Card Name */}
          <div className="text-yellow-400 font-semibold text-xs text-center mb-1 leading-tight">
            {card.name}
          </div>

          {/* Stats */}
          {(card.attack !== undefined || card.defense !== undefined) && (
            <div className="flex justify-between text-xs">
              {card.attack !== undefined && (
                <span className="text-red-400 font-bold">{card.attack}</span>
              )}
              {card.defense !== undefined && (
                <span className="text-blue-400 font-bold">{card.defense}</span>
              )}
            </div>
          )}

          {/* Type indicator for non-units */}
          {card.type !== "Unit" && (
            <div className={`text-center text-xs ${getTypeColor(card.type)} font-semibold`}>
              {card.type}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${getRarityColor(card.rarity)} hover:border-yellow-400 transition-all cursor-pointer w-64 h-96`}
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {card.cost}
          </div>
          <div className={`${getTypeColor(card.type)} font-semibold text-sm`}>
            <i className={`${getTypeIcon(card.type)} mr-1`}></i>
            {card.type}
          </div>
        </div>

        {/* Card Name */}
        <h3 className="text-yellow-400 font-bold text-lg mb-3 text-center">
          {card.name}
        </h3>

        {/* Card Art */}
        <div className="flex-1 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          <i className={`${getTypeIcon(card.type)} text-gray-500 text-6xl`}></i>
        </div>

        {/* Special Ability */}
        {showDetails && card.specialAbility && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Special Ability:</div>
            <div className="text-sm text-gray-300 italic bg-gray-800/50 p-2 rounded">
              "{card.specialAbility}"
            </div>
          </div>
        )}

        {/* Stats */}
        {(card.attack !== undefined || card.defense !== undefined) && (
          <div className="flex justify-around bg-gray-800/50 rounded-lg p-2">
            {card.attack !== undefined && (
              <div className="text-center">
                <div className="text-xs text-gray-400">Attack</div>
                <div className="text-red-400 font-bold text-xl">{card.attack}</div>
              </div>
            )}
            {card.defense !== undefined && (
              <div className="text-center">
                <div className="text-xs text-gray-400">Defense</div>
                <div className="text-blue-400 font-bold text-xl">{card.defense}</div>
              </div>
            )}
          </div>
        )}

        {/* Rarity */}
        {showDetails && card.rarity && (
          <div className="text-center mt-2">
            <span className={`text-xs px-2 py-1 rounded ${getRarityColor(card.rarity)} border`}>
              {card.rarity}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

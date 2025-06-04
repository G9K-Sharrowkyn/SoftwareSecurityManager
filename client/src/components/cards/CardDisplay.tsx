import { Card } from "@shared/schema";
import { ClientGameLogic } from "@/lib/gameLogic";
import { cn } from "@/lib/utils";

interface CardDisplayProps {
  card: Card;
  className?: string;
  size?: "small" | "medium" | "large";
  selected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
  disabled?: boolean;
}

export function CardDisplay({
  card,
  className,
  size = "medium",
  selected = false,
  onClick,
  showStats = true,
  disabled = false
}: CardDisplayProps) {
  const sizeClasses = {
    small: "w-16 h-24",
    medium: "w-24 h-36",
    large: "w-32 h-48"
  };

  const rarityColor = ClientGameLogic.getCardRarityColor(card.rarity);
  const typeIcon = ClientGameLogic.getCardTypeIcon(card);
  const isShipyard = ClientGameLogic.isShipyard(card);
  const isUnit = ClientGameLogic.isUnit(card);

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 transition-all duration-300 cursor-pointer group overflow-hidden",
        sizeClasses[size],
        selected ? "border-cosmic-gold shadow-lg shadow-cosmic-gold/50" : "border-cosmic-silver/30",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-cosmic-gold hover:scale-105",
        "bg-gradient-to-br from-cosmic-800 to-cosmic-900",
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Card Image */}
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-cosmic-700">
          <i className={`${typeIcon} text-cosmic-gold text-2xl`}></i>
        </div>
      )}

      {/* Card Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-cosmic-900/80 via-transparent to-cosmic-900/40 rounded-lg" />

      {/* Card Info */}
      <div className="absolute inset-0 p-2 flex flex-col justify-between text-white">
        {/* Top Section - Cost */}
        <div className="flex justify-between items-start">
          {card.commandCost > 0 && (
            <div className="bg-cosmic-gold text-cosmic-900 text-xs px-1.5 py-0.5 rounded font-bold">
              {card.commandCost}
            </div>
          )}
          <div className="flex items-center space-x-1">
            <i className={`${typeIcon} text-cosmic-gold text-xs`}></i>
          </div>
        </div>

        {/* Middle Section - Name */}
        <div className="text-center">
          <div className="text-xs font-semibold text-cosmic-gold truncate">
            {card.name}
          </div>
          <div className={`text-xs ${rarityColor}`}>
            {card.rarity}
          </div>
        </div>

        {/* Bottom Section - Stats */}
        {showStats && (
          <div className="flex justify-between items-end text-xs">
            {isUnit && (
              <>
                {card.attack > 0 && (
                  <div className="bg-red-600 text-white px-1 py-0.5 rounded">
                    {card.attack}
                  </div>
                )}
                {card.defense > 0 && (
                  <div className="bg-blue-600 text-white px-1 py-0.5 rounded">
                    {card.defense}
                  </div>
                )}
              </>
            )}
            {isShipyard && (
              <div className="bg-cosmic-gold text-cosmic-900 px-1 py-0.5 rounded text-xs font-bold">
                +{card.type.includes("Shipyard") ? "2" : "1"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Glow Effect */}
      {selected && (
        <div className="absolute inset-0 rounded-lg border-2 border-cosmic-gold animate-pulse pointer-events-none" />
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-cosmic-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
    </div>
  );
}

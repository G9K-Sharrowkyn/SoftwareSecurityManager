import { cn } from "@/lib/utils";

interface CardComponentProps {
  card: any;
  size?: "small" | "medium" | "large";
  onClick?: (e?: React.MouseEvent) => void;
  selected?: boolean;
  className?: string;
}

export default function CardComponent({ 
  card, 
  size = "medium", 
  onClick, 
  selected = false,
  className 
}: CardComponentProps) {
  const sizeClasses = {
    small: "w-20 h-28",
    medium: "w-24 h-36",
    large: "w-32 h-48"
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <div 
      className={cn(
        "relative cursor-pointer transition-all duration-300 transform hover:scale-110 hover:-translate-y-2",
        sizeClasses[size],
        selected && "ring-2 ring-primary scale-105",
        onClick && "hover:shadow-2xl",
        className
      )}
      onClick={handleClick}
    >
      <div className="relative w-full h-full bg-gradient-to-br from-card to-background rounded-lg border-2 border-primary/50 shadow-lg overflow-hidden">
        
        {/* Card Image */}
        <div className="w-full h-2/3 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          {card.imageUrl ? (
            <img 
              src={card.imageUrl} 
              alt={card.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-primary/50 text-center">
              <i className="fas fa-image text-2xl mb-1 block"></i>
              <div className="text-xs">{card.name}</div>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="absolute top-1 left-1 right-1 bg-background/90 rounded text-xs text-center p-1">
          <div className="text-primary font-semibold truncate">{card.name}</div>
        </div>

        {/* Card Stats */}
        <div className="absolute bottom-1 left-1 right-1 bg-background/90 rounded text-xs">
          {card.type?.includes("Shipyard") ? (
            <div className="flex justify-center items-center text-accent px-1">
              <span>Shipyard</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-foreground px-1">
              <span className="text-red-400">{card.attack || 0}</span>
              <span className="text-accent">{card.commandCost || 0}</span>
              <span className="text-blue-400">{card.defense || 0}</span>
            </div>
          )}
        </div>

        {/* Rarity indicator */}
        {card.rarity && (
          <div className={cn(
            "absolute top-1 right-1 w-2 h-2 rounded-full",
            card.rarity === "legendary" && "bg-purple-500",
            card.rarity === "rare" && "bg-blue-500", 
            card.rarity === "uncommon" && "bg-green-500",
            card.rarity === "common" && "bg-gray-500"
          )} />
        )}

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface GameCardProps {
  name: string;
  type: string[];
  attack?: number;
  defense?: number;
  commandCost: number;
  specialAbility?: string;
  imageUrl?: string;
  rarity?: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

const rarityColors = {
  Common: 'border-gray-400',
  Uncommon: 'border-green-400',
  Rare: 'border-blue-400',
  Legendary: 'border-purple-400 animate-pulse-gold'
};

const rarityBadgeColors = {
  Common: 'bg-gray-600 text-gray-200',
  Uncommon: 'bg-green-600 text-green-200',
  Rare: 'bg-blue-600 text-blue-200',
  Legendary: 'bg-purple-600 text-purple-200'
};

export const GameCard: React.FC<GameCardProps> = ({
  name,
  type,
  attack,
  defense,
  commandCost,
  specialAbility,
  imageUrl,
  rarity = 'Common',
  className,
  onClick,
  selected = false,
  disabled = false
}) => {
  const displayName = name.replace(/_/g, ' ');
  const typeString = type.join(', ');
  
  return (
    <Card 
      className={cn(
        'w-24 h-36 cursor-pointer transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-cosmic-blue to-midnight',
        rarityColors[rarity as keyof typeof rarityColors] || rarityColors.Common,
        selected && 'ring-2 ring-mystic-gold transform scale-105',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-mystic-gold/30',
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <CardContent className="p-0 h-full relative">
        {/* Card Image */}
        <div className="relative h-2/3 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-space-black via-cosmic-blue to-midnight flex items-center justify-center">
              <div className="text-mystic-gold text-xs text-center opacity-70">
                {displayName}
              </div>
            </div>
          )}
          
          {/* Cost overlay */}
          <div className="absolute top-1 left-1 bg-space-black/90 text-mystic-gold text-xs px-1 rounded font-bold">
            {commandCost}
          </div>
          
          {/* Rarity badge */}
          <div className={cn(
            'absolute top-1 right-1 text-xs px-1 rounded font-semibold',
            rarityBadgeColors[rarity as keyof typeof rarityBadgeColors] || rarityBadgeColors.Common
          )}>
            {rarity[0]}
          </div>
        </div>
        
        {/* Card Info */}
        <div className="h-1/3 p-1 flex flex-col justify-between text-xs">
          <div className="text-mystic-gold font-semibold truncate text-center">
            {displayName}
          </div>
          
          <div className="text-star-silver/70 text-center truncate">
            {typeString}
          </div>
          
          {/* Stats */}
          {(attack !== undefined || defense !== undefined) && (
            <div className="flex justify-between items-center mt-1">
              {attack !== undefined && (
                <div className="flex items-center">
                  <span className="text-red-400 font-bold text-xs">{attack}</span>
                </div>
              )}
              {defense !== undefined && (
                <div className="flex items-center">
                  <span className="text-blue-400 font-bold text-xs">{defense}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Special ability indicator */}
          {specialAbility && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-mystic-gold/20 to-transparent h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;

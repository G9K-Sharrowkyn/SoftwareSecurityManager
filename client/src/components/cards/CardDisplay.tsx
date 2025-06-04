import { Card as CardType } from "@shared/schema";

interface Props {
  card: CardType;
}

export default function CardDisplay({ card }: Props) {
  return (
    <div className="w-24 h-36 bg-cosmic-800 border border-cosmic-600 rounded-lg flex flex-col text-center p-1 text-xs select-none">
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="flex-1 object-cover rounded" />
      ) : (
        <div className="flex-1 flex items-center justify-center">{card.name}</div>
      )}
      <div className="mt-1 text-cosmic-gold font-semibold truncate">{card.name}</div>
    </div>
  );
}

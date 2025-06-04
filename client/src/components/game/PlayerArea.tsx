import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CardComponent from "./CardComponent";
import { User, Heart, Layers } from "lucide-react";

interface PlayerAreaProps {
  player: any;
  selectedCard: any;
  onCardSelect: (card: any) => void;
  onCardPlay: (zone: string) => void;
}

export default function PlayerArea({ player, selectedCard, onCardSelect, onCardPlay }: PlayerAreaProps) {
  if (!player) return null;

  return (
    <div className="space-y-4">
      {/* Player Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Command Zone */}
        <Card 
          className="bg-gradient-to-br from-primary/20 to-amber-500/20 border-primary/50 cursor-pointer hover:border-primary transition-all duration-300 game-zone"
          onClick={() => selectedCard && onCardPlay('command')}
        >
          <CardHeader>
            <CardTitle className="text-primary text-center">Command Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center min-h-32">
              {player.commandZone?.map((card: any, index: number) => (
                <CardComponent
                  key={index}
                  card={card}
                  isSelected={false}
                  onClick={() => {}}
                  size="small"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unit Zone */}
        <Card 
          className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/50 cursor-pointer hover:border-blue-400 transition-all duration-300 game-zone"
          onClick={() => selectedCard && onCardPlay('unit')}
        >
          <CardHeader>
            <CardTitle className="text-blue-400 text-center">Unit Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center min-h-32">
              {player.unitZone?.map((card: any, index: number) => (
                <CardComponent
                  key={index}
                  card={card}
                  isSelected={false}
                  onClick={() => {}}
                  size="small"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Info */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 border-emerald-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-emerald-200">You</div>
                <div className="text-sm text-emerald-300/70">Commander</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <Badge variant="secondary" className="bg-green-600">
                  <Heart className="h-3 w-3 mr-1" />
                  {player.health}/100
                </Badge>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="bg-blue-600">
                  <Layers className="h-3 w-3 mr-1" />
                  Deck: {player.deck?.length || 0}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Hand */}
      <Card className="bg-gradient-to-t from-primary/10 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-center text-primary">Your Hand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
            {player.hand?.map((card: any, index: number) => (
              <CardComponent
                key={index}
                card={{ ...card, handIndex: index }}
                isSelected={selectedCard?.handIndex === index}
                onClick={() => onCardSelect({ ...card, handIndex: index })}
                size="medium"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

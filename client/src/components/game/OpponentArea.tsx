import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CardComponent from "./CardComponent";
import { Bot, Heart, Layers, HelpCircle } from "lucide-react";

interface OpponentAreaProps {
  opponent: any;
}

export default function OpponentArea({ opponent }: OpponentAreaProps) {
  if (!opponent) return null;

  return (
    <div className="space-y-4">
      {/* Opponent Info */}
      <Card className="bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-red-200">AI Commander</div>
                <div className="text-sm text-red-300/70">Hard Difficulty</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <Badge variant="secondary" className="bg-red-600">
                  <Heart className="h-3 w-3 mr-1" />
                  {opponent.health}/100
                </Badge>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="bg-blue-600">
                  <Layers className="h-3 w-3 mr-1" />
                  Cards: {opponent.hand?.length || 0}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opponent Hand (Hidden) */}
      <div className="flex justify-center space-x-2 mb-4">
        {Array.from({ length: opponent.hand?.length || 0 }).map((_, index) => (
          <div
            key={index}
            className="w-16 h-24 bg-gradient-to-br from-red-900 to-red-800 rounded-lg border-2 border-red-500/30 flex items-center justify-center transform rotate-180"
          >
            <HelpCircle className="h-6 w-6 text-red-400" />
          </div>
        ))}
      </div>

      {/* Opponent Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Command Zone */}
        <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-orange-400 text-center">Command Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center min-h-32">
              {opponent.commandZone?.map((card: any, index: number) => (
                <CardComponent
                  key={index}
                  card={card}
                  isSelected={false}
                  onClick={() => {}}
                  size="small"
                  isOpponent
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unit Zone */}
        <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 text-center">Unit Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center min-h-32">
              {opponent.unitZone?.map((card: any, index: number) => (
                <CardComponent
                  key={index}
                  card={card}
                  isSelected={false}
                  onClick={() => {}}
                  size="small"
                  isOpponent
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

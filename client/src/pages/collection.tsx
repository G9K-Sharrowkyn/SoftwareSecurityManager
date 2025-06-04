import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StarBackground from "@/components/ui/star-background";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Collection() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: userCards = [], error: cardsError } = useQuery({
    queryKey: ["/api/collection"],
    retry: false,
  });

  const { data: allCards = [], error: allCardsError } = useQuery({
    queryKey: ["/api/cards"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Handle errors
  useEffect(() => {
    const error = cardsError || allCardsError;
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [cardsError, allCardsError, toast]);

  if (isLoading || !user) return null;

  // Create a map of owned cards with quantities
  const ownedCardsMap = userCards.reduce((acc: Record<number, number>, userCard: any) => {
    acc[userCard.cardId] = userCard.quantity;
    return acc;
  }, {});

  // Filter and search cards
  const filteredCards = allCards.filter((card: any) => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "owned" && ownedCardsMap[card.id]) ||
                         (filterType === "units" && card.type === "Unit") ||
                         (filterType === "commands" && card.type === "Command") ||
                         (filterType === "shipyards" && card.type === "Shipyard");
    return matchesSearch && matchesFilter;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "text-gray-400 border-gray-400";
      case "Uncommon": return "text-green-400 border-green-400";
      case "Rare": return "text-blue-400 border-blue-400";
      case "Legendary": return "text-purple-400 border-purple-400";
      default: return "text-gray-400 border-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative overflow-hidden">
      <StarBackground />
      
      {/* Navigation Header */}
      <nav className="relative z-50 bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = "/"}
                className="text-cosmic-silver hover:text-cosmic-gold"
              >
                <i className="fas fa-arrow-left mr-2"></i>Back to Home
              </Button>
              <div className="flex items-center space-x-2">
                <i className="fas fa-layer-group text-cosmic-gold text-xl"></i>
                <span className="text-xl font-bold text-cosmic-gold">Collection</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-cosmic-silver">
                Cards Owned: <span className="text-cosmic-gold font-semibold">{userCards.length}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-cosmic-800 border-cosmic-600 text-cosmic-silver placeholder-cosmic-600 focus:border-cosmic-gold"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 bg-cosmic-800 border-cosmic-600 text-cosmic-silver">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-800 border-cosmic-600">
                <SelectItem value="all">All Cards</SelectItem>
                <SelectItem value="owned">Owned Only</SelectItem>
                <SelectItem value="units">Units</SelectItem>
                <SelectItem value="commands">Commands</SelectItem>
                <SelectItem value="shipyards">Shipyards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCards.map((card: any) => {
            const quantity = ownedCardsMap[card.id] || 0;
            const isOwned = quantity > 0;
            
            return (
              <Card 
                key={card.id} 
                className={`bg-cosmic-800 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 cursor-pointer group ${
                  !isOwned ? 'opacity-50' : ''
                }`}
              >
                <CardContent className="p-3">
                  <div className="relative">
                    {/* Card Image */}
                    <div className="aspect-[3/4] bg-cosmic-700 rounded-lg mb-2 overflow-hidden">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={card.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-image text-cosmic-600 text-2xl"></i>
                        </div>
                      )}
                    </div>
                    
                    {/* Quantity Badge */}
                    {isOwned && (
                      <div className="absolute top-2 right-2 bg-cosmic-gold text-cosmic-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {quantity}
                      </div>
                    )}
                  </div>
                  
                  {/* Card Info */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-cosmic-gold truncate">
                      {card.name}
                    </h3>
                    <div className="text-xs text-cosmic-silver">
                      {card.type}
                    </div>
                    <div className={`text-xs ${getRarityColor(card.rarity)}`}>
                      {card.rarity}
                    </div>
                    
                    {/* Stats */}
                    {card.type === "Unit" && (
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">ATK: {card.attack}</span>
                        <span className="text-blue-400">DEF: {card.defense}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-amber-400">
                      Cost: {card.commandCost}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-cosmic-600 text-4xl mb-4"></i>
            <p className="text-cosmic-silver">No cards found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}

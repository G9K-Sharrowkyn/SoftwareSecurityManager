import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CardDisplay from "@/components/cards/CardDisplay";

export default function Collection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");

  const { data: userCards, isLoading } = useQuery({
    queryKey: ["/api/cards/user"],
    retry: false,
  });

  const { data: allCards } = useQuery({
    queryKey: ["/api/cards"],
    retry: false,
  });

  const filteredCards = userCards?.filter((userCard: any) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || card.type.includes(selectedType);
    const matchesRarity = selectedRarity === "all" || card.rarity === selectedRarity;
    
    return matchesSearch && matchesType && matchesRarity;
  }) || [];

  const cardTypes = ["all", "Shipyard", "Unit", "Command"];
  const rarities = ["all", "common", "uncommon", "rare", "epic", "legendary"];

  const totalCards = allCards?.length || 0;
  const ownedCards = userCards?.length || 0;
  const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-cosmic-gold text-xl">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading collection...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cosmic-gold mb-4">
          <i className="fas fa-layer-group mr-3"></i>
          Card Collection
        </h1>
        <p className="text-cosmic-silver mb-6">
          Browse and manage your card collection. Build powerful decks from your acquired cards.
        </p>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cosmic-gold">{ownedCards}</div>
              <div className="text-cosmic-silver text-sm">Cards Owned</div>
            </CardContent>
          </Card>
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cosmic-gold">{completionPercentage}%</div>
              <div className="text-cosmic-silver text-sm">Collection Complete</div>
            </CardContent>
          </Card>
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cosmic-gold">
                {userCards?.filter((uc: any) => uc.card.rarity === "legendary").length || 0}
              </div>
              <div className="text-cosmic-silver text-sm">Legendary Cards</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-600 mb-8">
        <CardHeader>
          <CardTitle className="text-cosmic-silver">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-cosmic-silver text-sm mb-2 block">Search</label>
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
              />
            </div>
            <div>
              <label className="text-cosmic-silver text-sm mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {cardTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className={selectedType === type 
                      ? "bg-cosmic-gold text-cosmic-900" 
                      : "border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
                    }
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-cosmic-silver text-sm mb-2 block">Rarity</label>
              <div className="flex flex-wrap gap-2">
                {rarities.map((rarity) => (
                  <Button
                    key={rarity}
                    variant={selectedRarity === rarity ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRarity(rarity)}
                    className={selectedRarity === rarity 
                      ? "bg-cosmic-gold text-cosmic-900" 
                      : "border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
                    }
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredCards.map((userCard: any) => (
            <div key={userCard.id} className="relative">
              <CardDisplay card={userCard.card} />
              <div className="absolute top-2 right-2">
                <Badge className="bg-cosmic-gold text-cosmic-900 font-bold">
                  x{userCard.quantity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-600">
          <CardContent className="p-12 text-center">
            <i className="fas fa-search text-cosmic-silver/50 text-4xl mb-4"></i>
            <h3 className="text-xl font-semibold text-cosmic-silver mb-2">No Cards Found</h3>
            <p className="text-cosmic-silver/70">
              {userCards?.length === 0 
                ? "Your collection is empty. Open some booster packs to get started!"
                : "No cards match your current filters. Try adjusting your search criteria."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarBackground from "@/components/StarBackground";
import CardComponent from "@/components/CardComponent";
import { useLocation } from "wouter";

export default function Collection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ["/api/collection"],
    retry: false,
  });

  // Handle unauthorized error
  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const filteredCards = collection?.filter((userCard: any) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || card.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesRarity = rarityFilter === "all" || card.rarity.toLowerCase() === rarityFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesRarity;
  }) || [];

  const totalCards = collection?.reduce((sum: number, userCard: any) => sum + userCard.quantity, 0) || 0;
  const uniqueCards = collection?.length || 0;

  return (
    <div className="min-h-screen bg-cosmic-black text-cosmic-silver relative">
      <StarBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-cosmic-blue/90 backdrop-blur-md border-b border-cosmic-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-cosmic-gold">Card Collection</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-cosmic-blue/50 px-3 py-2 rounded-lg">
                <i className="fas fa-coins text-cosmic-gold"></i>
                <span className="text-sm font-semibold">{user?.credits || 0}</span>
              </div>
              <Button onClick={() => setLocation('/deck-builder')}>
                <i className="fas fa-edit mr-2"></i>Deck Builder
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cosmic-gold">{totalCards}</div>
              <div className="text-cosmic-silver">Total Cards</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cosmic-gold">{uniqueCards}</div>
              <div className="text-cosmic-silver">Unique Cards</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cosmic-gold">
                {uniqueCards > 0 ? Math.round((uniqueCards / 200) * 100) : 0}%
              </div>
              <div className="text-cosmic-silver">Collection Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">Filter Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-cosmic-silver mb-2">Search</label>
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cosmic-silver mb-2">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="unit">Units</SelectItem>
                    <SelectItem value="command">Commands</SelectItem>
                    <SelectItem value="shipyard">Shipyards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cosmic-silver mb-2">Rarity</label>
                <Select value={rarityFilter} onValueChange={setRarityFilter}>
                  <SelectTrigger className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver">
                    <SelectValue placeholder="All Rarities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="uncommon">Uncommon</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-cosmic-gold">Loading collection...</div>
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredCards.map((userCard: any) => (
              <div key={userCard.id} className="relative">
                <CardComponent card={userCard.card} />
                <div className="absolute top-2 right-2 bg-cosmic-gold text-cosmic-black text-xs px-2 py-1 rounded-full font-bold">
                  x{userCard.quantity}
                </div>
                <Badge 
                  className={`absolute bottom-2 left-2 text-xs ${
                    userCard.card.rarity === 'Legendary' ? 'bg-purple-600' :
                    userCard.card.rarity === 'Rare' ? 'bg-blue-600' :
                    userCard.card.rarity === 'Uncommon' ? 'bg-green-600' :
                    'bg-gray-600'
                  }`}
                >
                  {userCard.card.rarity}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
            <CardContent className="p-12 text-center">
              <i className="fas fa-layer-group text-cosmic-gold text-6xl mb-4"></i>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">No Cards Found</h3>
              <p className="text-cosmic-silver mb-6">
                {collection?.length === 0 
                  ? "You don't have any cards yet. Open some booster packs to start building your collection!"
                  : "No cards match your current filters. Try adjusting your search criteria."
                }
              </p>
              {collection?.length === 0 && (
                <Button onClick={() => setLocation('/')}>
                  <i className="fas fa-gift mr-2"></i>Open Booster Packs
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

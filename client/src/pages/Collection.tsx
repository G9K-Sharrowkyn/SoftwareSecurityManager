import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarBackground from "@/components/StarBackground";
import CardComponent from "@/components/CardComponent";

interface Card {
  id: number;
  name: string;
  type: string;
  rarity: string;
  commandCost: number;
  attack: number;
  defense: number;
  specialAbility: string;
  imageUrl: string;
  traits: string[];
}

interface UserCard {
  id: number;
  quantity: number;
  card: Card;
}

export default function Collection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");

  const { data: collection, isLoading, error } = useQuery<UserCard[]>({
    queryKey: ["/api/collection"],
    retry: false,
  });

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

  const filteredCards = collection?.filter(userCard => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.specialAbility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || card.type.toLowerCase() === filterType.toLowerCase();
    const matchesRarity = filterRarity === "all" || card.rarity.toLowerCase() === filterRarity.toLowerCase();
    
    return matchesSearch && matchesType && matchesRarity;
  }) || [];

  const totalCards = collection?.reduce((sum, userCard) => sum + userCard.quantity, 0) || 0;
  const uniqueCards = collection?.length || 0;

  const rarityStats = collection?.reduce((stats, userCard) => {
    const rarity = userCard.card.rarity;
    stats[rarity] = (stats[rarity] || 0) + userCard.quantity;
    return stats;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarBackground />
      
      {/* Navigation Header */}
      <nav className="relative z-50 bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
                <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-home mr-2"></i>Dashboard
              </Link>
              <span className="text-cosmic-gold font-medium">
                <i className="fas fa-layer-group mr-2"></i>Collection
              </span>
              <Link href="/deck-builder" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-hammer mr-2"></i>Deck Builder
              </Link>
              <Link href="/rankings" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-trophy mr-2"></i>Rankings
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-cosmic-700 px-3 py-2 rounded-lg">
                <i className="fas fa-coins text-cosmic-gold"></i>
                <span className="text-sm font-semibold">{user?.currency || 0}</span>
              </div>
              <img 
                src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                alt="Player Avatar" 
                className="w-10 h-10 rounded-full border-2 border-cosmic-gold object-cover" 
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 min-h-screen pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-4">
              Card Collection
            </h1>
            <p className="text-xl text-cosmic-silver">
              Manage your fleet and discover new strategies
            </p>
          </div>

          {/* Collection Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-cosmic-800/70 border border-cosmic-600">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-cosmic-gold">{totalCards}</div>
                <div className="text-sm text-cosmic-silver">Total Cards</div>
              </CardContent>
            </Card>
            <Card className="bg-cosmic-800/70 border border-cosmic-600">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-cosmic-gold">{uniqueCards}</div>
                <div className="text-sm text-cosmic-silver">Unique Cards</div>
              </CardContent>
            </Card>
            <Card className="bg-cosmic-800/70 border border-cosmic-600">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{rarityStats.Legendary || 0}</div>
                <div className="text-sm text-cosmic-silver">Legendary</div>
              </CardContent>
            </Card>
            <Card className="bg-cosmic-800/70 border border-cosmic-600">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{rarityStats.Rare || 0}</div>
                <div className="text-sm text-cosmic-silver">Rare</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-cosmic-800/70 border border-cosmic-600 mb-8">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Filter Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cosmic-silver mb-2">Search</label>
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cosmic-silver mb-2">Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver">
                      <SelectValue />
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
                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver">
                      <SelectValue />
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
            <div className="flex justify-center items-center h-64">
              <i className="fas fa-spinner fa-spin text-cosmic-gold text-4xl"></i>
            </div>
          ) : filteredCards.length === 0 ? (
            <Card className="bg-cosmic-800/70 border border-cosmic-600">
              <CardContent className="p-8 text-center">
                <i className="fas fa-search text-cosmic-gold text-4xl mb-4"></i>
                <h3 className="text-xl font-bold text-cosmic-gold mb-2">No Cards Found</h3>
                <p className="text-cosmic-silver">
                  {collection?.length === 0 
                    ? "You don't have any cards yet. Try opening some booster packs!"
                    : "No cards match your current filters."
                  }
                </p>
                {collection?.length === 0 && (
                  <Link href="/">
                    <Button className="mt-4 bg-cosmic-gold text-cosmic-900">
                      <i className="fas fa-gift mr-2"></i>Get Booster Packs
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCards.map((userCard) => (
                <div key={userCard.id} className="relative">
                  <CardComponent 
                    card={userCard.card}
                    quantity={userCard.quantity}
                    showQuantity
                    interactive
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import StarBackground from "@/components/ui/star-background";
import Navigation from "@/components/ui/navigation";
import BoosterPack from "@/components/ui/booster-pack";

export default function Collection() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("all");

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

  const { data: collection } = useQuery({
    queryKey: ["/api/collection"],
    retry: false,
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/booster-packs"],
    retry: false,
  });

  const buyBoosterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs/buy");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Booster pack purchased!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to purchase booster pack",
        variant: "destructive",
      });
    },
  });

  const openBoosterMutation = useMutation({
    mutationFn: async (packId: number) => {
      const response = await apiRequest("POST", `/api/booster-packs/${packId}/open`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      toast({
        title: "Pack Opened!",
        description: `You received ${data.cards.length} new cards!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to open booster pack",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userCards = collection || [];
  const unopenedPacks = boosterPacks?.filter((pack: any) => !pack.opened) || [];

  const filteredCards = userCards.filter((userCard: any) => {
    const matchesSearch = userCard.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === "all" || userCard.card.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "text-yellow-400";
      case "rare": return "text-purple-400";
      case "uncommon": return "text-blue-400";
      default: return "text-gray-400";
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "from-yellow-600 to-yellow-800";
      case "rare": return "from-purple-600 to-purple-800";
      case "uncommon": return "from-blue-600 to-blue-800";
      default: return "from-gray-600 to-gray-800";
    }
  };

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <Navigation />
      
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold animate-glow">
            Card Collection
          </h1>
          <div className="flex items-center space-x-2 bg-cosmic-blue/30 rounded-lg px-4 py-2">
            <i className="fas fa-coins text-yellow-400"></i>
            <span className="font-semibold text-yellow-400">{user.credits}</span>
          </div>
        </div>

        {/* Booster Packs Section */}
        {unopenedPacks.length > 0 && (
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 mb-8">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">
                <i className="fas fa-gift mr-2"></i>
                Unopened Booster Packs ({unopenedPacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {unopenedPacks.map((pack: any) => (
                  <BoosterPack
                    key={pack.id}
                    pack={pack}
                    onOpen={() => openBoosterMutation.mutate(pack.id)}
                    isOpening={openBoosterMutation.isPending}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buy Booster Pack */}
        <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">
              <i className="fas fa-shopping-cart mr-2"></i>
              Shop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Standard Booster Pack</h3>
                <p className="text-sm text-foreground/70">Contains 5 random cards</p>
              </div>
              <Button 
                onClick={() => buyBoosterMutation.mutate()}
                disabled={buyBoosterMutation.isPending || user.credits < 100}
                className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black"
              >
                Buy for 100 <i className="fas fa-coins ml-1"></i>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Collection Filters */}
        <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-space-black/30 border-cosmic-gold/30"
                />
              </div>
              
              <div className="flex gap-2">
                {["all", "common", "uncommon", "rare", "legendary"].map((rarity) => (
                  <Button
                    key={rarity}
                    variant={selectedRarity === rarity ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRarity(rarity)}
                    className={selectedRarity === rarity 
                      ? "bg-cosmic-gold text-space-black" 
                      : "border-cosmic-gold/30 text-cosmic-gold hover:bg-cosmic-gold hover:text-space-black"
                    }
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Grid */}
        {filteredCards.length === 0 ? (
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardContent className="p-12 text-center">
              <i className="fas fa-layer-group text-6xl text-cosmic-gold/30 mb-4"></i>
              <h3 className="text-xl font-semibold text-cosmic-gold mb-2">No Cards Found</h3>
              <p className="text-foreground/70">
                {searchTerm || selectedRarity !== "all" 
                  ? "Try adjusting your search or filters."
                  : "Start by opening booster packs to build your collection!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredCards.map((userCard: any) => (
              <Card 
                key={`${userCard.cardId}-${userCard.userId}`}
                className={`bg-gradient-to-br ${getRarityBg(userCard.card.rarity)} border-2 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden`}
              >
                <CardContent className="p-3">
                  <div className="aspect-[3/4] bg-space-black/50 rounded mb-2 flex items-center justify-center">
                    <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
                  </div>
                  
                  <h3 className="font-semibold text-white text-sm mb-1 truncate">
                    {userCard.card.name.replace(/_/g, ' ')}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="secondary" className={getRarityColor(userCard.card.rarity)}>
                      {userCard.card.rarity}
                    </Badge>
                    <span className="text-white">x{userCard.quantity}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-white/70 mt-2">
                    <span>⚔️ {userCard.card.attack}</span>
                    <span>🛡️ {userCard.card.defense}</span>
                    <span>💰 {userCard.card.commandCost}</span>
                  </div>
                  
                  {userCard.card.specialAbility && (
                    <p className="text-xs text-white/80 mt-2 truncate">
                      {userCard.card.specialAbility}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "@/components/NavigationHeader";
import BoosterAnimation from "@/components/BoosterAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Search, Filter, Layers, Sparkles, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Collection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [showParticles, setShowParticles] = useState(false);
  const [revealedCards, setRevealedCards] = useState<any[]>([]);

  const { data: collection } = useQuery({
    queryKey: ["/api/collection"],
    enabled: !!user,
  });

  const { data: cards } = useQuery({
    queryKey: ["/api/cards"],
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/boosters"],
    enabled: !!user,
  });

  const openPackMutation = useMutation({
    mutationFn: async (packId: number) => {
      const response = await apiRequest("POST", `/api/boosters/${packId}/open`);
      return await response.json();
    },
    onSuccess: (pack) => {
      setShowParticles(true);
      const openedCards = pack.cards.map((cardId: number) => 
        cards?.find((card: any) => card.id === cardId)
      ).filter(Boolean);
      setRevealedCards(openedCards);
      
      toast({
        title: "Booster Pack Opened!",
        description: `You received ${openedCards.length} new cards!`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/boosters"] });
      
      setTimeout(() => setShowParticles(false), 2000);
    },
  });

  const availablePacks = boosterPacks?.filter((pack: any) => !pack.isOpened) || [];
  
  const getCardDetails = (userCard: any) => {
    return cards?.find((card: any) => card.id === userCard.cardId);
  };

  const filteredCollection = collection?.filter((userCard: any) => {
    const card = getCardDetails(userCard);
    if (!card) return false;
    
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || card.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesRarity = filterRarity === "all" || card.rarity === filterRarity;
    
    return matchesSearch && matchesType && matchesRarity;
  }) || [];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-500";
      case "uncommon": return "bg-green-500";
      case "rare": return "bg-blue-500";
      case "legendary": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const openBoosterPack = (packId: number) => {
    openPackMutation.mutate(packId);
  };

  return (
    <div className="min-h-screen relative z-10">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-glow">
              Your Collection
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-primary">
              {collection?.length || 0} Cards
            </span>
          </div>
        </div>

        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="collection" className="text-lg py-3">
              <Layers className="mr-2 h-4 w-4" />
              Card Collection
            </TabsTrigger>
            <TabsTrigger value="boosters" className="text-lg py-3">
              <Gift className="mr-2 h-4 w-4" />
              Booster Packs ({availablePacks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Card Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="unit">Units</SelectItem>
                  <SelectItem value="shipyard">Shipyards</SelectItem>
                  <SelectItem value="command">Commands</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRarity} onValueChange={setFilterRarity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rarity" />
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

            {/* Collection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCollection.map((userCard: any) => {
                const card = getCardDetails(userCard);
                if (!card) return null;

                return (
                  <Card key={userCard.id} className="bg-card/80 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover cursor-pointer">
                    <CardContent className="p-3">
                      <div className="relative mb-2">
                        <div className="aspect-[3/4] bg-background rounded-lg overflow-hidden border border-border">
                          {card.imageUrl ? (
                            <img 
                              src={card.imageUrl} 
                              alt={card.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Sparkles className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-1 right-1">
                          <Badge className={`${getRarityColor(card.rarity)} text-white text-xs`}>
                            {card.rarity}
                          </Badge>
                        </div>
                        {userCard.quantity > 1 && (
                          <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {userCard.quantity}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-primary mb-1 truncate">
                        {card.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {card.type}
                      </div>
                      {card.commandCost !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Cost: {card.commandCost}
                        </div>
                      )}
                      {card.attack !== undefined && card.defense !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          {card.attack}/{card.defense}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCollection.length === 0 && (
              <div className="text-center py-16">
                <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  No cards found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== "all" || filterRarity !== "all" 
                    ? "Try adjusting your filters" 
                    : "Open some booster packs to start your collection!"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="boosters">
            <div className="relative">
              {showParticles && <BoosterAnimation visible={showParticles} />}
              
              {availablePacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {availablePacks.map((pack: any) => (
                    <Card key={pack.id} className="bg-card/80 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover">
                      <CardHeader className="text-center">
                        <CardTitle className="text-primary">
                          {pack.packType === "standard" ? "Nebula Pack" : pack.packType}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="mb-6">
                          <div className="w-32 h-48 mx-auto bg-gradient-to-br from-primary to-yellow-600 rounded-xl border-4 border-primary shadow-2xl relative overflow-hidden cursor-pointer glow-gold"
                               onClick={() => openBoosterPack(pack.id)}>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4 text-center">
                              <div className="text-black font-bold text-lg">Nebula Pack</div>
                              <div className="text-black/80 text-sm">5 Random Cards</div>
                            </div>
                            <Gift className="absolute top-4 right-4 h-6 w-6 text-black" />
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full glow-gold"
                          onClick={() => openBoosterPack(pack.id)}
                          disabled={openPackMutation.isPending}
                        >
                          {openPackMutation.isPending ? "Opening..." : "Open Pack"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                    No booster packs available
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Earn more packs by playing games and completing challenges
                  </p>
                  <Button onClick={() => setLocation("/")}>
                    Return to Dashboard
                  </Button>
                </div>
              )}

              {/* Revealed Cards Modal */}
              {revealedCards.length > 0 && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-card rounded-2xl p-8 max-w-4xl mx-4 border border-primary">
                    <h2 className="text-3xl font-bold text-center text-primary mb-6">
                      Cards Revealed!
                    </h2>
                    
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      {revealedCards.map((card, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-[3/4] bg-background rounded-lg overflow-hidden border-2 border-primary">
                            {card.imageUrl ? (
                              <img 
                                src={card.imageUrl} 
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Sparkles className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="absolute top-1 right-1">
                            <Badge className={`${getRarityColor(card.rarity)} text-white text-xs`}>
                              {card.rarity}
                            </Badge>
                          </div>
                          <div className="text-center mt-2">
                            <div className="text-sm font-semibold text-primary">
                              {card.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <Button onClick={() => setRevealedCards([])}>
                        Add to Collection
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

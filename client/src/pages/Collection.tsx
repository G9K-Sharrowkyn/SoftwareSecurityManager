import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/navigation";
import StarBackground from "@/components/game/StarBackground";
import BoosterAnimation from "@/components/game/BoosterAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface Card {
  id: number;
  name: string;
  type: string[];
  attack: number;
  defense: number;
  commandCost: number;
  specialAbility: string;
  rarity: string;
  imageUrl: string;
}

interface UserCard {
  id: number;
  quantity: number;
  card: Card;
}

interface BoosterPack {
  id: number;
  packType: string;
  isOpened: boolean;
}

export default function Collection() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Card[]>([]);
  const [particlesVisible, setParticlesVisible] = useState(false);

  // Fetch user collection
  const { data: userCards = [], isLoading: collectionLoading } = useQuery({
    queryKey: ["/api/collection"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch booster packs
  const { data: boosterPacks = [], isLoading: packsLoading } = useQuery({
    queryKey: ["/api/booster-packs"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Buy booster pack mutation
  const buyBoosterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Booster Pack Purchased",
        description: "New booster pack added to your collection!",
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
        description: "Failed to purchase booster pack. Check your credits.",
        variant: "destructive",
      });
    },
  });

  // Open booster pack mutation
  const openBoosterMutation = useMutation({
    mutationFn: async (packId: number) => {
      const response = await apiRequest("POST", `/api/booster-packs/${packId}/open`);
      return response.json();
    },
    onSuccess: (result) => {
      setRevealedCards(result.cards);
      setParticlesVisible(true);
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      
      setTimeout(() => {
        setParticlesVisible(false);
      }, 2000);

      toast({
        title: "Booster Pack Opened!",
        description: `Revealed ${result.cards.length} new cards!`,
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

  // Filter cards
  const filteredCards = userCards.filter((userCard: UserCard) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.specialAbility?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === "All" || card.rarity === selectedRarity;
    const matchesType = selectedType === "All" || card.type.includes(selectedType);
    
    return matchesSearch && matchesRarity && matchesType;
  });

  const handleOpenBooster = (packId: number) => {
    setShowBoosterModal(true);
    openBoosterMutation.mutate(packId);
  };

  const handleCloseBoosterModal = () => {
    setShowBoosterModal(false);
    setRevealedCards([]);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "text-gray-400 border-gray-400/30";
      case "Uncommon": return "text-green-400 border-green-400/30";
      case "Rare": return "text-blue-400 border-blue-400/30";
      case "Legendary": return "text-purple-400 border-purple-400/30";
      default: return "text-gray-400 border-gray-400/30";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-black text-star-silver flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-mystic-gold font-semibold">Loading collection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen starfield-background">
      <StarBackground />
      <Navigation />
      
      <main className="relative z-10 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-amber mb-4 animate-glow">
              Card Collection
            </h1>
            <p className="text-lg text-star-silver">
              Total Cards: <span className="text-mystic-gold font-semibold">{userCards.length}</span>
            </p>
          </div>

          {/* Stats and Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card-cosmic">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-mystic-gold mb-2">
                  {userCards.reduce((total: number, userCard: UserCard) => total + userCard.quantity, 0)}
                </div>
                <div className="text-star-silver">Total Cards Owned</div>
              </CardContent>
            </Card>

            <Card className="card-cosmic">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {userCards.filter((userCard: UserCard) => userCard.card.rarity === "Legendary").length}
                </div>
                <div className="text-star-silver">Legendary Cards</div>
              </CardContent>
            </Card>

            <Card className="card-cosmic">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {user?.credits || 0}
                </div>
                <div className="text-star-silver">Credits Available</div>
              </CardContent>
            </Card>
          </div>

          {/* Booster Packs Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-mystic-gold">Booster Packs</h2>
              <Button 
                onClick={() => buyBoosterMutation.mutate()}
                disabled={buyBoosterMutation.isPending || (user?.credits || 0) < 100}
                className="button-cosmic"
              >
                {buyBoosterMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-space-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Purchasing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Buy Pack (100 Credits)
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {boosterPacks
                .filter((pack: BoosterPack) => !pack.isOpened)
                .map((pack: BoosterPack) => (
                  <Card key={pack.id} className="card-cosmic cursor-pointer hover:scale-105 transition-all duration-300" onClick={() => handleOpenBooster(pack.id)}>
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-28 bg-gradient-to-br from-mystic-gold to-amber rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-mystic-gold animate-pulse-gold">
                        <i className="fas fa-gift text-space-black text-2xl"></i>
                      </div>
                      <div className="text-mystic-gold font-semibold">{pack.packType} Pack</div>
                      <div className="text-star-silver/70 text-sm">Click to open!</div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {boosterPacks.filter((pack: BoosterPack) => !pack.isOpened).length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-gift text-6xl text-star-silver/30 mb-4"></i>
                <p className="text-star-silver/70">No unopened booster packs. Purchase one to get started!</p>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-cosmic-blue/30 border-mystic-gold/30 text-star-silver placeholder-star-silver/50"
            />
            
            <Select value={selectedRarity} onValueChange={setSelectedRarity}>
              <SelectTrigger className="bg-cosmic-blue/30 border-mystic-gold/30 text-star-silver">
                <SelectValue placeholder="All Rarities" />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-blue border-mystic-gold/30">
                <SelectItem value="All">All Rarities</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Uncommon">Uncommon</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-cosmic-blue/30 border-mystic-gold/30 text-star-silver">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-blue border-mystic-gold/30">
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Shipyard">Shipyard</SelectItem>
                <SelectItem value="Biological">Biological</SelectItem>
                <SelectItem value="Machine">Machine</SelectItem>
                <SelectItem value="BloodThirsty">BloodThirsty</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-star-silver flex items-center justify-center">
              Showing {filteredCards.length} cards
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredCards.map((userCard: UserCard) => (
              <Card 
                key={userCard.id} 
                className={`card-cosmic cursor-pointer hover:scale-105 transition-all duration-300 ${getRarityColor(userCard.card.rarity)}`}
                onClick={() => setSelectedCard(userCard.card)}
              >
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-cosmic-blue/50 rounded-lg mb-3 overflow-hidden">
                    {userCard.card.imageUrl ? (
                      <img 
                        src={userCard.card.imageUrl} 
                        alt={userCard.card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-image text-star-silver/30 text-2xl"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs font-semibold text-mystic-gold mb-1 truncate">
                    {userCard.card.name.replace(/_/g, ' ')}
                  </div>
                  
                  <div className="text-xs text-star-silver/70 mb-2">
                    {userCard.card.type.join(', ')}
                  </div>
                  
                  {userCard.card.attack > 0 || userCard.card.defense > 0 ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-red-400">ATK: {userCard.card.attack}</span>
                      <span className="text-blue-400">DEF: {userCard.card.defense}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-center text-mystic-gold">
                      {userCard.card.type.includes("Shipyard") ? "Command" : "Special"}
                    </div>
                  )}
                  
                  <div className="mt-2 text-center">
                    <span className="text-xs bg-mystic-gold/20 text-mystic-gold px-2 py-1 rounded">
                      x{userCard.quantity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-search text-6xl text-star-silver/30 mb-4"></i>
              <p className="text-star-silver/70">No cards found matching your search criteria.</p>
            </div>
          )}
        </div>
      </main>

      {/* Card Detail Modal */}
      <Dialog open={selectedCard !== null} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-2xl cosmic-gradient border border-mystic-gold/30">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-mystic-gold text-center">
                  {selectedCard.name.replace(/_/g, ' ')}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-[3/4] bg-cosmic-blue/50 rounded-lg overflow-hidden">
                  {selectedCard.imageUrl ? (
                    <img 
                      src={selectedCard.imageUrl} 
                      alt={selectedCard.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-image text-star-silver/30 text-4xl"></i>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-mystic-gold mb-2">Type</h4>
                    <p className="text-star-silver">{selectedCard.type.join(', ')}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-star-silver/70">Cost</div>
                      <div className="text-mystic-gold font-bold">{selectedCard.commandCost}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-star-silver/70">Attack</div>
                      <div className="text-red-400 font-bold">{selectedCard.attack}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-star-silver/70">Defense</div>
                      <div className="text-blue-400 font-bold">{selectedCard.defense}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-mystic-gold mb-2">Special Ability</h4>
                    <p className="text-star-silver text-sm bg-space-black/30 p-3 rounded">
                      {selectedCard.specialAbility || "No special ability"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-mystic-gold mb-2">Rarity</h4>
                    <span className={`px-3 py-1 rounded text-sm ${getRarityColor(selectedCard.rarity)}`}>
                      {selectedCard.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Booster Opening Modal */}
      <Dialog open={showBoosterModal} onOpenChange={handleCloseBoosterModal}>
        <DialogContent className="max-w-4xl cosmic-gradient border border-mystic-gold/30">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-mystic-gold text-center mb-4">
              <i className="fas fa-gift mr-3"></i>
              Booster Pack Opening
            </DialogTitle>
          </DialogHeader>
          
          {openBoosterMutation.isPending ? (
            <div className="text-center py-12">
              <div className="w-20 h-28 bg-gradient-to-br from-mystic-gold to-amber rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-mystic-gold animate-pulse-gold">
                <i className="fas fa-gift text-space-black text-3xl"></i>
              </div>
              <p className="text-star-silver">Opening booster pack...</p>
            </div>
          ) : (
            <>
              {revealedCards.length > 0 && (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Cards Revealed!</h3>
                    <p className="text-star-silver/70">These cards have been added to your collection</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    {revealedCards.map((card, index) => (
                      <Card key={index} className={`card-cosmic animate-card-hover ${getRarityColor(card.rarity)}`} style={{ animationDelay: `${index * 200}ms` }}>
                        <CardContent className="p-3">
                          <div className="aspect-[3/4] bg-cosmic-blue/50 rounded mb-2 overflow-hidden">
                            {card.imageUrl ? (
                              <img 
                                src={card.imageUrl} 
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="fas fa-image text-star-silver/30"></i>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-mystic-gold font-semibold truncate">
                            {card.name.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-center mt-1">
                            <span className={`${getRarityColor(card.rarity)}`}>
                              {card.rarity}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Button onClick={handleCloseBoosterModal} className="button-cosmic">
                      <i className="fas fa-check mr-2"></i>
                      Continue
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Particle Effect */}
      {particlesVisible && <BoosterAnimation visible={particlesVisible} />}
    </div>
  );
}

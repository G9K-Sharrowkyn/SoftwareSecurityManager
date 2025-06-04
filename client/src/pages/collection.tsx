import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/layout/navigation";
import BoosterPackModal from "@/components/game/BoosterPackModal";

export default function Collection() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showBoosterModal, setShowBoosterModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's collection
  const { data: userCards, isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/collection"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch user's decks
  const { data: userDecks } = useQuery({
    queryKey: ["/api/decks"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch booster packs
  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/booster-packs"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; cardData: any[] }) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Deck created successfully!",
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
        description: "Failed to create deck",
        variant: "destructive",
      });
    },
  });

  if (isLoading || cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold text-xl">Loading collection...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Filter cards based on search and type
  const filteredCards = userCards?.filter((userCard: any) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || 
      (filterType === "units" && !card.type.includes("Shipyard")) ||
      (filterType === "shipyards" && card.type.includes("Shipyard"));
    return matchesSearch && matchesType;
  }) || [];

  const availablePacks = boosterPacks?.filter((pack: any) => !pack.isOpened) || [];

  const createStarterDeck = () => {
    if (!userCards || userCards.length < 10) {
      toast({
        title: "Not enough cards",
        description: "You need at least 10 cards to create a deck",
        variant: "destructive",
      });
      return;
    }

    const deckCards = userCards.slice(0, Math.min(20, userCards.length)).map((userCard: any) => ({
      cardId: userCard.cardId,
      quantity: Math.min(userCard.quantity, 3)
    }));

    createDeckMutation.mutate({
      name: `Deck ${(userDecks?.length || 0) + 1}`,
      cardData: deckCards,
    });
  };

  return (
    <div className="min-h-screen relative z-10">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold mb-4">Your Collection</h1>
          <p className="text-cosmic-silver">
            Manage your cards and build powerful decks
          </p>
        </div>

        {/* Stats and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Collection Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Total Cards:</span>
                  <span className="text-cosmic-gold font-bold">{userCards?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Unique Cards:</span>
                  <span className="text-cosmic-gold font-bold">
                    {new Set(userCards?.map((uc: any) => uc.cardId)).size || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Decks Built:</span>
                  <span className="text-cosmic-gold font-bold">{userDecks?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Booster Packs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cosmic-gold">{availablePacks.length}</div>
                  <div className="text-cosmic-silver">Available Packs</div>
                </div>
                <Button 
                  onClick={() => setShowBoosterModal(true)}
                  disabled={availablePacks.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <i className="fas fa-gift mr-2"></i>
                  Open Pack
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={createStarterDeck}
                  disabled={createDeckMutation.isPending || !userCards || userCards.length < 10}
                  className="w-full bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-900"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create Deck
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-cosmic-900"
                >
                  <i className="fas fa-download mr-2"></i>
                  Export Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver placeholder:text-cosmic-silver/50"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cards</SelectItem>
              <SelectItem value="units">Units</SelectItem>
              <SelectItem value="shipyards">Shipyards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Card Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-cosmic-silver text-lg mb-4">
              {userCards?.length === 0 ? "No cards in your collection yet" : "No cards match your filters"}
            </div>
            {userCards?.length === 0 && (
              <Button 
                onClick={() => setShowBoosterModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <i className="fas fa-gift mr-2"></i>
                Open Your First Pack
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCards.map((userCard: any) => (
              <Card key={`${userCard.cardId}-${userCard.id}`} className="bg-cosmic-800/50 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-gradient-to-br from-cosmic-blue to-cosmic-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    {userCard.card.imageUrl ? (
                      <img 
                        src={userCard.card.imageUrl} 
                        alt={userCard.card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-cosmic-gold text-4xl">
                        <i className={userCard.card.type.includes("Shipyard") ? "fas fa-industry" : "fas fa-rocket"}></i>
                      </div>
                    )}
                    
                    {/* Card stats overlay */}
                    <div className="absolute top-2 left-2 right-2 bg-black/80 rounded text-xs text-center">
                      <div className="text-cosmic-gold font-semibold truncate">{userCard.card.name}</div>
                    </div>
                    
                    {!userCard.card.type.includes("Shipyard") && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 rounded text-xs">
                        <div className="flex justify-between items-center text-white px-1">
                          <span className="text-red-400">{userCard.card.attack}</span>
                          <span className="text-amber-400">{userCard.card.commandCost}</span>
                          <span className="text-blue-400">{userCard.card.defense}</span>
                        </div>
                      </div>
                    )}

                    {/* Quantity badge */}
                    <div className="absolute top-2 right-2 bg-cosmic-gold text-cosmic-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {userCard.quantity}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-semibold text-cosmic-gold text-sm truncate">
                      {userCard.card.name}
                    </div>
                    <div className="text-xs text-cosmic-silver">
                      {userCard.card.type.join(", ")}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded text-center ${
                      userCard.card.rarity === "legendary" ? "bg-purple-600 text-white" :
                      userCard.card.rarity === "rare" ? "bg-blue-600 text-white" :
                      userCard.card.rarity === "uncommon" ? "bg-green-600 text-white" :
                      "bg-gray-600 text-white"
                    }`}>
                      {userCard.card.rarity}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Booster Pack Modal */}
      <BoosterPackModal 
        isOpen={showBoosterModal}
        onClose={() => setShowBoosterModal(false)}
        availablePacks={availablePacks}
      />
    </div>
  );
}

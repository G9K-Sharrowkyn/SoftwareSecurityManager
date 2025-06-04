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

export default function DeckBuilder() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [deckName, setDeckName] = useState("");
  const [currentDeck, setCurrentDeck] = useState<{cardId: number, quantity: number, card: any}[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

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

  const { data: decks } = useQuery({
    queryKey: ["/api/decks"],
    retry: false,
  });

  const createDeckMutation = useMutation({
    mutationFn: async () => {
      if (!deckName.trim()) {
        throw new Error("Deck name is required");
      }
      if (currentDeck.length < 20) {
        throw new Error("Deck must contain at least 20 cards");
      }
      if (currentDeck.length > 60) {
        throw new Error("Deck cannot contain more than 60 cards");
      }

      const deckData = {
        name: deckName.trim(),
        cards: currentDeck.map(card => ({
          cardId: card.cardId,
          quantity: card.quantity
        }))
      };

      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setDeckName("");
      setCurrentDeck([]);
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
        description: error.message || "Failed to create deck",
        variant: "destructive",
      });
    },
  });

  const setActiveDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      const response = await apiRequest("PUT", `/api/decks/${deckId}/active`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Active deck updated!",
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
        description: "Failed to set active deck",
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
  const userDecks = decks || [];

  const addCardToDeck = (card: any) => {
    const existingCard = currentDeck.find(c => c.cardId === card.card.id);
    const maxQuantity = Math.min(4, card.quantity); // Max 4 copies per deck, but limited by owned quantity
    
    if (existingCard) {
      if (existingCard.quantity < maxQuantity) {
        setCurrentDeck(current => 
          current.map(c => 
            c.cardId === card.card.id 
              ? { ...c, quantity: c.quantity + 1 }
              : c
          )
        );
      }
    } else {
      setCurrentDeck(current => [
        ...current,
        { cardId: card.card.id, quantity: 1, card: card.card }
      ]);
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    setCurrentDeck(current => {
      const existingCard = current.find(c => c.cardId === cardId);
      if (!existingCard) return current;
      
      if (existingCard.quantity > 1) {
        return current.map(c => 
          c.cardId === cardId 
            ? { ...c, quantity: c.quantity - 1 }
            : c
        );
      } else {
        return current.filter(c => c.cardId !== cardId);
      }
    });
  };

  const totalCards = currentDeck.reduce((sum, card) => sum + card.quantity, 0);

  const filteredCards = userCards.filter((userCard: any) => {
    const matchesSearch = userCard.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || 
      (selectedType === "units" && !userCard.card.type.includes("Shipyard")) ||
      (selectedType === "shipyards" && userCard.card.type.includes("Shipyard"));
    return matchesSearch && matchesType;
  });

  const getDeckStats = () => {
    const units = currentDeck.filter(card => !card.card.type.includes("Shipyard"));
    const shipyards = currentDeck.filter(card => card.card.type.includes("Shipyard"));
    const avgCost = currentDeck.length > 0 
      ? (currentDeck.reduce((sum, card) => sum + (card.card.commandCost * card.quantity), 0) / totalCards).toFixed(1)
      : 0;
    
    return {
      totalUnits: units.reduce((sum, card) => sum + card.quantity, 0),
      totalShipyards: shipyards.reduce((sum, card) => sum + card.quantity, 0),
      avgCost
    };
  };

  const deckStats = getDeckStats();

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <Navigation />
      
      <main className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cosmic-gold mb-8 animate-glow">
          Deck Builder
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collection */}
          <div className="lg:col-span-2">
            <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
              <CardHeader>
                <CardTitle className="text-cosmic-gold">Your Collection</CardTitle>
                <div className="flex flex-wrap gap-4 items-center">
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-64 bg-space-black/30 border-cosmic-gold/30"
                  />
                  
                  <div className="flex gap-2">
                    {["all", "units", "shipyards"].map((type) => (
                      <Button
                        key={type}
                        variant={selectedType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType(type)}
                        className={selectedType === type 
                          ? "bg-cosmic-gold text-space-black" 
                          : "border-cosmic-gold/30 text-cosmic-gold hover:bg-cosmic-gold hover:text-space-black"
                        }
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCards.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-layer-group text-4xl text-cosmic-gold/30 mb-4"></i>
                    <p className="text-foreground/70">No cards found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {filteredCards.map((userCard: any) => (
                      <Card 
                        key={userCard.cardId}
                        className="bg-space-black/30 border-cosmic-gold/30 hover:border-cosmic-gold cursor-pointer transition-all duration-300 hover:scale-105"
                        onClick={() => addCardToDeck(userCard)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-[3/4] bg-cosmic-blue/20 rounded mb-2 flex items-center justify-center">
                            <i className="fas fa-rocket text-cosmic-gold"></i>
                          </div>
                          
                          <h3 className="font-semibold text-sm mb-1 truncate">
                            {userCard.card.name.replace(/_/g, ' ')}
                          </h3>
                          
                          <div className="flex justify-between text-xs text-foreground/70 mb-2">
                            <span>Cost: {userCard.card.commandCost}</span>
                            <span>Owned: {userCard.quantity}</span>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span>⚔️ {userCard.card.attack}</span>
                            <span>🛡️ {userCard.card.defense}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Deck Builder */}
          <div>
            <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
              <CardHeader>
                <CardTitle className="text-cosmic-gold">
                  Current Deck ({totalCards}/60)
                </CardTitle>
                <Input
                  placeholder="Deck name..."
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="bg-space-black/30 border-cosmic-gold/30"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Deck Stats */}
                  <div className="bg-space-black/30 p-3 rounded">
                    <h4 className="font-semibold text-cosmic-gold mb-2">Deck Stats</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Units:</span>
                        <span>{deckStats.totalUnits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipyards:</span>
                        <span>{deckStats.totalShipyards}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Cost:</span>
                        <span>{deckStats.avgCost}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Deck Cards */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {currentDeck.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-foreground/70 text-sm">
                          Click cards from your collection to add them to your deck
                        </p>
                      </div>
                    ) : (
                      currentDeck.map((deckCard) => (
                        <div 
                          key={deckCard.cardId} 
                          className="flex items-center justify-between bg-space-black/30 p-2 rounded"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {deckCard.card.name.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-foreground/70">
                              Cost: {deckCard.card.commandCost}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{deckCard.quantity}x</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeCardFromDeck(deckCard.cardId)}
                              className="h-6 w-6 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              −
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Button 
                    onClick={() => createDeckMutation.mutate()}
                    disabled={createDeckMutation.isPending || !deckName.trim() || totalCards < 20 || totalCards > 60}
                    className="w-full bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black"
                  >
                    {createDeckMutation.isPending ? "Creating..." : "Save Deck"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Decks */}
            <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 mt-6">
              <CardHeader>
                <CardTitle className="text-cosmic-gold">Your Decks</CardTitle>
              </CardHeader>
              <CardContent>
                {userDecks.length === 0 ? (
                  <p className="text-foreground/70 text-center py-4">
                    No decks created yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userDecks.map((deck: any) => (
                      <div 
                        key={deck.id} 
                        className="flex items-center justify-between bg-space-black/30 p-3 rounded"
                      >
                        <div>
                          <div className="font-semibold">
                            {deck.name}
                            {deck.isActive && (
                              <Badge className="ml-2 bg-green-600">Active</Badge>
                            )}
                          </div>
                          <div className="text-sm text-foreground/70">
                            {deck.cards.reduce((sum: number, card: any) => sum + card.quantity, 0)} cards
                          </div>
                        </div>
                        {!deck.isActive && (
                          <Button 
                            size="sm"
                            onClick={() => setActiveDeckMutation.mutate(deck.id)}
                            disabled={setActiveDeckMutation.isPending}
                            className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black"
                          >
                            Set Active
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import CardDisplay from "@/components/cards/CardDisplay";

interface DeckCard {
  cardId: number;
  quantity: number;
}

export default function DeckBuilder() {
  const { toast } = useToast();
  const [deckName, setDeckName] = useState("");
  const [currentDeck, setCurrentDeck] = useState<DeckCard[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: userCards, isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/cards/user"],
    retry: false,
  });

  const { data: decks, isLoading: decksLoading } = useQuery({
    queryKey: ["/api/decks"],
    retry: false,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; cards: DeckCard[] }) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Deck created successfully!",
      });
      setDeckName("");
      setCurrentDeck([]);
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

  const updateDeckMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; cards: DeckCard[] }) => {
      const response = await apiRequest("PUT", `/api/decks/${data.id}`, {
        name: data.name,
        cards: data.cards
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Deck updated successfully!",
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
        description: "Failed to update deck",
        variant: "destructive",
      });
    },
  });

  const activateDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      const response = await apiRequest("POST", `/api/decks/${deckId}/activate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Deck activated!",
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
        description: "Failed to activate deck",
        variant: "destructive",
      });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      const response = await apiRequest("DELETE", `/api/decks/${deckId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Deck deleted!",
      });
      if (selectedDeckId) {
        setSelectedDeckId(null);
        setCurrentDeck([]);
        setDeckName("");
      }
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
        description: "Failed to delete deck",
        variant: "destructive",
      });
    },
  });

  const addCardToDeck = (cardId: number) => {
    const existingCard = currentDeck.find(c => c.cardId === cardId);
    const userCard = userCards?.find((uc: any) => uc.cardId === cardId);
    
    if (!userCard) return;
    
    if (existingCard) {
      if (existingCard.quantity < userCard.quantity && existingCard.quantity < 3) {
        setCurrentDeck(currentDeck.map(c => 
          c.cardId === cardId ? { ...c, quantity: c.quantity + 1 } : c
        ));
      }
    } else {
      if (currentDeck.length < 60) {
        setCurrentDeck([...currentDeck, { cardId, quantity: 1 }]);
      }
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    const existingCard = currentDeck.find(c => c.cardId === cardId);
    if (existingCard) {
      if (existingCard.quantity > 1) {
        setCurrentDeck(currentDeck.map(c => 
          c.cardId === cardId ? { ...c, quantity: c.quantity - 1 } : c
        ));
      } else {
        setCurrentDeck(currentDeck.filter(c => c.cardId !== cardId));
      }
    }
  };

  const loadDeck = (deck: any) => {
    setSelectedDeckId(deck.id);
    setDeckName(deck.name);
    setCurrentDeck(deck.cards || []);
  };

  const saveDeck = () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive",
      });
      return;
    }

    if (currentDeck.length === 0) {
      toast({
        title: "Error",
        description: "Deck must contain at least one card",
        variant: "destructive",
      });
      return;
    }

    if (selectedDeckId) {
      updateDeckMutation.mutate({
        id: selectedDeckId,
        name: deckName,
        cards: currentDeck
      });
    } else {
      createDeckMutation.mutate({
        name: deckName,
        cards: currentDeck
      });
    }
  };

  const newDeck = () => {
    setSelectedDeckId(null);
    setDeckName("");
    setCurrentDeck([]);
  };

  const filteredCards = userCards?.filter((userCard: any) => 
    userCard.card.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalCards = currentDeck.reduce((sum, card) => sum + card.quantity, 0);
  const deckStats = currentDeck.reduce((stats, deckCard) => {
    const userCard = userCards?.find((uc: any) => uc.cardId === deckCard.cardId);
    if (userCard?.card) {
      const card = userCard.card;
      if (card.type.includes("Shipyard")) {
        stats.shipyards += deckCard.quantity;
      } else if (card.type.includes("Unit")) {
        stats.units += deckCard.quantity;
      } else {
        stats.commands += deckCard.quantity;
      }
      stats.totalCost += (card.commandCost || 0) * deckCard.quantity;
    }
    return stats;
  }, { units: 0, commands: 0, shipyards: 0, totalCost: 0 });

  const averageCost = totalCards > 0 ? (deckStats.totalCost / totalCards).toFixed(1) : "0";

  if (cardsLoading || decksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-cosmic-gold text-xl">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading deck builder...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cosmic-gold mb-4">
          <i className="fas fa-hammer mr-3"></i>
          Deck Builder
        </h1>
        <p className="text-cosmic-silver">
          Create and manage your battle decks. Combine cards strategically to dominate the battlefield.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Card Collection */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-600">
            <CardContent className="p-4">
              <Input
                type="text"
                placeholder="Search your cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
              />
            </CardContent>
          </Card>

          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCards.map((userCard: any) => {
              const inDeck = currentDeck.find(c => c.cardId === userCard.cardId);
              const canAdd = !inDeck || (inDeck.quantity < userCard.quantity && inDeck.quantity < 3);
              
              return (
                <div key={userCard.id} className="relative">
                  <div className={`cursor-pointer transition-all duration-200 ${
                    canAdd ? "hover:scale-105" : "opacity-50"
                  }`}>
                    <CardDisplay card={userCard.card} />
                    {canAdd && (
                      <Button
                        onClick={() => addCardToDeck(userCard.cardId)}
                        className="absolute bottom-2 left-2 right-2 bg-cosmic-gold text-cosmic-900 text-sm"
                        size="sm"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Add
                      </Button>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Badge className="bg-cosmic-gold text-cosmic-900">
                      {userCard.quantity}
                    </Badge>
                    {inDeck && (
                      <Badge className="bg-green-600 text-white">
                        {inDeck.quantity}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deck Management Sidebar */}
        <div className="space-y-6">
          {/* Deck Info */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold flex items-center">
                <i className="fas fa-layer-group mr-2"></i>
                Current Deck
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Deck name..."
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
              />
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-cosmic-gold">
                  {totalCards}/60
                </div>
                <div className="text-cosmic-silver text-sm">Cards</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Units:</span>
                  <span className="text-cosmic-gold">{deckStats.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Commands:</span>
                  <span className="text-cosmic-gold">{deckStats.commands}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Shipyards:</span>
                  <span className="text-cosmic-gold">{deckStats.shipyards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cosmic-silver">Avg. Cost:</span>
                  <span className="text-cosmic-gold">{averageCost}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={saveDeck}
                  disabled={createDeckMutation.isPending || updateDeckMutation.isPending}
                  className="w-full bg-cosmic-gold text-cosmic-900"
                >
                  {createDeckMutation.isPending || updateDeckMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {selectedDeckId ? "Update Deck" : "Save Deck"}
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={newDeck}
                  variant="outline"
                  className="w-full border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Deck
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Deck Cards */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-600">
            <CardHeader>
              <CardTitle className="text-cosmic-silver">Deck Cards</CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto space-y-2">
              {currentDeck.map((deckCard) => {
                const userCard = userCards?.find((uc: any) => uc.cardId === deckCard.cardId);
                if (!userCard) return null;
                
                return (
                  <div key={deckCard.cardId} className="flex items-center justify-between p-2 bg-cosmic-700/30 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-12 bg-cosmic-600 rounded flex-shrink-0"></div>
                      <div>
                        <div className="text-cosmic-silver text-sm font-medium">
                          {userCard.card.name}
                        </div>
                        <div className="text-cosmic-silver/70 text-xs">
                          Cost: {userCard.card.commandCost || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-cosmic-gold text-sm">{deckCard.quantity}x</span>
                      <Button
                        onClick={() => removeCardFromDeck(deckCard.cardId)}
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0"
                      >
                        <i className="fas fa-minus text-xs"></i>
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {currentDeck.length === 0 && (
                <div className="text-center py-8 text-cosmic-silver/70">
                  <i className="fas fa-layer-group text-2xl mb-2"></i>
                  <p>No cards in deck</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Decks */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-600">
            <CardHeader>
              <CardTitle className="text-cosmic-silver">Saved Decks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {decks?.map((deck: any) => (
                <div key={deck.id} className="flex items-center justify-between p-2 bg-cosmic-700/30 rounded">
                  <div className="flex-1">
                    <div className="text-cosmic-silver text-sm font-medium">
                      {deck.name}
                      {deck.isActive && (
                        <Badge className="ml-2 bg-green-600 text-white text-xs">Active</Badge>
                      )}
                    </div>
                    <div className="text-cosmic-silver/70 text-xs">
                      {deck.cards?.reduce((sum: number, c: any) => sum + c.quantity, 0) || 0} cards
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => loadDeck(deck)}
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </Button>
                    {!deck.isActive && (
                      <Button
                        onClick={() => activateDeckMutation.mutate(deck.id)}
                        size="sm"
                        className="h-6 px-2 bg-green-600 hover:bg-green-700"
                      >
                        <i className="fas fa-check text-xs"></i>
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteDeckMutation.mutate(deck.id)}
                      size="sm"
                      variant="destructive"
                      className="h-6 px-2"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!decks || decks.length === 0) && (
                <div className="text-center py-4 text-cosmic-silver/70">
                  <i className="fas fa-layer-group text-xl mb-2"></i>
                  <p className="text-sm">No saved decks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

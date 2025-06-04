import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import StarBackground from "@/components/ui/star-background";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface DeckCard {
  cardId: number;
  quantity: number;
}

export default function DeckBuilder() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [newDeckName, setNewDeckName] = useState("");
  const [showNewDeckDialog, setShowNewDeckDialog] = useState(false);

  const { data: userDecks = [], error: decksError } = useQuery({
    queryKey: ["/api/decks"],
    retry: false,
  });

  const { data: userCards = [], error: cardsError } = useQuery({
    queryKey: ["/api/collection"],
    retry: false,
  });

  const { data: allCards = [], error: allCardsError } = useQuery({
    queryKey: ["/api/cards"],
    retry: false,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; cardList: DeckCard[] }) => {
      return await apiRequest('POST', '/api/decks', deckData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
      toast({
        title: "Success",
        description: "Deck created successfully!",
      });
      setShowNewDeckDialog(false);
      setNewDeckName("");
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
        description: "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ deckId, cardList }: { deckId: number; cardList: DeckCard[] }) => {
      return await apiRequest('PUT', `/api/decks/${deckId}`, { cardList });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
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
        description: "Failed to update deck. Please try again.",
        variant: "destructive",
      });
    },
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
    const error = decksError || cardsError || allCardsError;
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
  }, [decksError, cardsError, allCardsError, toast]);

  // Load selected deck
  useEffect(() => {
    if (selectedDeck) {
      setDeckCards(selectedDeck.cardList || []);
    }
  }, [selectedDeck]);

  if (isLoading || !user) return null;

  // Create a map of owned cards with quantities
  const ownedCardsMap = userCards.reduce((acc: Record<number, number>, userCard: any) => {
    acc[userCard.cardId] = userCard.quantity;
    return acc;
  }, {});

  // Filter available cards
  const availableCards = allCards.filter((card: any) => {
    const isOwned = ownedCardsMap[card.id] > 0;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "units" && card.type === "Unit") ||
                         (filterType === "commands" && card.type === "Command") ||
                         (filterType === "shipyards" && card.type === "Shipyard");
    return isOwned && matchesSearch && matchesFilter;
  });

  const addCardToDeck = (cardId: number) => {
    const existingCard = deckCards.find(dc => dc.cardId === cardId);
    const ownedQuantity = ownedCardsMap[cardId] || 0;
    
    if (existingCard) {
      if (existingCard.quantity < ownedQuantity && existingCard.quantity < 3) {
        setDeckCards(prev => prev.map(dc => 
          dc.cardId === cardId 
            ? { ...dc, quantity: dc.quantity + 1 }
            : dc
        ));
      }
    } else {
      setDeckCards(prev => [...prev, { cardId, quantity: 1 }]);
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    setDeckCards(prev => {
      const updated = prev.map(dc => 
        dc.cardId === cardId 
          ? { ...dc, quantity: dc.quantity - 1 }
          : dc
      ).filter(dc => dc.quantity > 0);
      return updated;
    });
  };

  const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

  const saveDeck = () => {
    if (!selectedDeck) return;
    updateDeckMutation.mutate({ deckId: selectedDeck.id, cardList: deckCards });
  };

  const createNewDeck = () => {
    if (!newDeckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name.",
        variant: "destructive",
      });
      return;
    }
    createDeckMutation.mutate({ name: newDeckName, cardList: [] });
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
                <i className="fas fa-hammer text-cosmic-gold text-xl"></i>
                <span className="text-xl font-bold text-cosmic-gold">Deck Builder</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-cosmic-silver">
                Deck Size: <span className="text-cosmic-gold font-semibold">{totalCards}</span>/60
              </div>
              {selectedDeck && (
                <Button 
                  onClick={saveDeck}
                  disabled={updateDeckMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updateDeckMutation.isPending ? "Saving..." : "Save Deck"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Card Collection */}
        <div className="w-2/3 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
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
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                  <SelectItem value="commands">Commands</SelectItem>
                  <SelectItem value="shipyards">Shipyards</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {availableCards.map((card: any) => {
              const inDeck = deckCards.find(dc => dc.cardId === card.id);
              const ownedQuantity = ownedCardsMap[card.id] || 0;
              
              return (
                <Card 
                  key={card.id}
                  className="bg-cosmic-800 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 cursor-pointer group"
                  onClick={() => addCardToDeck(card.id)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-[3/4] bg-cosmic-700 rounded-lg mb-2 overflow-hidden relative">
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
                      
                      {/* Quantity indicators */}
                      <div className="absolute top-1 right-1 space-y-1">
                        <div className="bg-cosmic-900/80 text-cosmic-silver text-xs px-1 rounded">
                          Own: {ownedQuantity}
                        </div>
                        {inDeck && (
                          <div className="bg-cosmic-gold text-cosmic-900 text-xs px-1 rounded">
                            In Deck: {inDeck.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-cosmic-gold truncate">
                        {card.name}
                      </h3>
                      <div className="text-xs text-cosmic-silver">{card.type}</div>
                      <div className="text-xs text-amber-400">Cost: {card.commandCost}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Current Deck */}
        <div className="w-1/3 bg-cosmic-800/50 border-l border-cosmic-600 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-cosmic-gold">Current Deck</h3>
              <Dialog open={showNewDeckDialog} onOpenChange={setShowNewDeckDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-cosmic-gold text-cosmic-900 hover:bg-cosmic-gold-dark">
                    <i className="fas fa-plus mr-2"></i>New
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-cosmic-800 border-cosmic-600">
                  <DialogHeader>
                    <DialogTitle className="text-cosmic-gold">Create New Deck</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Deck name..."
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                    />
                    <Button 
                      onClick={createNewDeck}
                      disabled={createDeckMutation.isPending}
                      className="w-full bg-cosmic-gold text-cosmic-900 hover:bg-cosmic-gold-dark"
                    >
                      {createDeckMutation.isPending ? "Creating..." : "Create Deck"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Select 
              value={selectedDeck?.id?.toString() || ""} 
              onValueChange={(value) => {
                const deck = userDecks.find((d: any) => d.id.toString() === value);
                setSelectedDeck(deck);
              }}
            >
              <SelectTrigger className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver">
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-800 border-cosmic-600">
                {userDecks.map((deck: any) => (
                  <SelectItem key={deck.id} value={deck.id.toString()}>
                    {deck.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDeck && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {deckCards.map((deckCard) => {
                const card = allCards.find((c: any) => c.id === deckCard.cardId);
                if (!card) return null;
                
                return (
                  <Card key={deckCard.cardId} className="bg-cosmic-700 border-cosmic-600">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-16 bg-cosmic-600 rounded overflow-hidden">
                            {card.imageUrl ? (
                              <img 
                                src={card.imageUrl} 
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="fas fa-image text-cosmic-500 text-sm"></i>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-cosmic-gold">{card.name}</div>
                            <div className="text-xs text-cosmic-silver">Cost: {card.commandCost}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-cosmic-silver text-sm">{deckCard.quantity}x</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCardFromDeck(deckCard.cardId)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {deckCards.length === 0 && (
                <div className="text-center py-8 text-cosmic-silver/50">
                  <i className="fas fa-layer-group text-3xl mb-2"></i>
                  <p>No cards in deck</p>
                  <p className="text-sm">Add cards from your collection</p>
                </div>
              )}
            </div>
          )}

          {!selectedDeck && (
            <div className="text-center py-8 text-cosmic-silver/50">
              <i className="fas fa-plus-circle text-3xl mb-2"></i>
              <p>Select or create a deck to start building</p>
            </div>
          )}

          {selectedDeck && (
            <div className="mt-6 pt-4 border-t border-cosmic-600">
              <div className="text-cosmic-silver text-sm mb-2">Deck Statistics</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Total Cards:</span>
                  <span className="text-cosmic-gold">{totalCards}</span>
                </div>
                <div className="flex justify-between">
                  <span>Units:</span>
                  <span className="text-cosmic-gold">
                    {deckCards.filter(dc => {
                      const card = allCards.find((c: any) => c.id === dc.cardId);
                      return card?.type === "Unit";
                    }).reduce((sum, dc) => sum + dc.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Commands:</span>
                  <span className="text-cosmic-gold">
                    {deckCards.filter(dc => {
                      const card = allCards.find((c: any) => c.id === dc.cardId);
                      return card?.type === "Command";
                    }).reduce((sum, dc) => sum + dc.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipyards:</span>
                  <span className="text-cosmic-gold">
                    {deckCards.filter(dc => {
                      const card = allCards.find((c: any) => c.id === dc.cardId);
                      return card?.type === "Shipyard";
                    }).reduce((sum, dc) => sum + dc.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

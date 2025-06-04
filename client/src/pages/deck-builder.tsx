import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeckCard {
  cardId: number;
  quantity: number;
}

export default function DeckBuilder() {
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [deckName, setDeckName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userCards } = useQuery({
    queryKey: ["/api/user/cards"],
  });

  const { data: userDecks } = useQuery({
    queryKey: ["/api/user/decks"],
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; cards: DeckCard[] }) => {
      const response = await apiRequest("POST", "/api/user/decks", deckData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck Created!",
        description: "Your new deck has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/decks"] });
      setIsCreateModalOpen(false);
      setDeckName("");
      setDeckCards([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create deck",
        variant: "destructive",
      });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, deckData }: { id: number; deckData: any }) => {
      const response = await apiRequest("PUT", `/api/user/decks/${id}`, deckData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck Updated!",
        description: "Your deck has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/decks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update deck",
        variant: "destructive",
      });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      await apiRequest("DELETE", `/api/user/decks/${deckId}`);
    },
    onSuccess: () => {
      toast({
        title: "Deck Deleted",
        description: "Your deck has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/decks"] });
      setSelectedDeck(null);
      setDeckCards([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete deck",
        variant: "destructive",
      });
    },
  });

  const activateDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      await apiRequest("POST", `/api/user/decks/${deckId}/activate`);
    },
    onSuccess: () => {
      toast({
        title: "Deck Activated!",
        description: "This deck is now your active deck for battles",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/decks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate deck",
        variant: "destructive",
      });
    },
  });

  const filteredCards = userCards?.filter((userCard: any) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || card.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  }) || [];

  const addCardToDeck = (cardId: number) => {
    const existingCard = deckCards.find(dc => dc.cardId === cardId);
    if (existingCard) {
      if (existingCard.quantity < 3) { // Max 3 copies per card
        setDeckCards(deckCards.map(dc => 
          dc.cardId === cardId ? { ...dc, quantity: dc.quantity + 1 } : dc
        ));
      } else {
        toast({
          title: "Limit Reached",
          description: "You can only have 3 copies of each card in a deck",
          variant: "destructive",
        });
      }
    } else {
      setDeckCards([...deckCards, { cardId, quantity: 1 }]);
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    const existingCard = deckCards.find(dc => dc.cardId === cardId);
    if (existingCard) {
      if (existingCard.quantity > 1) {
        setDeckCards(deckCards.map(dc => 
          dc.cardId === cardId ? { ...dc, quantity: dc.quantity - 1 } : dc
        ));
      } else {
        setDeckCards(deckCards.filter(dc => dc.cardId !== cardId));
      }
    }
  };

  const loadDeck = (deck: any) => {
    setSelectedDeck(deck);
    setDeckCards(deck.cards || []);
    setDeckName(deck.name);
  };

  const saveDeck = () => {
    if (selectedDeck) {
      updateDeckMutation.mutate({
        id: selectedDeck.id,
        deckData: { cards: deckCards }
      });
    }
  };

  const createNewDeck = () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive",
      });
      return;
    }

    if (deckCards.length === 0) {
      toast({
        title: "Error",
        description: "Please add some cards to your deck",
        variant: "destructive",
      });
      return;
    }

    createDeckMutation.mutate({ name: deckName, cards: deckCards });
  };

  const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common": return "bg-gray-500";
      case "uncommon": return "bg-green-500";
      case "rare": return "bg-blue-500";
      case "legendary": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cosmic-gold mb-4">
          <i className="fas fa-layer-group mr-3"></i>
          Deck Builder
        </h1>
        <p className="text-cosmic-silver">
          Create and manage your battle decks for the ultimate strategic advantage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deck Management Panel */}
        <div className="space-y-6">
          {/* Current Deck Info */}
          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-cosmic-gold">
                  {selectedDeck ? selectedDeck.name : "New Deck"}
                </h3>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-cosmic-gold text-cosmic-900 hover:bg-cosmic-gold-dark">
                      <i className="fas fa-plus mr-2"></i>
                      New Deck
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-cosmic-800 border-cosmic-600">
                    <DialogHeader>
                      <DialogTitle className="text-cosmic-gold">Create New Deck</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Deck name..."
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                      />
                      <Button
                        onClick={createNewDeck}
                        disabled={createDeckMutation.isPending}
                        className="w-full bg-cosmic-gold text-cosmic-900 hover:bg-cosmic-gold-dark"
                      >
                        Create Deck
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-cosmic-silver">Total Cards:</span>
                  <span className="text-cosmic-gold font-semibold">{totalCards}/60</span>
                </div>
                
                {selectedDeck && (
                  <div className="space-y-2">
                    <Button
                      onClick={saveDeck}
                      disabled={updateDeckMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <i className="fas fa-save mr-2"></i>
                      Save Deck
                    </Button>
                    <Button
                      onClick={() => activateDeckMutation.mutate(selectedDeck.id)}
                      disabled={activateDeckMutation.isPending || selectedDeck.isActive}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      <i className="fas fa-check mr-2"></i>
                      {selectedDeck.isActive ? "Active Deck" : "Set as Active"}
                    </Button>
                    <Button
                      onClick={() => deleteDeckMutation.mutate(selectedDeck.id)}
                      disabled={deleteDeckMutation.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete Deck
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saved Decks */}
          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-cosmic-gold mb-4">Your Decks</h3>
              <div className="space-y-2">
                {userDecks?.map((deck: any) => (
                  <div
                    key={deck.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedDeck?.id === deck.id 
                        ? "bg-cosmic-gold/20 border border-cosmic-gold" 
                        : "bg-cosmic-700/50 hover:bg-cosmic-700"
                    }`}
                    onClick={() => loadDeck(deck)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-cosmic-silver">{deck.name}</div>
                        <div className="text-sm text-cosmic-silver/70">
                          {deck.cards?.reduce((sum: number, dc: any) => sum + dc.quantity, 0) || 0} cards
                        </div>
                      </div>
                      {deck.isActive && (
                        <Badge className="bg-green-600 text-white">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {!userDecks?.length && (
                  <p className="text-cosmic-silver/70 text-center py-4">
                    No decks created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Deck Cards */}
          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-cosmic-gold mb-4">Deck Cards</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {deckCards.map((deckCard) => {
                  const userCard = userCards?.find((uc: any) => uc.card.id === deckCard.cardId);
                  const card = userCard?.card;
                  if (!card) return null;

                  return (
                    <div key={deckCard.cardId} className="flex items-center justify-between bg-cosmic-700/50 p-2 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-10 bg-cosmic-600 rounded flex items-center justify-center">
                          <i className="fas fa-rocket text-cosmic-gold text-xs"></i>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-cosmic-silver">{card.name}</div>
                          <div className="text-xs text-cosmic-silver/70">Cost: {card.cost}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-cosmic-gold font-semibold">{deckCard.quantity}x</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCardFromDeck(deckCard.cardId)}
                          className="border-cosmic-600 text-cosmic-silver hover:bg-cosmic-600"
                        >
                          <i className="fas fa-minus text-xs"></i>
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {deckCards.length === 0 && (
                  <p className="text-cosmic-silver/70 text-center py-4">
                    No cards in deck
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Collection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card className="bg-cosmic-800/50 border-cosmic-600">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedType === "all" ? "default" : "outline"}
                    onClick={() => setSelectedType("all")}
                    className={selectedType === "all" ? "bg-cosmic-gold text-cosmic-900" : "border-cosmic-600 text-cosmic-silver"}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedType === "unit" ? "default" : "outline"}
                    onClick={() => setSelectedType("unit")}
                    className={selectedType === "unit" ? "bg-cosmic-gold text-cosmic-900" : "border-cosmic-600 text-cosmic-silver"}
                  >
                    Units
                  </Button>
                  <Button
                    variant={selectedType === "command" ? "default" : "outline"}
                    onClick={() => setSelectedType("command")}
                    className={selectedType === "command" ? "bg-cosmic-gold text-cosmic-900" : "border-cosmic-600 text-cosmic-silver"}
                  >
                    Commands
                  </Button>
                  <Button
                    variant={selectedType === "shipyard" ? "default" : "outline"}
                    onClick={() => setSelectedType("shipyard")}
                    className={selectedType === "shipyard" ? "bg-cosmic-gold text-cosmic-900" : "border-cosmic-600 text-cosmic-silver"}
                  >
                    Shipyards
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((userCard: any) => {
              const card = userCard.card;
              const inDeck = deckCards.find(dc => dc.cardId === card.id)?.quantity || 0;
              
              return (
                <Card 
                  key={card.id} 
                  className="bg-cosmic-800 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 cursor-pointer group"
                  onClick={() => addCardToDeck(card.id)}
                >
                  <CardContent className="p-2">
                    <div className="relative mb-2">
                      <div className="w-full aspect-[3/4] bg-cosmic-700 rounded border border-cosmic-600 flex items-center justify-center">
                        {card.imageUrl ? (
                          <img 
                            src={card.imageUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <i className="fas fa-rocket text-cosmic-gold text-lg"></i>
                        )}
                      </div>
                      <div className="absolute top-1 right-1">
                        <Badge className={`${getRarityColor(card.rarity)} text-white text-xs`}>
                          {card.rarity[0]}
                        </Badge>
                      </div>
                      {inDeck > 0 && (
                        <div className="absolute bottom-1 right-1 bg-cosmic-gold text-cosmic-900 text-xs font-bold px-1 py-0.5 rounded">
                          {inDeck}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-cosmic-gold text-xs truncate">{card.name}</h3>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-cosmic-silver truncate">{card.type}</span>
                        <span className="text-cosmic-gold">{card.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <Card className="bg-cosmic-800/50 border-cosmic-600">
              <CardContent className="p-12 text-center">
                <i className="fas fa-layer-group text-cosmic-600 text-6xl mb-4"></i>
                <h3 className="text-xl font-bold text-cosmic-silver mb-2">No Cards Found</h3>
                <p className="text-cosmic-silver/70">
                  Try adjusting your search filters or add more cards to your collection
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

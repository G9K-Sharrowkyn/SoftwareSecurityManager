import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CardComponent from "@/components/CardComponent";
import StarBackground from "@/components/StarBackground";
import type { Card as GameCard, UserCard, Deck, DeckCard } from "@shared/schema";

export default function DeckBuilder() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<(DeckCard & { card: GameCard })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");

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

  // Fetch user's decks
  const { data: decks = [] } = useQuery({
    queryKey: ["/api/decks"],
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Fetch user's collection
  const { data: userCards = [] } = useQuery({
    queryKey: ["/api/collection"],
    enabled: isAuthenticated,
  });

  // Fetch selected deck details
  const { data: deckWithCards } = useQuery({
    queryKey: [`/api/decks/${selectedDeck?.id}`],
    enabled: !!selectedDeck?.id,
  });

  // Update deck cards when deck is loaded
  useEffect(() => {
    if (deckWithCards) {
      setDeckCards(deckWithCards.deckCards || []);
    }
  }, [deckWithCards]);

  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: (newDeck: Deck) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSelectedDeck(newDeck);
      setIsCreatingDeck(false);
      setNewDeckName("");
      setNewDeckDescription("");
      toast({
        title: "Deck Created",
        description: `${newDeck.name} has been created successfully!`,
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
        description: "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add card to deck mutation
  const addCardToDeckMutation = useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: number; cardId: number }) => {
      const response = await apiRequest("POST", `/api/decks/${deckId}/cards`, { cardId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${selectedDeck?.id}`] });
      toast({
        title: "Card Added",
        description: "Card has been added to your deck!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add card to deck.",
        variant: "destructive",
      });
    },
  });

  // Remove card from deck mutation
  const removeCardFromDeckMutation = useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: number; cardId: number }) => {
      await apiRequest("DELETE", `/api/decks/${deckId}/cards/${cardId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${selectedDeck?.id}`] });
      toast({
        title: "Card Removed",
        description: "Card has been removed from your deck!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove card from deck.",
        variant: "destructive",
      });
    },
  });

  // Activate deck mutation
  const activateDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      await apiRequest("POST", `/api/decks/${deckId}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Deck Activated",
        description: "This deck is now your active deck for battles!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to activate deck.",
        variant: "destructive",
      });
    },
  });

  // Filter available cards
  const filteredCards = userCards.filter((userCard: UserCard & { card: GameCard }) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || card.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Calculate deck stats
  const deckSize = deckCards.reduce((total, deckCard) => total + deckCard.quantity, 0);
  const unitCards = deckCards.filter(dc => dc.card.type === "Unit").length;
  const commandCards = deckCards.filter(dc => dc.card.type === "Command").length;
  const shipyardCards = deckCards.filter(dc => dc.card.type === "Shipyard").length;
  const averageCost = deckCards.length > 0 
    ? (deckCards.reduce((total, dc) => total + (dc.card.cost * dc.quantity), 0) / deckSize).toFixed(1)
    : "0";

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name.",
        variant: "destructive",
      });
      return;
    }
    
    createDeckMutation.mutate({
      name: newDeckName.trim(),
      description: newDeckDescription.trim(),
    });
  };

  const handleAddCardToDeck = (cardId: number) => {
    if (!selectedDeck) {
      toast({
        title: "Error",
        description: "Please select a deck first.",
        variant: "destructive",
      });
      return;
    }

    addCardToDeckMutation.mutate({ deckId: selectedDeck.id, cardId });
  };

  const handleRemoveCardFromDeck = (cardId: number) => {
    if (!selectedDeck) return;
    
    removeCardFromDeckMutation.mutate({ deckId: selectedDeck.id, cardId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <StarBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gray-900/90 backdrop-blur-sm border-b border-yellow-500/30 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/"}
                className="text-yellow-400 hover:bg-yellow-400/10"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Game
              </Button>
              <h1 className="text-2xl font-bold text-yellow-400">Deck Builder</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedDeck && (
                <div className="text-sm text-gray-300">
                  Deck Size: <span className="text-yellow-400 font-semibold">{deckSize}</span>/60
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Deck List Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-900/50 border-yellow-500/30 h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-yellow-400">Your Decks</CardTitle>
                    <Dialog open={isCreatingDeck} onOpenChange={setIsCreatingDeck}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black">
                          <i className="fas fa-plus mr-1"></i>
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-yellow-500/30">
                        <DialogHeader>
                          <DialogTitle className="text-yellow-400">Create New Deck</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-300">Deck Name</label>
                            <Input
                              value={newDeckName}
                              onChange={(e) => setNewDeckName(e.target.value)}
                              placeholder="Enter deck name"
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-300">Description (Optional)</label>
                            <Textarea
                              value={newDeckDescription}
                              onChange={(e) => setNewDeckDescription(e.target.value)}
                              placeholder="Enter deck description"
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <Button
                            onClick={handleCreateDeck}
                            disabled={createDeckMutation.isPending}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                          >
                            Create Deck
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {decks.map((deck: Deck) => (
                      <div
                        key={deck.id}
                        onClick={() => setSelectedDeck(deck)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedDeck?.id === deck.id
                            ? "bg-yellow-400/20 border border-yellow-400"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{deck.name}</div>
                            {deck.isActive && (
                              <div className="text-xs text-green-400">Active Deck</div>
                            )}
                          </div>
                          {selectedDeck?.id === deck.id && !deck.isActive && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                activateDeckMutation.mutate(deck.id);
                              }}
                              disabled={activateDeckMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {decks.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <i className="fas fa-layer-group text-4xl mb-4"></i>
                        <div>No decks yet</div>
                        <div className="text-sm">Create your first deck!</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Deck Stats */}
              {selectedDeck && (
                <Card className="bg-gray-900/50 border-yellow-500/30 mt-4">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 text-sm">Deck Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Cards:</span>
                        <span className="text-yellow-400">{deckSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Units:</span>
                        <span className="text-blue-400">{unitCards}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Commands:</span>
                        <span className="text-green-400">{commandCards}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Shipyards:</span>
                        <span className="text-purple-400">{shipyardCards}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Avg. Cost:</span>
                        <span className="text-yellow-400">{averageCost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Current Deck Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-900/50 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-400">
                    {selectedDeck ? selectedDeck.name : "Select a Deck"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDeck ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {deckCards.map((deckCard) => (
                        <div
                          key={deckCard.id}
                          className="flex items-center justify-between bg-gray-800 rounded-lg p-2"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden">
                              <CardComponent card={deckCard.card} showDetails={false} compact />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {deckCard.card.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {deckCard.card.type} • Cost: {deckCard.card.cost}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-400 font-semibold">
                              {deckCard.quantity}x
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveCardFromDeck(deckCard.cardId)}
                              disabled={removeCardFromDeckMutation.isPending}
                              className="w-6 h-6 p-0"
                            >
                              <i className="fas fa-times text-xs"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {deckCards.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          <i className="fas fa-inbox text-4xl mb-4"></i>
                          <div>Empty Deck</div>
                          <div className="text-sm">Add cards from your collection</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-12">
                      <i className="fas fa-layer-group text-6xl mb-4"></i>
                      <div>Select a deck to start building</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Collection Panel */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900/50 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Your Collection</CardTitle>
                  <div className="flex gap-4 items-center">
                    <Input
                      placeholder="Search cards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="Unit">Units</SelectItem>
                        <SelectItem value="Command">Commands</SelectItem>
                        <SelectItem value="Shipyard">Shipyards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredCards.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                      {filteredCards.map((userCard: UserCard & { card: GameCard }) => (
                        <div key={`${userCard.cardId}-${userCard.id}`} className="relative">
                          <div
                            onClick={() => handleAddCardToDeck(userCard.cardId)}
                            className="cursor-pointer hover:scale-105 transition-transform"
                          >
                            <CardComponent card={userCard.card} compact />
                          </div>
                          {userCard.quantity > 1 && (
                            <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {userCard.quantity}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-12">
                      <i className="fas fa-search text-6xl mb-4"></i>
                      <div>No cards found</div>
                      <div className="text-sm">Try adjusting your search filters</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

interface Deck {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

interface DeckCard {
  id: number;
  quantity: number;
  card: Card;
}

interface DeckWithCards extends Deck {
  deckCards: DeckCard[];
}

export default function DeckBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: decks, isLoading: decksLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    retry: false,
  });

  const { data: collection } = useQuery<UserCard[]>({
    queryKey: ["/api/collection"],
    retry: false,
  });

  const { data: currentDeck, isLoading: deckLoading } = useQuery<DeckWithCards>({
    queryKey: ["/api/decks", selectedDeck],
    enabled: !!selectedDeck,
    retry: false,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSelectedDeck(deck.id);
      setIsCreateDialogOpen(false);
      setNewDeckName("");
      setNewDeckDescription("");
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

  const addCardToDeckMutation = useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: number; cardId: number }) => {
      const response = await apiRequest("POST", `/api/decks/${deckId}/cards`, { cardId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", selectedDeck] });
      toast({
        title: "Success",
        description: "Card added to deck!",
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
        description: "Failed to add card to deck",
        variant: "destructive",
      });
    },
  });

  const removeCardFromDeckMutation = useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: number; cardId: number }) => {
      const response = await apiRequest("DELETE", `/api/decks/${deckId}/cards/${cardId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", selectedDeck] });
      toast({
        title: "Success",
        description: "Card removed from deck!",
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
        description: "Failed to remove card from deck",
        variant: "destructive",
      });
    },
  });

  const filteredCollection = collection?.filter(userCard => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || card.type.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesType;
  }) || [];

  const deckStats = currentDeck ? {
    totalCards: currentDeck.deckCards.reduce((sum, deckCard) => sum + deckCard.quantity, 0),
    units: currentDeck.deckCards.filter(dc => dc.card.type === 'Unit').reduce((sum, dc) => sum + dc.quantity, 0),
    commands: currentDeck.deckCards.filter(dc => dc.card.type === 'Command').reduce((sum, dc) => sum + dc.quantity, 0),
    shipyards: currentDeck.deckCards.filter(dc => dc.card.type === 'Shipyard').reduce((sum, dc) => sum + dc.quantity, 0),
    avgCost: currentDeck.deckCards.length > 0 
      ? (currentDeck.deckCards.reduce((sum, dc) => sum + (dc.card.commandCost * dc.quantity), 0) / 
         currentDeck.deckCards.reduce((sum, dc) => sum + dc.quantity, 0)).toFixed(1)
      : 0
  } : null;

  const addCardToDeck = (cardId: number) => {
    if (!selectedDeck) {
      toast({
        title: "No Deck Selected",
        description: "Please select a deck first",
        variant: "destructive",
      });
      return;
    }

    if (deckStats && deckStats.totalCards >= 60) {
      toast({
        title: "Deck Full",
        description: "Maximum deck size is 60 cards",
        variant: "destructive",
      });
      return;
    }

    addCardToDeckMutation.mutate({ deckId: selectedDeck, cardId });
  };

  const removeCardFromDeck = (cardId: number) => {
    if (!selectedDeck) return;
    removeCardFromDeckMutation.mutate({ deckId: selectedDeck, cardId });
  };

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
              <Link href="/collection" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-layer-group mr-2"></i>Collection
              </Link>
              <span className="text-cosmic-gold font-medium">
                <i className="fas fa-hammer mr-2"></i>Deck Builder
              </span>
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

      <main className="relative z-10 min-h-screen">
        <div className="flex h-screen pt-16">
          {/* Deck List Sidebar */}
          <div className="w-80 bg-cosmic-800/90 backdrop-blur-md border-r border-cosmic-600 p-4 overflow-y-auto">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-cosmic-gold">Your Decks</h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-cosmic-gold text-cosmic-900">
                      <i className="fas fa-plus mr-2"></i>New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-cosmic-800 border-cosmic-600">
                    <DialogHeader>
                      <DialogTitle className="text-cosmic-gold">Create New Deck</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-cosmic-silver mb-2">Deck Name</label>
                        <Input
                          value={newDeckName}
                          onChange={(e) => setNewDeckName(e.target.value)}
                          placeholder="Enter deck name..."
                          className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cosmic-silver mb-2">Description</label>
                        <Input
                          value={newDeckDescription}
                          onChange={(e) => setNewDeckDescription(e.target.value)}
                          placeholder="Enter deck description..."
                          className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                        />
                      </div>
                      <Button
                        onClick={() => createDeckMutation.mutate({ name: newDeckName, description: newDeckDescription })}
                        disabled={!newDeckName || createDeckMutation.isPending}
                        className="w-full bg-cosmic-gold text-cosmic-900"
                      >
                        {createDeckMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>Creating...
                          </>
                        ) : (
                          "Create Deck"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {decksLoading ? (
                <div className="flex justify-center">
                  <i className="fas fa-spinner fa-spin text-cosmic-gold"></i>
                </div>
              ) : decks?.length === 0 ? (
                <p className="text-cosmic-silver text-center">No decks yet. Create your first deck!</p>
              ) : (
                <div className="space-y-2">
                  {decks?.map(deck => (
                    <Card
                      key={deck.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedDeck === deck.id
                          ? 'bg-cosmic-gold/20 border-cosmic-gold'
                          : 'bg-cosmic-700/50 border-cosmic-600 hover:border-cosmic-gold'
                      }`}
                      onClick={() => setSelectedDeck(deck.id)}
                    >
                      <CardContent className="p-3">
                        <div className="font-semibold text-cosmic-gold">{deck.name}</div>
                        <div className="text-sm text-cosmic-silver">{deck.description}</div>
                        {deck.isActive && (
                          <div className="text-xs text-green-400 mt-1">Active Deck</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Collection */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-cosmic-gold mb-4">Card Collection</h2>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-cosmic-700 border-cosmic-600 text-cosmic-silver"
                  />
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

                {/* Card Grid */}
                {filteredCollection.length === 0 ? (
                  <div className="text-center text-cosmic-silver">
                    No cards match your search criteria
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredCollection.map(userCard => (
                      <div key={userCard.id} className="relative">
                        <CardComponent
                          card={userCard.card}
                          quantity={userCard.quantity}
                          showQuantity
                          interactive
                          onClick={() => addCardToDeck(userCard.card.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Current Deck */}
            <div className="w-80 bg-cosmic-800/90 backdrop-blur-md border-l border-cosmic-600 p-4 overflow-y-auto">
              <h2 className="text-xl font-bold text-cosmic-gold mb-4">Current Deck</h2>
              
              {!selectedDeck ? (
                <div className="text-center text-cosmic-silver">
                  Select a deck to view its contents
                </div>
              ) : deckLoading ? (
                <div className="flex justify-center">
                  <i className="fas fa-spinner fa-spin text-cosmic-gold"></i>
                </div>
              ) : currentDeck ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-bold text-cosmic-gold">{currentDeck.name}</h3>
                    <p className="text-sm text-cosmic-silver">{currentDeck.description}</p>
                  </div>

                  {/* Deck Stats */}
                  {deckStats && (
                    <Card className="bg-cosmic-700/50 border-cosmic-600 mb-4">
                      <CardContent className="p-3">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-cosmic-silver">Total Cards:</span>
                            <span className="text-cosmic-gold">{deckStats.totalCards}/60</span>
                          </div>
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
                            <span className="text-cosmic-gold">{deckStats.avgCost}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Deck Cards */}
                  <div className="space-y-2">
                    {currentDeck.deckCards.length === 0 ? (
                      <div className="text-center text-cosmic-silver text-sm">
                        This deck is empty. Add cards from your collection.
                      </div>
                    ) : (
                      currentDeck.deckCards.map(deckCard => (
                        <Card key={deckCard.id} className="bg-cosmic-700/50 border-cosmic-600">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-cosmic-gold text-sm">
                                  {deckCard.card.name}
                                </div>
                                <div className="text-xs text-cosmic-silver">
                                  Cost: {deckCard.card.commandCost}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-cosmic-silver text-sm">{deckCard.quantity}x</span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeCardFromDeck(deckCard.card.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-cosmic-silver">
                  Failed to load deck
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

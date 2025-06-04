import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import StarBackground from "@/components/StarBackground";
import CardComponent from "@/components/CardComponent";
import { Link } from "wouter";

export default function DeckBuilder() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Redirect to login if not authenticated
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

  const { data: decks, error: decksError } = useQuery({
    queryKey: ['/api/decks'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: collection, error: collectionError } = useQuery({
    queryKey: ['/api/collection'],
    enabled: isAuthenticated,
    retry: false,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: any) => {
      await apiRequest('POST', '/api/decks', deckData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
      setShowCreateDialog(false);
      setDeckName("");
      setDeckDescription("");
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
        description: "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ deckId, updates }: { deckId: number; updates: any }) => {
      await apiRequest('PUT', `/api/decks/${deckId}`, updates);
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

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      await apiRequest('DELETE', `/api/decks/${deckId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
      setSelectedDeck(null);
      toast({
        title: "Success",
        description: "Deck deleted successfully!",
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
        description: "Failed to delete deck. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-cosmic-gold text-xl">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading deck builder...
        </div>
      </div>
    );
  }

  if (decksError || collectionError) {
    const error = decksError || collectionError;
    if (error instanceof Error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }
  }

  const handleCreateDeck = () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name.",
        variant: "destructive",
      });
      return;
    }

    createDeckMutation.mutate({
      name: deckName,
      description: deckDescription,
      cardData: [],
    });
  };

  const handleAddCardToDeck = (card: any) => {
    if (!selectedDeck) {
      toast({
        title: "Error",
        description: "Please select a deck first.",
        variant: "destructive",
      });
      return;
    }

    const currentCards = selectedDeck.cardData || [];
    const existingCard = currentCards.find((c: any) => c.cardId === card.id);
    const newCardData = existingCard
      ? currentCards.map((c: any) => 
          c.cardId === card.id 
            ? { ...c, quantity: Math.min(c.quantity + 1, 4) } 
            : c
        )
      : [...currentCards, { cardId: card.id, quantity: 1 }];

    // Check deck size limit
    const totalCards = newCardData.reduce((sum: number, c: any) => sum + c.quantity, 0);
    if (totalCards > 60) {
      toast({
        title: "Error",
        description: "Deck cannot exceed 60 cards.",
        variant: "destructive",
      });
      return;
    }

    updateDeckMutation.mutate({
      deckId: selectedDeck.id,
      updates: { cardData: newCardData }
    });

    setSelectedDeck({ ...selectedDeck, cardData: newCardData });
  };

  const handleRemoveCardFromDeck = (cardId: number) => {
    if (!selectedDeck) return;

    const currentCards = selectedDeck.cardData || [];
    const newCardData = currentCards
      .map((c: any) => 
        c.cardId === cardId 
          ? { ...c, quantity: c.quantity - 1 } 
          : c
      )
      .filter((c: any) => c.quantity > 0);

    updateDeckMutation.mutate({
      deckId: selectedDeck.id,
      updates: { cardData: newCardData }
    });

    setSelectedDeck({ ...selectedDeck, cardData: newCardData });
  };

  const filteredCollection = collection?.filter((item: any) => {
    const matchesSearch = item.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.card.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  }) || [];

  const getDeckCardCount = () => {
    if (!selectedDeck?.cardData) return 0;
    return selectedDeck.cardData.reduce((sum: number, c: any) => sum + c.quantity, 0);
  };

  const getCardInDeck = (cardId: number) => {
    if (!selectedDeck?.cardData) return 0;
    const card = selectedDeck.cardData.find((c: any) => c.cardId === cardId);
    return card ? card.quantity : 0;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-cosmic-black text-cosmic-silver">
      <StarBackground />
      
      {/* Navigation Header */}
      <nav className="relative z-50 bg-cosmic-blue/90 backdrop-blur-md border-b border-cosmic-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
                <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-home mr-2"></i>Dashboard
              </Link>
              <Link href="/collection" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-layer-group mr-2"></i>Collection
              </Link>
              <Link href="/deck-builder" className="text-cosmic-gold font-medium">
                <i className="fas fa-cogs mr-2"></i>Deck Builder
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 h-screen flex overflow-hidden">
        {/* Deck List Sidebar */}
        <div className="w-1/4 bg-cosmic-blue/20 border-r border-cosmic-gold/30 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-cosmic-gold">Your Decks</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-black">
                  <i className="fas fa-plus mr-1"></i>New
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cosmic-blue border-cosmic-gold/30">
                <DialogHeader>
                  <DialogTitle className="text-cosmic-gold">Create New Deck</DialogTitle>
                  <DialogDescription className="text-cosmic-silver/80">
                    Enter a name and description for your new deck.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Deck name"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
                  />
                  <Textarea
                    placeholder="Deck description (optional)"
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      className="border-cosmic-gold/50 text-cosmic-gold hover:bg-cosmic-gold hover:text-cosmic-black"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateDeck}
                      disabled={createDeckMutation.isPending}
                      className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-black"
                    >
                      {createDeckMutation.isPending ? 'Creating...' : 'Create Deck'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {decks?.map((deck: any) => (
              <Card
                key={deck.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedDeck?.id === deck.id
                    ? 'bg-cosmic-gold/20 border-cosmic-gold'
                    : 'bg-cosmic-blue/10 border-cosmic-gold/30 hover:border-cosmic-gold/50'
                }`}
                onClick={() => setSelectedDeck(deck)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-cosmic-gold">{deck.name}</h3>
                      <p className="text-xs text-cosmic-silver/70">
                        {deck.cardData?.reduce((sum: number, c: any) => sum + c.quantity, 0) || 0} cards
                      </p>
                    </div>
                    {selectedDeck?.id === deck.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDeckMutation.mutate(deck.id);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Collection Browser */}
        <div className="w-1/2 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-cosmic-gold mb-4">Card Collection</h2>
            
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="unit">Units</SelectItem>
                  <SelectItem value="command">Commands</SelectItem>
                  <SelectItem value="shipyard">Shipyards</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {filteredCollection.map((item: any) => (
              <div key={`${item.cardId}-${item.playerId}`} className="relative">
                <div 
                  className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
                  onClick={() => handleAddCardToDeck(item.card)}
                >
                  <CardComponent card={item.card} />
                </div>
                <div className="absolute top-2 left-2 bg-cosmic-black/80 text-cosmic-silver text-xs px-2 py-1 rounded">
                  Own: {item.quantity}
                </div>
                {getCardInDeck(item.card.id) > 0 && (
                  <div className="absolute top-2 right-2 bg-cosmic-gold text-cosmic-black text-xs px-2 py-1 rounded font-bold">
                    In Deck: {getCardInDeck(item.card.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Deck */}
        <div className="w-1/4 bg-cosmic-blue/20 border-l border-cosmic-gold/30 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-cosmic-gold">
              {selectedDeck ? selectedDeck.name : 'Select a Deck'}
            </h2>
            {selectedDeck && (
              <p className="text-cosmic-silver/70 text-sm">
                Cards: {getDeckCardCount()}/60
              </p>
            )}
          </div>

          {selectedDeck ? (
            <div className="space-y-2">
              {selectedDeck.cardData?.map((deckCard: any) => {
                const collectionItem = collection?.find((item: any) => item.card.id === deckCard.cardId);
                if (!collectionItem) return null;

                return (
                  <Card key={deckCard.cardId} className="bg-cosmic-blue/10 border-cosmic-gold/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-cosmic-gold font-medium text-sm">
                            {collectionItem.card.name}
                          </div>
                          <div className="text-cosmic-silver/70 text-xs">
                            {collectionItem.card.type} • Cost: {collectionItem.card.cost}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-cosmic-gold font-bold">
                            {deckCard.quantity}x
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveCardFromDeck(deckCard.cardId)}
                            className="h-6 w-6 p-0 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
                          >
                            <i className="fas fa-minus text-xs"></i>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-cosmic-silver/70 mt-8">
              <i className="fas fa-layer-group text-4xl mb-4"></i>
              <p>Select a deck to start building</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarBackground from "@/components/StarBackground";
import CardComponent from "@/components/CardComponent";
import { useLocation } from "wouter";

export default function DeckBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: decks, isLoading: decksLoading } = useQuery({
    queryKey: ["/api/decks"],
    retry: false,
  });

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["/api/collection"],
    retry: false,
  });

  const { data: currentDeck, isLoading: deckLoading } = useQuery({
    queryKey: [`/api/decks/${selectedDeck?.id}`],
    enabled: !!selectedDeck?.id,
    retry: false,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSelectedDeck(deck);
      setShowCreateDialog(false);
      setDeckName("");
      setDeckDescription("");
      toast({
        title: "Success",
        description: "Deck created successfully",
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
    mutationFn: async ({ deckId, cardId, quantity = 1 }: { deckId: number; cardId: number; quantity?: number }) => {
      const response = await apiRequest("POST", `/api/decks/${deckId}/cards`, { cardId, quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${selectedDeck?.id}`] });
      toast({
        title: "Success",
        description: "Card added to deck",
      });
    },
    onError: (error) => {
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
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${selectedDeck?.id}`] });
      toast({
        title: "Success",
        description: "Card removed from deck",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove card from deck",
        variant: "destructive",
      });
    },
  });

  const handleCreateDeck = () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Deck name is required",
        variant: "destructive",
      });
      return;
    }
    createDeckMutation.mutate({ name: deckName, description: deckDescription });
  };

  const handleAddCard = (card: any) => {
    if (!selectedDeck) {
      toast({
        title: "Error",
        description: "Please select a deck first",
        variant: "destructive",
      });
      return;
    }
    addCardToDeckMutation.mutate({ deckId: selectedDeck.id, cardId: card.id });
  };

  const handleRemoveCard = (cardId: number) => {
    if (!selectedDeck) return;
    removeCardFromDeckMutation.mutate({ deckId: selectedDeck.id, cardId });
  };

  const filteredCards = collection?.filter((userCard: any) => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || card.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  }) || [];

  const deckSize = currentDeck?.deckCards?.reduce((sum: number, deckCard: any) => sum + deckCard.quantity, 0) || 0;
  const unitCards = currentDeck?.deckCards?.filter((dc: any) => dc.card.type === "Unit").length || 0;
  const commandCards = currentDeck?.deckCards?.filter((dc: any) => dc.card.type === "Command").length || 0;
  const shipyardCards = currentDeck?.deckCards?.filter((dc: any) => dc.card.type === "Shipyard").length || 0;

  return (
    <div className="min-h-screen bg-cosmic-black text-cosmic-silver relative">
      <StarBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-cosmic-blue/90 backdrop-blur-md border-b border-cosmic-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-cosmic-gold">Deck Builder</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <i className="fas fa-plus mr-2"></i>New Deck
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-cosmic-blue border-cosmic-gold">
                  <DialogHeader>
                    <DialogTitle className="text-cosmic-gold">Create New Deck</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-cosmic-silver mb-2">Deck Name</label>
                      <Input
                        placeholder="Enter deck name..."
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cosmic-silver mb-2">Description (Optional)</label>
                      <Textarea
                        placeholder="Enter deck description..."
                        value={deckDescription}
                        onChange={(e) => setDeckDescription(e.target.value)}
                        className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateDeck}
                      disabled={createDeckMutation.isPending}
                      className="w-full"
                    >
                      {createDeckMutation.isPending ? "Creating..." : "Create Deck"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Deck List */}
          <div className="lg:col-span-1">
            <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 mb-6">
              <CardHeader>
                <CardTitle className="text-cosmic-gold">Your Decks</CardTitle>
              </CardHeader>
              <CardContent>
                {decksLoading ? (
                  <div className="text-cosmic-silver">Loading decks...</div>
                ) : decks?.length > 0 ? (
                  <div className="space-y-2">
                    {decks.map((deck: any) => (
                      <div
                        key={deck.id}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedDeck?.id === deck.id
                            ? 'bg-cosmic-gold/20 border-cosmic-gold'
                            : 'bg-cosmic-black/30 hover:bg-cosmic-black/50'
                        }`}
                        onClick={() => setSelectedDeck(deck)}
                      >
                        <div className="font-semibold text-cosmic-gold">{deck.name}</div>
                        <div className="text-xs text-cosmic-silver/70">
                          {deck.description || "No description"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-cosmic-silver text-center py-4">
                    No decks yet. Create your first deck!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deck Stats */}
            {selectedDeck && (
              <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
                <CardHeader>
                  <CardTitle className="text-cosmic-gold">Deck Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Cards:</span>
                      <span className="text-cosmic-gold font-semibold">{deckSize}/60</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Units:</span>
                      <span className="text-cosmic-gold">{unitCards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commands:</span>
                      <span className="text-cosmic-gold">{commandCards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipyards:</span>
                      <span className="text-cosmic-gold">{shipyardCards}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Card Collection */}
          <div className="lg:col-span-2">
            <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 mb-6">
              <CardHeader>
                <CardTitle className="text-cosmic-gold">Card Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver"
                  />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="unit">Units</SelectItem>
                      <SelectItem value="command">Commands</SelectItem>
                      <SelectItem value="shipyard">Shipyards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {collectionLoading ? (
                  <div className="text-cosmic-silver text-center py-8">Loading collection...</div>
                ) : filteredCards.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {filteredCards.map((userCard: any) => (
                      <div key={userCard.id} className="relative">
                        <div 
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => handleAddCard(userCard.card)}
                        >
                          <CardComponent card={userCard.card} size="small" />
                        </div>
                        <div className="absolute top-1 right-1 bg-cosmic-gold text-cosmic-black text-xs px-1 rounded">
                          x{userCard.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-cosmic-silver text-center py-8">
                    No cards found. Try adjusting your filters.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Current Deck */}
          <div className="lg:col-span-1">
            <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
              <CardHeader>
                <CardTitle className="text-cosmic-gold">
                  {selectedDeck ? selectedDeck.name : "Select a Deck"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDeck ? (
                  deckLoading ? (
                    <div className="text-cosmic-silver">Loading deck...</div>
                  ) : currentDeck?.deckCards?.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentDeck.deckCards.map((deckCard: any) => (
                        <div
                          key={deckCard.id}
                          className="flex items-center justify-between p-2 bg-cosmic-black/30 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-12 h-16 bg-cosmic-gold/20 rounded flex-shrink-0">
                              <CardComponent card={deckCard.card} size="tiny" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-cosmic-gold">
                                {deckCard.card.name}
                              </div>
                              <div className="text-xs text-cosmic-silver/70">
                                {deckCard.card.type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-cosmic-silver text-sm">x{deckCard.quantity}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveCard(deckCard.cardId)}
                            >
                              <i className="fas fa-minus"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-cosmic-silver text-center py-8">
                      This deck is empty. Add cards from your collection.
                    </div>
                  )
                ) : (
                  <div className="text-cosmic-silver text-center py-8">
                    Select a deck to start building.
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

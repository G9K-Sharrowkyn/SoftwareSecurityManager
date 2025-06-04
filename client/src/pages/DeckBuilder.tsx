import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Minus, Save, Trash2, Layers, Search, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DeckBuilder() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentDeck, setCurrentDeck] = useState<any[]>([]);
  const [deckName, setDeckName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [editingDeck, setEditingDeck] = useState<any>(null);

  const { data: collection } = useQuery({
    queryKey: ["/api/collection"],
    enabled: !!user,
  });

  const { data: cards } = useQuery({
    queryKey: ["/api/cards"],
  });

  const { data: decks } = useQuery({
    queryKey: ["/api/decks"],
    enabled: !!user,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: any) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck Created!",
        description: "Your deck has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setCurrentDeck([]);
      setDeckName("");
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, ...deckData }: any) => {
      const response = await apiRequest("PUT", `/api/decks/${id}`, deckData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck Updated!",
        description: "Your deck has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setEditingDeck(null);
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/decks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Deck Deleted",
        description: "Your deck has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
  });

  const getCardDetails = (cardId: number) => {
    return cards?.find((card: any) => card.id === cardId);
  };

  const getUserCard = (cardId: number) => {
    return collection?.find((userCard: any) => userCard.cardId === cardId);
  };

  const filteredCollection = collection?.filter((userCard: any) => {
    const card = getCardDetails(userCard.cardId);
    if (!card) return false;
    
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || card.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesRarity = filterRarity === "all" || card.rarity === filterRarity;
    
    return matchesSearch && matchesType && matchesRarity;
  }) || [];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-500";
      case "uncommon": return "bg-green-500";
      case "rare": return "bg-blue-500";
      case "legendary": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const addCardToDeck = (cardId: number) => {
    const card = getCardDetails(cardId);
    const userCard = getUserCard(cardId);
    if (!card || !userCard) return;

    const currentQuantity = currentDeck.filter(id => id === cardId).length;
    if (currentQuantity >= userCard.quantity || currentQuantity >= 3) {
      toast({
        title: "Cannot add card",
        description: "You can only have up to 3 copies of each card or you don't own enough copies.",
        variant: "destructive",
      });
      return;
    }

    if (currentDeck.length >= 60) {
      toast({
        title: "Deck is full",
        description: "Maximum deck size is 60 cards.",
        variant: "destructive",
      });
      return;
    }

    setCurrentDeck([...currentDeck, cardId]);
  };

  const removeCardFromDeck = (cardId: number) => {
    const index = currentDeck.findIndex(id => id === cardId);
    if (index !== -1) {
      const newDeck = [...currentDeck];
      newDeck.splice(index, 1);
      setCurrentDeck(newDeck);
    }
  };

  const getDeckStats = () => {
    const cardCounts = currentDeck.reduce((counts, cardId) => {
      counts[cardId] = (counts[cardId] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    const stats = {
      totalCards: currentDeck.length,
      units: 0,
      commands: 0,
      shipyards: 0,
      avgCost: 0,
    };

    let totalCost = 0;
    Object.keys(cardCounts).forEach(cardIdStr => {
      const cardId = parseInt(cardIdStr);
      const card = getCardDetails(cardId);
      const quantity = cardCounts[cardId];
      
      if (card) {
        if (card.type.toLowerCase().includes("shipyard")) {
          stats.shipyards += quantity;
        } else if (card.type.toLowerCase().includes("unit")) {
          stats.units += quantity;
        } else {
          stats.commands += quantity;
        }
        totalCost += (card.commandCost || 0) * quantity;
      }
    });

    stats.avgCost = stats.totalCards > 0 ? Math.round((totalCost / stats.totalCards) * 10) / 10 : 0;
    return stats;
  };

  const saveDeck = () => {
    if (!deckName.trim()) {
      toast({
        title: "Deck name required",
        description: "Please enter a name for your deck.",
        variant: "destructive",
      });
      return;
    }

    if (currentDeck.length < 20) {
      toast({
        title: "Deck too small",
        description: "Your deck must contain at least 20 cards.",
        variant: "destructive",
      });
      return;
    }

    if (editingDeck) {
      updateDeckMutation.mutate({
        id: editingDeck.id,
        name: deckName,
        cardIds: currentDeck,
      });
    } else {
      createDeckMutation.mutate({
        name: deckName,
        cardIds: currentDeck,
      });
    }
  };

  const loadDeck = (deck: any) => {
    setEditingDeck(deck);
    setDeckName(deck.name);
    setCurrentDeck(deck.cardIds || []);
  };

  const deleteDeck = (deckId: number) => {
    deleteDeckMutation.mutate(deckId);
  };

  const deckStats = getDeckStats();
  const uniqueCards = Object.entries(
    currentDeck.reduce((counts, cardId) => {
      counts[cardId] = (counts[cardId] || 0) + 1;
      return counts;
    }, {} as Record<number, number>)
  );

  return (
    <div className="min-h-screen relative z-10">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-glow">
              Deck Builder
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Deck name..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-48"
            />
            <Button onClick={saveDeck} disabled={createDeckMutation.isPending || updateDeckMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {editingDeck ? "Update" : "Save"} Deck
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Collection */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="collection" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="collection">Your Collection</TabsTrigger>
                <TabsTrigger value="saved-decks">Saved Decks</TabsTrigger>
              </TabsList>

              <TabsContent value="collection">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="unit">Units</SelectItem>
                      <SelectItem value="shipyard">Shipyards</SelectItem>
                      <SelectItem value="command">Commands</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Collection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {filteredCollection.map((userCard: any) => {
                    const card = getCardDetails(userCard.cardId);
                    if (!card) return null;

                    const inDeck = currentDeck.filter(id => id === card.id).length;
                    const canAdd = inDeck < userCard.quantity && inDeck < 3 && currentDeck.length < 60;

                    return (
                      <Card key={userCard.id} className="bg-card/80 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 cursor-pointer">
                        <CardContent className="p-3">
                          <div className="relative mb-2">
                            <div className="aspect-[3/4] bg-background rounded-lg overflow-hidden border border-border">
                              {card.imageUrl ? (
                                <img 
                                  src={card.imageUrl} 
                                  alt={card.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="absolute top-1 right-1">
                              <Badge className={`${getRarityColor(card.rarity)} text-white text-xs`}>
                                {card.rarity}
                              </Badge>
                            </div>
                            {inDeck > 0 && (
                              <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {inDeck}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs font-semibold text-primary mb-1 truncate">
                            {card.name}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Cost: {card.commandCost || 0}
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {userCard.quantity} owned
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addCardToDeck(card.id)}
                              disabled={!canAdd}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="saved-decks">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {decks?.map((deck: any) => (
                    <Card key={deck.id} className="bg-card/80 backdrop-blur-sm border-border">
                      <CardHeader>
                        <CardTitle className="text-primary">{deck.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {deck.cardIds?.length || 0} cards
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadDeck(deck)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteDeck(deck.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Current Deck */}
          <div className="lg:col-span-1">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center justify-between">
                  <span>Current Deck</span>
                  <Badge variant="outline">
                    {deckStats.totalCards}/60
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Deck Stats */}
                <div className="mb-6 p-4 bg-background/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Deck Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Units:</span>
                      <span className="text-primary">{deckStats.units}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commands:</span>
                      <span className="text-primary">{deckStats.commands}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipyards:</span>
                      <span className="text-primary">{deckStats.shipyards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Cost:</span>
                      <span className="text-primary">{deckStats.avgCost}</span>
                    </div>
                  </div>
                </div>

                {/* Deck Cards */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uniqueCards.map(([cardIdStr, quantity]) => {
                    const cardId = parseInt(cardIdStr);
                    const card = getCardDetails(cardId);
                    if (!card) return null;

                    return (
                      <div key={cardId} className="flex items-center justify-between p-2 bg-background/30 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-primary truncate">
                            {card.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cost: {card.commandCost || 0}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{quantity}x</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCardFromDeck(cardId)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {uniqueCards.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-2" />
                    <p>No cards in deck</p>
                    <p className="text-xs">Add cards from your collection</p>
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

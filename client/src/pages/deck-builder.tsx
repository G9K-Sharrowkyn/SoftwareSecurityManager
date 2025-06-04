import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Save, Layers } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DeckBuilder() {
  const [deckName, setDeckName] = useState("New Deck");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentDeck, setCurrentDeck] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: collection } = useQuery({
    queryKey: ["/api/collection"],
  });

  const saveDeckMutation = useMutation({
    mutationFn: async () => {
      const deckResponse = await apiRequest("POST", "/api/decks", { name: deckName });
      const deck = await deckResponse.json();
      
      // Add cards to deck
      for (const deckCard of currentDeck) {
        await apiRequest("POST", `/api/decks/${deck.id}/cards`, {
          cardId: deckCard.card.id,
          quantity: deckCard.quantity
        });
      }
      
      return deck;
    },
    onSuccess: () => {
      toast({
        title: "Deck Saved!",
        description: `"${deckName}" has been saved to your collection.`,
      });
      setCurrentDeck([]);
      setDeckName("New Deck");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save deck",
        variant: "destructive",
      });
    },
  });

  const filteredCollection = collection?.filter((item: any) => {
    const matchesSearch = item.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.card.type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesType;
  }) || [];

  const addCardToDeck = (collectionItem: any) => {
    const existingCard = currentDeck.find(deckCard => deckCard.card.id === collectionItem.card.id);
    
    if (existingCard) {
      if (existingCard.quantity < Math.min(collectionItem.quantity, 3)) {
        setCurrentDeck(currentDeck.map(deckCard => 
          deckCard.card.id === collectionItem.card.id 
            ? { ...deckCard, quantity: deckCard.quantity + 1 }
            : deckCard
        ));
      }
    } else {
      setCurrentDeck([...currentDeck, { card: collectionItem.card, quantity: 1 }]);
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    const existingCard = currentDeck.find(deckCard => deckCard.card.id === cardId);
    
    if (existingCard && existingCard.quantity > 1) {
      setCurrentDeck(currentDeck.map(deckCard => 
        deckCard.card.id === cardId 
          ? { ...deckCard, quantity: deckCard.quantity - 1 }
          : deckCard
      ));
    } else {
      setCurrentDeck(currentDeck.filter(deckCard => deckCard.card.id !== cardId));
    }
  };

  const totalCards = currentDeck.reduce((sum, deckCard) => sum + deckCard.quantity, 0);
  const avgCost = currentDeck.length > 0 
    ? currentDeck.reduce((sum, deckCard) => sum + (deckCard.card.commandCost * deckCard.quantity), 0) / totalCards
    : 0;

  const cardTypes = currentDeck.reduce((acc, deckCard) => {
    const type = deckCard.card.type;
    acc[type] = (acc[type] || 0) + deckCard.quantity;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Collection Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Card Collection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["all", "unit", "command", "shipyard"].map((type) => (
                      <Button
                        key={type}
                        variant={selectedType === type ? "default" : "outline"}
                        onClick={() => setSelectedType(type)}
                        className="capitalize"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Collection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {filteredCollection.map((item: any) => (
                    <Card key={item.id} className="bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => addCardToDeck(item)}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center">
                            <Layers className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm truncate">{item.card.name}</h4>
                            <div className="flex justify-between items-center text-xs">
                              <span>Cost: {item.card.commandCost}</span>
                              <span>x{item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deck Panel */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Deck Builder</CardTitle>
                <Input
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Deck name..."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Deck Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{totalCards}</div>
                    <div className="text-sm text-muted-foreground">Cards</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{avgCost.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Avg Cost</div>
                  </div>
                </div>

                <Separator />

                {/* Type Distribution */}
                <div className="space-y-2">
                  <h4 className="font-medium">Card Types</h4>
                  {Object.entries(cardTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Current Deck */}
                <div className="space-y-2">
                  <h4 className="font-medium">Deck List</h4>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {currentDeck.map((deckCard) => (
                      <div key={deckCard.card.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{deckCard.card.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Cost: {deckCard.card.commandCost}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{deckCard.quantity}x</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCardFromDeck(deckCard.card.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => saveDeckMutation.mutate()}
                  disabled={currentDeck.length === 0 || saveDeckMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Deck
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

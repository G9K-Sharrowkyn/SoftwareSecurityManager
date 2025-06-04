import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import CardComponent from "@/components/CardComponent";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function DeckBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [currentDeck, setCurrentDeck] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const { toast } = useToast();

  const { data: collection } = useQuery({
    queryKey: ["/api/collection"],
    enabled: isOpen,
  });

  const { data: decks } = useQuery({
    queryKey: ["/api/decks"],
    enabled: isOpen,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (deckData: { name: string; cards: any[] }) => {
      const response = await apiRequest("POST", "/api/decks", deckData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setCurrentDeck([]);
      setDeckName("");
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

  const filteredCollection = collection?.filter((item: any) => {
    const matchesSearch = item.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || 
      item.card.type.some((type: string) => type.toLowerCase().includes(selectedType.toLowerCase()));
    return matchesSearch && matchesType;
  }) || [];

  const addCardToDeck = (card: any) => {
    const existingCard = currentDeck.find(deckCard => deckCard.cardId === card.id);
    if (existingCard) {
      if (existingCard.quantity < 4) {
        setCurrentDeck(current =>
          current.map(deckCard =>
            deckCard.cardId === card.id
              ? { ...deckCard, quantity: deckCard.quantity + 1 }
              : deckCard
          )
        );
      } else {
        toast({
          title: "Limit Reached",
          description: "You can only have 4 copies of each card in a deck",
          variant: "destructive",
        });
      }
    } else {
      setCurrentDeck(current => [...current, { cardId: card.id, card, quantity: 1 }]);
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    setCurrentDeck(current =>
      current.map(deckCard =>
        deckCard.cardId === cardId
          ? { ...deckCard, quantity: deckCard.quantity - 1 }
          : deckCard
      ).filter(deckCard => deckCard.quantity > 0)
    );
  };

  const getTotalCards = () => {
    return currentDeck.reduce((total, deckCard) => total + deckCard.quantity, 0);
  };

  const handleSaveDeck = () => {
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
        description: "Please add some cards to your deck",
        variant: "destructive",
      });
      return;
    }

    const deckData = {
      name: deckName,
      cards: currentDeck.map(deckCard => ({
        cardId: deckCard.cardId,
        quantity: deckCard.quantity
      }))
    };

    createDeckMutation.mutate(deckData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <i className="fas fa-layer-group mr-2"></i>
          Deck Builder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-center text-primary text-2xl">
            <i className="fas fa-layer-group mr-2"></i>
            Deck Builder
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="build" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">Build Deck</TabsTrigger>
            <TabsTrigger value="collection">My Decks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="build" className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Deck name..."
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="flex-1"
              />
              <div className="text-muted-foreground">
                Cards: {getTotalCards()}/60
              </div>
              <Button 
                onClick={handleSaveDeck}
                disabled={createDeckMutation.isPending || getTotalCards() === 0}
                className="bg-primary hover:bg-accent"
              >
                Save Deck
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 h-96">
              {/* Collection */}
              <div className="col-span-2 space-y-4">
                <div className="flex space-x-4">
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="shipyard">Shipyards</option>
                    <option value="biological">Biological</option>
                    <option value="machine">Machine</option>
                  </select>
                </div>

                <ScrollArea className="h-80">
                  <div className="grid grid-cols-4 gap-4 p-2">
                    {filteredCollection.map((item: any) => (
                      <div key={item.card.id} className="relative">
                        <CardComponent 
                          card={item.card} 
                          size="small"
                          onClick={() => addCardToDeck(item.card)}
                        />
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Current Deck */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary">Current Deck</h3>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {currentDeck.map((deckCard) => (
                      <div key={deckCard.cardId} className="flex items-center justify-between p-2 bg-background/50 rounded">
                        <div className="flex items-center space-x-2">
                          <CardComponent card={deckCard.card} size="small" />
                          <div>
                            <div className="text-sm font-semibold">{deckCard.card.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Cost: {deckCard.card.commandCost}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{deckCard.quantity}x</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCardFromDeck(deckCard.cardId)}
                          >
                            <i className="fas fa-minus"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="collection" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-3 gap-4">
                {decks?.map((deck: any) => (
                  <div key={deck.id} className="p-4 bg-background/50 rounded-lg border border-primary/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-primary">{deck.name}</h3>
                      {deck.isActive && (
                        <Badge className="bg-primary text-primary-foreground">Active</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {deck.cards?.reduce((total: number, card: any) => total + card.quantity, 0) || 0} cards
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(deck.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

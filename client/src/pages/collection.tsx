import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BoosterPack from "@/components/collection/BoosterPack";
import { Search, Package, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Collection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const { toast } = useToast();

  const { data: collection, isLoading } = useQuery({
    queryKey: ["/api/collection"],
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/booster-packs"],
  });

  const openPackMutation = useMutation({
    mutationFn: async (packId: number) => {
      const response = await apiRequest("POST", `/api/booster-packs/${packId}/open`);
      return response.json();
    },
    onSuccess: (cards) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      toast({
        title: "Pack Opened!",
        description: `You received ${cards.length} new cards!`,
      });
    },
  });

  const filteredCollection = collection?.filter((item: any) => {
    const matchesSearch = item.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === "all" || item.card.rarity.toLowerCase() === selectedRarity;
    return matchesSearch && matchesRarity;
  }) || [];

  const rarityColors = {
    common: "bg-gray-500",
    uncommon: "bg-green-500", 
    rare: "bg-blue-500",
    legendary: "bg-purple-500"
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-glow">Your Collection</h1>
          <p className="text-xl text-muted-foreground">
            Manage your cards and open booster packs
          </p>
        </div>

        {/* Booster Packs */}
        {boosterPacks && boosterPacks.length > 0 && (
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Package className="mr-2 h-5 w-5" />
                Booster Packs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {boosterPacks
                  .filter((pack: any) => !pack.opened)
                  .map((pack: any) => (
                    <BoosterPack
                      key={pack.id}
                      pack={pack}
                      onOpen={() => openPackMutation.mutate(pack.id)}
                      isOpening={openPackMutation.isPending}
                    />
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="p-6">
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
                {["all", "common", "uncommon", "rare", "legendary"].map((rarity) => (
                  <Button
                    key={rarity}
                    variant={selectedRarity === rarity ? "default" : "outline"}
                    onClick={() => setSelectedRarity(rarity)}
                    className="capitalize"
                  >
                    {rarity}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCollection.map((item: any) => (
            <Card key={`${item.cardId}-${item.id}`} className="bg-card/50 border-primary/20 hover:border-primary/50 transition-all duration-300 card-hover">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Card Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  
                  {/* Card Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm truncate">{item.card.name}</h3>
                    <div className="flex justify-between items-center">
                      <Badge 
                        className={`${rarityColors[item.card.rarity.toLowerCase() as keyof typeof rarityColors] || rarityColors.common} text-white`}
                      >
                        {item.card.rarity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                    </div>
                    
                    {/* Card Stats */}
                    <div className="text-xs text-muted-foreground grid grid-cols-3 gap-1">
                      <div>Cost: {item.card.commandCost}</div>
                      <div>ATK: {item.card.attack}</div>
                      <div>DEF: {item.card.defense}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCollection.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No cards found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}

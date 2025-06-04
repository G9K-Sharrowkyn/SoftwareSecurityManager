import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/ui/navigation";
import { Search, Filter, Star, Layers, Zap } from "lucide-react";

export default function Collection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const { data: userCards, isLoading } = useQuery({
    queryKey: ["/api/user/cards"],
  });

  const { data: allCards } = useQuery({
    queryKey: ["/api/cards"],
  });

  // Filter and sort cards
  const filteredCards = userCards?.filter(userCard => {
    const card = userCard.card;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === "all" || card.rarity === selectedRarity;
    const matchesType = selectedType === "all" || card.type.some(t => t.toLowerCase() === selectedType.toLowerCase());
    
    return matchesSearch && matchesRarity && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.card.name.localeCompare(b.card.name);
      case "rarity":
        const rarityOrder = { "Common": 1, "Uncommon": 2, "Rare": 3, "Epic": 4, "Legendary": 5 };
        return (rarityOrder[b.card.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.card.rarity as keyof typeof rarityOrder] || 0);
      case "cost":
        return a.card.commandCost - b.card.commandCost;
      case "quantity":
        return b.quantity - a.quantity;
      default:
        return 0;
    }
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "bg-gray-600";
      case "Uncommon": return "bg-green-600";
      case "Rare": return "bg-blue-600";
      case "Epic": return "bg-purple-600";
      case "Legendary": return "bg-yellow-600";
      default: return "bg-gray-600";
    }
  };

  const getTypeIcon = (types: string[]) => {
    if (types.includes("Shipyard")) return <Layers className="w-4 h-4" />;
    if (types.some(t => t.includes("Unit") || t.includes("Machine") || t.includes("Biological"))) return <Zap className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading your collection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4 cosmic-text-glow">
            Card Collection
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your stellar fleet and build powerful decks
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <Layers className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{userCards?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Unique Cards</div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-500">
                {userCards?.reduce((sum, uc) => sum + uc.quantity, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Cards</div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-500">
                {userCards?.filter(uc => uc.card.rarity === "Legendary").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Legendary</div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(((userCards?.length || 0) / (allCards?.length || 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="cosmic-card mb-8">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger>
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="Common">Common</SelectItem>
                  <SelectItem value="Uncommon">Uncommon</SelectItem>
                  <SelectItem value="Rare">Rare</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shipyard">Shipyard</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="command">Command</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRarity("all");
                  setSelectedType("all");
                  setSortBy("name");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Collection Tabs */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid">
            {filteredCards && filteredCards.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCards.map((userCard) => (
                  <Card key={userCard.id} className="cosmic-card group cursor-pointer hover:scale-105 transition-all duration-300">
                    <div className="relative">
                      {userCard.card.imageUrl ? (
                        <img
                          src={userCard.card.imageUrl}
                          alt={userCard.card.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                          {getTypeIcon(userCard.card.type)}
                        </div>
                      )}
                      
                      <Badge className={`absolute top-2 left-2 ${getRarityColor(userCard.card.rarity)}`}>
                        {userCard.card.rarity}
                      </Badge>
                      
                      {userCard.quantity > 1 && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                          x{userCard.quantity}
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2 truncate">{userCard.card.name}</h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Cost: {userCard.card.commandCost}</span>
                        {userCard.card.attack > 0 && (
                          <span>{userCard.card.attack}/{userCard.card.defense}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="cosmic-card">
                <CardContent className="p-12 text-center">
                  <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No cards found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || selectedRarity !== "all" || selectedType !== "all"
                      ? "Try adjusting your filters to see more cards."
                      : "Start opening booster packs to build your collection!"}
                  </p>
                  <Button className="cosmic-button">
                    Open Booster Pack
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            <Card className="cosmic-card">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {filteredCards?.map((userCard, index) => (
                    <div 
                      key={userCard.id}
                      className={`flex items-center p-4 hover:bg-muted/50 transition-colors ${
                        index !== filteredCards.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mr-4">
                        {getTypeIcon(userCard.card.type)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{userCard.card.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {userCard.card.type.join(", ")}
                        </p>
                      </div>
                      
                      <div className="text-right mr-4">
                        <div className="font-semibold">Cost: {userCard.card.commandCost}</div>
                        {userCard.card.attack > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {userCard.card.attack}/{userCard.card.defense}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getRarityColor(userCard.card.rarity)}>
                          {userCard.card.rarity}
                        </Badge>
                        <Badge variant="outline">
                          x{userCard.quantity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

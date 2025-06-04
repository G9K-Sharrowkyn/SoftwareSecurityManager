import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarBackground from "@/components/StarBackground";
import CardComponent from "@/components/CardComponent";
import BoosterPack from "@/components/BoosterPack";
import { Link } from "wouter";

export default function Collection() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showBoosterModal, setShowBoosterModal] = useState(false);

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

  const { data: collection, isLoading: collectionLoading, error, refetch } = useQuery({
    queryKey: ['/api/collection'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ['/api/boosters'],
    enabled: isAuthenticated,
    retry: false,
  });

  const handleCreateBoosterPack = async () => {
    try {
      const response = await fetch('/api/boosters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        refetch();
        toast({
          title: "Success",
          description: "Booster pack created! Open it to reveal cards.",
        });
      } else {
        throw new Error('Failed to create booster pack');
      }
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
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
        description: "Failed to create booster pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || collectionLoading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-cosmic-gold text-xl">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading collection...
        </div>
      </div>
    );
  }

  if (error) {
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

  const filteredCollection = collection?.filter((item: any) => {
    const matchesSearch = item.card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.card.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  }) || [];

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
              <Link href="/collection" className="text-cosmic-gold font-medium">
                <i className="fas fa-layer-group mr-2"></i>Collection
              </Link>
              <Link href="/deck-builder" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-cogs mr-2"></i>Deck Builder
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold mb-4">
            <i className="fas fa-layer-group mr-3"></i>
            Card Collection
          </h1>
          <p className="text-cosmic-silver/80">
            Manage your card collection and open booster packs to discover new cards.
          </p>
        </div>

        {/* Booster Packs Section */}
        <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cosmic-gold flex items-center">
              <i className="fas fa-gift mr-2"></i>
              Booster Packs
            </CardTitle>
            <CardDescription>
              Open booster packs to add new cards to your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-cosmic-silver">
                Available Packs: <span className="text-cosmic-gold font-semibold">
                  {boosterPacks?.filter((pack: any) => !pack.isOpened).length || 0}
                </span>
              </div>
              <Button
                onClick={handleCreateBoosterPack}
                className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-black"
              >
                <i className="fas fa-plus mr-2"></i>
                Get Booster Pack
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {boosterPacks?.filter((pack: any) => !pack.isOpened).map((pack: any) => (
                <BoosterPack 
                  key={pack.id} 
                  pack={pack} 
                  onOpen={() => refetch()} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collection Filters */}
        <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver placeholder-cosmic-silver/50 focus:border-cosmic-gold"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48 bg-cosmic-black/50 border-cosmic-gold/30 text-cosmic-silver">
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
          </CardContent>
        </Card>

        {/* Collection Grid */}
        <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">
              Your Cards ({filteredCollection.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCollection.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-inbox text-cosmic-silver/50 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-cosmic-silver mb-2">No Cards Found</h3>
                <p className="text-cosmic-silver/70 mb-4">
                  {searchTerm || filterType !== "all" 
                    ? "Try adjusting your search or filters." 
                    : "Open some booster packs to start your collection!"}
                </p>
                {!searchTerm && filterType === "all" && (
                  <Button
                    onClick={handleCreateBoosterPack}
                    className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-black"
                  >
                    <i className="fas fa-gift mr-2"></i>
                    Get Your First Pack
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredCollection.map((item: any) => (
                  <div key={`${item.cardId}-${item.playerId}`} className="relative">
                    <CardComponent card={item.card} />
                    {item.quantity > 1 && (
                      <div className="absolute top-2 right-2 bg-cosmic-gold text-cosmic-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {item.quantity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

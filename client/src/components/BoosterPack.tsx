import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CardComponent from "@/components/CardComponent";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function BoosterPack() {
  const [isOpen, setIsOpen] = useState(false);
  const [revealedCards, setRevealedCards] = useState<any[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const { toast } = useToast();

  const addPackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs", { packType: "standard" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      toast({
        title: "Success",
        description: "Booster pack added to your collection!",
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
        description: "Failed to add booster pack",
        variant: "destructive",
      });
    },
  });

  const openPackMutation = useMutation({
    mutationFn: async (packId: number) => {
      const response = await apiRequest("POST", `/api/booster-packs/${packId}/open`, {});
      return response.json();
    },
    onSuccess: (cards) => {
      setRevealedCards(cards);
      setIsOpening(false);
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({
        title: "Pack Opened!",
        description: `You received ${cards.length} cards!`,
      });
    },
    onError: (error) => {
      setIsOpening(false);
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
        description: "Failed to open booster pack",
        variant: "destructive",
      });
    },
  });

  const handleOpenPack = () => {
    setIsOpening(true);
    setRevealedCards([]);
    
    // Simulate pack opening animation
    setTimeout(() => {
      // For demo purposes, we'll simulate opening pack ID 1
      // In a real app, you'd get the actual pack ID from the available packs
      openPackMutation.mutate(1);
    }, 1500);
  };

  const handleAddPack = () => {
    addPackMutation.mutate();
  };

  return (
    <div className="space-y-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            <i className="fas fa-gift mr-2"></i>
            Open Booster Pack
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-center text-primary text-2xl">
              <i className="fas fa-gift mr-2"></i>
              Booster Pack Opening
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {!isOpening && revealedCards.length === 0 && (
              <div className="text-center">
                <p className="text-muted-foreground mb-6">Click the pack to reveal your cards!</p>
                
                <div className="flex justify-center mb-6">
                  <div 
                    className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
                    onClick={handleOpenPack}
                  >
                    <div className="w-48 h-64 bg-gradient-to-br from-primary to-accent rounded-xl border-4 border-primary shadow-2xl relative overflow-hidden animate-pulse-gold">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-primary-foreground">
                          <i className="fas fa-gift text-6xl mb-4"></i>
                          <div className="font-bold text-xl">Nebula Pack</div>
                          <div className="text-sm opacity-80">5 Random Cards</div>
                        </div>
                      </div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isOpening && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-primary text-xl">Opening pack...</div>
                <div className="text-muted-foreground">Revealing your cards...</div>
              </div>
            )}

            {revealedCards.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-primary text-center">Cards Revealed!</h3>
                <div className="grid grid-cols-5 gap-4">
                  {revealedCards.map((card, index) => (
                    <div key={index} className="animate-card-hover">
                      <CardComponent card={card} size="medium" />
                    </div>
                  ))}
                </div>
                <div className="text-center text-muted-foreground">
                  Cards have been added to your collection!
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Button 
                onClick={handleOpenPack} 
                disabled={isOpening || openPackMutation.isPending}
                className="bg-primary hover:bg-accent"
              >
                Open Another Pack
              </Button>
              <Button 
                onClick={handleAddPack}
                disabled={addPackMutation.isPending}
                variant="outline"
                className="border-primary/30 hover:border-primary"
              >
                <i className="fas fa-plus mr-2"></i>
                Buy Pack (100 Credits)
              </Button>
              <Button 
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

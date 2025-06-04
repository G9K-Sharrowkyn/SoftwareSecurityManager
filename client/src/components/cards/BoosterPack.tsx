import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, BoosterPack as BoosterPackType } from "@shared/schema";
import { CardDisplay } from "./CardDisplay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BoosterPackProps {
  pack: BoosterPackType;
}

export function BoosterPack({ pack }: BoosterPackProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Card[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openPackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/booster-packs/${pack.id}/open`);
      return response.json();
    },
    onSuccess: (data) => {
      setRevealedCards(data.cards);
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ["/api/users/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/booster-packs"] });
      toast({
        title: "Booster Pack Opened!",
        description: `You received ${data.cards.length} new cards!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to open booster pack",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsOpening(false);
    }
  });

  const handleOpenPack = () => {
    setIsOpening(true);
    // Add animation delay
    setTimeout(() => {
      openPackMutation.mutate();
    }, 1000);
  };

  return (
    <>
      <div
        className="relative cursor-pointer transform hover:scale-105 transition-all duration-300 group"
        onClick={handleOpenPack}
      >
        <div className="w-48 h-64 bg-gradient-to-br from-cosmic-gold via-cosmic-gold/80 to-cosmic-gold/60 rounded-xl border-4 border-cosmic-gold shadow-2xl relative overflow-hidden">
          {/* Pack Image */}
          {pack.imageUrl ? (
            <img
              src={pack.imageUrl}
              alt={pack.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cosmic-blue to-cosmic-purple">
              <i className="fas fa-gift text-cosmic-gold text-6xl"></i>
            </div>
          )}

          {/* Pack Info Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-cosmic-900/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className="text-white font-bold text-xl mb-1">{pack.name}</div>
            <div className="text-cosmic-gold text-sm">{pack.cardCount} Cards</div>
            <div className="text-cosmic-silver/80 text-xs">{pack.rarity}</div>
          </div>

          {/* Opening Animation */}
          {isOpening && (
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />
          )}

          {/* Hover Glow */}
          <div className="absolute inset-0 bg-cosmic-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
        </div>

        {/* Click Instruction */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-cosmic-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Click to Open!
        </div>
      </div>

      {/* Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl bg-cosmic-800 border-cosmic-gold/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cosmic-gold text-center">
              <i className="fas fa-star mr-2"></i>
              Cards Revealed!
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-5 gap-4 p-4">
            {revealedCards.map((card, index) => (
              <div
                key={index}
                className="transform animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardDisplay
                  card={card}
                  size="medium"
                  className="animate-in zoom-in-50"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Button
              onClick={() => setShowResults(false)}
              className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-900 font-semibold"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BoosterPackModal() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: boosterPacks = [] } = useQuery({
    queryKey: ["/api/booster-packs"],
  });

  const { data: userPacks = [] } = useQuery({
    queryKey: ["/api/users/booster-packs"],
  });

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-cosmic-purple hover:bg-cosmic-purple/80 text-white font-bold px-6 py-3 rounded-lg transition-colors"
      >
        <i className="fas fa-gift mr-2"></i>
        Open Booster Packs
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl bg-cosmic-800 border-cosmic-gold/30">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-cosmic-gold text-center">
              <i className="fas fa-gift mr-3"></i>
              Booster Pack Opening
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            {userPacks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {userPacks.map((userPack: any) => {
                  const pack = boosterPacks.find((p: BoosterPackType) => p.id === userPack.boosterPackId);
                  if (!pack) return null;
                  
                  return (
                    <div key={userPack.id} className="text-center">
                      <BoosterPack pack={pack} />
                      <div className="mt-2 text-cosmic-silver">
                        Quantity: {userPack.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-gift text-cosmic-gold text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-cosmic-silver mb-2">No Booster Packs</h3>
                <p className="text-cosmic-silver/70">
                  You don't have any booster packs to open. Win games or purchase packs to get started!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ParticleCanvas from './BoosterAnimation';
import { Card, BoosterPack } from '@shared/schema';

interface CardInfoProps {
  onDeckCreated?: (deck: Card[]) => void;
}

const CardInfo = ({ onDeckCreated }: CardInfoProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBoosterPack, setShowBoosterPack] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Card[]>([]);
  const [particlesVisible, setParticlesVisible] = useState(false);
  const particleCanvasRef = useRef<any>(null);
  const queryClient = useQueryClient();

  // Fetch user's booster packs
  const { data: boosterPacks = [] } = useQuery<BoosterPack[]>({
    queryKey: ['/api/booster-packs'],
  });

  // Fetch all cards for deck creation
  const { data: allCards = [] } = useQuery<Card[]>({
    queryKey: ['/api/cards'],
  });

  // Create booster pack mutation
  const createBoosterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/booster-packs', {
        packType: 'Standard'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/booster-packs'] });
    },
  });

  // Open booster pack mutation
  const openBoosterMutation = useMutation({
    mutationFn: async (packId: number) => {
      const response = await apiRequest('POST', `/api/booster-packs/${packId}/open`);
      return response.json();
    },
    onSuccess: (data) => {
      setRevealedCards(data.revealedCards);
      setShowBoosterPack(false);
      setIsAnimating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/booster-packs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collection'] });
    },
  });

  useEffect(() => {
    if (allCards.length > 0 && onDeckCreated) {
      // Create a basic deck from available cards
      const basicDeck = allCards.slice(0, 30); // Take first 30 cards for a basic deck
      onDeckCreated(basicDeck);
    }
  }, [allCards, onDeckCreated]);

  const availablePacks = boosterPacks.filter(pack => !pack.isOpened);

  const openBooster = () => {
    if (availablePacks.length > 0) {
      setShowBoosterPack(true);
      setRevealedCards([]);
    }
  };

  const handleBoosterPackClick = (event: React.MouseEvent) => {
    if (availablePacks.length === 0) return;

    const packToOpen = availablePacks[0];
    setIsAnimating(true);

    if (particleCanvasRef.current) {
      particleCanvasRef.current.triggerExplosion(event.clientX, event.clientY);
      setParticlesVisible(true);
      setTimeout(() => {
        setParticlesVisible(false);
      }, 1000);
    }

    setTimeout(() => {
      openBoosterMutation.mutate(packToOpen.id);
    }, 1000);
  };

  const addBoosterPack = () => {
    createBoosterMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button 
          className="bg-gradient-to-r from-mystic-gold to-amber hover:from-amber hover:to-mystic-gold text-space-black font-medium rounded-lg text-sm px-5 py-2.5 transition-all duration-200 transform hover:scale-105"
          onClick={openBooster}
          disabled={availablePacks.length === 0}
        >
          Open Booster ({availablePacks.length})
        </button>
        <button 
          className="bg-gradient-to-r from-cosmic-blue to-midnight hover:from-midnight hover:to-cosmic-blue text-star-silver font-medium rounded-lg text-sm px-5 py-2.5 border border-mystic-gold/30 transition-all duration-200 transform hover:scale-105"
          onClick={addBoosterPack}
          disabled={createBoosterMutation.isPending}
        >
          {createBoosterMutation.isPending ? 'Adding...' : 'Add Booster'}
        </button>
      </div>

      {showBoosterPack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-cosmic-blue to-midnight rounded-2xl p-8 border-2 border-mystic-gold shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-mystic-gold mb-2">Open Booster Pack</h2>
              <p className="text-star-silver/70">Click the pack to reveal your cards!</p>
            </div>
            
            <div className="flex justify-center mb-6">
              <div 
                className={`w-48 h-64 bg-gradient-to-br from-mystic-gold to-amber rounded-xl border-4 border-mystic-gold shadow-2xl cursor-pointer transform transition-transform duration-300 hover:scale-105 ${isAnimating ? 'animate-spin' : ''}`}
                onClick={handleBoosterPackClick}
              >
                <div className="w-full h-full flex items-center justify-center rounded-lg bg-gradient-to-br from-cosmic-blue/20 to-transparent">
                  <div className="text-center">
                    <i className="fas fa-gift text-6xl text-space-black mb-4"></i>
                    <div className="text-space-black font-bold text-xl">Nebula Pack</div>
                    <div className="text-space-black/80 text-sm">5 Random Cards</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button 
                className="bg-cosmic-blue hover:bg-cosmic-blue/80 text-white px-6 py-3 rounded-lg transition-colors"
                onClick={() => setShowBoosterPack(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {particlesVisible && <ParticleCanvas ref={particleCanvasRef} visible={particlesVisible} />}

      {revealedCards.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-cosmic-blue to-midnight rounded-2xl p-8 border-2 border-mystic-gold shadow-2xl max-w-4xl">
            <h3 className="text-2xl font-bold text-mystic-gold mb-6 text-center">Cards Revealed!</h3>
            <div className="grid grid-cols-5 gap-4 mb-6">
              {revealedCards.map((card, index) => (
                <div key={index} className="bg-gradient-to-br from-cosmic-blue to-midnight rounded-lg p-3 border border-mystic-gold/50 transform animate-card-flip">
                  <div className="w-full h-32 bg-gradient-to-br from-mystic-gold/20 to-transparent rounded mb-2 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-mystic-gold font-semibold">{card.name}</div>
                      <div className="text-xs text-star-silver mt-1">
                        {card.type.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-star-silver">
                    {card.rarity || 'Common'}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button 
                className="bg-mystic-gold hover:bg-amber text-space-black font-semibold px-6 py-3 rounded-lg transition-colors"
                onClick={() => setRevealedCards([])}
              >
                Add to Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardInfo;

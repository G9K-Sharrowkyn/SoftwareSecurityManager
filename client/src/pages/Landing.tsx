import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StarBackground from '@/components/game/StarBackground';

const Landing: React.FC = () => {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-cosmic-blue/90 backdrop-blur-lg border-mystic-gold/30">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="text-4xl mb-2">🚀</div>
              <CardTitle className="text-2xl font-bold text-mystic-gold">
                Welcome to Proteus Nebula
              </CardTitle>
            </div>
            <p className="text-star-silver/80">
              Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, and dominate the galaxy.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-mystic-gold mb-2">Game Features</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-star-silver/70">
                  <div className="flex items-center space-x-2">
                    <span>⚔️</span>
                    <span>Strategic Combat</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🤖</span>
                    <span>AI Opponents</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>👥</span>
                    <span>Multiplayer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📦</span>
                    <span>Card Collection</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full bg-mystic-gold hover:bg-amber text-space-black font-bold py-3 text-lg transition-all duration-200 transform hover:scale-105"
            >
              Enter the Nebula
            </Button>

            <div className="text-center text-xs text-star-silver/50">
              Join thousands of commanders in epic space battles
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Landing;

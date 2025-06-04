import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarBackground from "@/components/layout/StarBackground";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative overflow-hidden">
      <StarBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6 animate-pulse">
            Proteus Nebula
          </h1>
          <p className="text-xl md:text-2xl text-cosmic-silver mb-8 max-w-3xl">
            Command your fleet across the cosmic battlefields. Collect powerful cards, 
            build strategic decks, and dominate the galaxy in this immersive trading card game.
          </p>
        </div>

        <Card className="bg-cosmic-800/90 backdrop-blur-md border-cosmic-gold/30 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <i className="fas fa-rocket text-cosmic-gold text-4xl mb-4 block"></i>
              <h2 className="text-2xl font-bold text-cosmic-gold mb-2">Join the Fleet</h2>
              <p className="text-cosmic-silver/80">
                Sign in to begin your galactic conquest
              </p>
            </div>

            <Button 
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark hover:from-cosmic-gold-dark hover:to-cosmic-gold text-cosmic-900 font-bold py-3 text-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Launching...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Launch Into Battle
                </>
              )}
            </Button>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-cosmic-700/50 rounded-lg p-3">
                  <i className="fas fa-users text-cosmic-gold text-lg mb-1 block"></i>
                  <div className="text-xs text-cosmic-silver">Multiplayer</div>
                </div>
                <div className="bg-cosmic-700/50 rounded-lg p-3">
                  <i className="fas fa-robot text-cosmic-gold text-lg mb-1 block"></i>
                  <div className="text-xs text-cosmic-silver">AI Opponents</div>
                </div>
                <div className="bg-cosmic-700/50 rounded-lg p-3">
                  <i className="fas fa-trophy text-cosmic-gold text-lg mb-1 block"></i>
                  <div className="text-xs text-cosmic-silver">Rankings</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-cosmic-gold mb-4">Game Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-600">
              <i className="fas fa-layer-group text-cosmic-gold text-3xl mb-3"></i>
              <h4 className="text-lg font-semibold text-cosmic-silver mb-2">Deck Building</h4>
              <p className="text-cosmic-silver/70 text-sm">
                Create powerful decks with strategic card combinations
              </p>
            </div>
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-600">
              <i className="fas fa-gift text-cosmic-gold text-3xl mb-3"></i>
              <h4 className="text-lg font-semibold text-cosmic-silver mb-2">Card Packs</h4>
              <p className="text-cosmic-silver/70 text-sm">
                Open booster packs to discover rare and legendary cards
              </p>
            </div>
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-600">
              <i className="fas fa-globe text-cosmic-gold text-3xl mb-3"></i>
              <h4 className="text-lg font-semibold text-cosmic-silver mb-2">Global Arena</h4>
              <p className="text-cosmic-silver/70 text-sm">
                Battle players worldwide in ranked competitions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

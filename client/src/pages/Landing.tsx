import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarBackground from "@/components/StarBackground";

export default function Landing() {
  return (
    <div className="min-h-screen bg-cosmic-black text-cosmic-silver relative overflow-hidden">
      <StarBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <i className="fas fa-rocket text-cosmic-gold text-6xl mr-4"></i>
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver animate-glow">
              Proteus Nebula
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-cosmic-silver mb-8 max-w-3xl mx-auto">
            Command your fleet across the cosmic battlefields. Collect powerful cards, 
            build strategic decks, and dominate the galaxy in this epic space card battle game.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-black font-bold px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              <i className="fas fa-play mr-2"></i>
              Enter the Galaxy
            </Button>
            
            <Button
              variant="outline"
              className="border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-cosmic-black px-8 py-4 text-lg"
            >
              <i className="fas fa-question-circle mr-2"></i>
              Learn to Play
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-sword text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Strategic Combat</h3>
              <p className="text-cosmic-silver/80">
                Master the 3-phase battle system: Command, Deployment, and Battle. 
                Every decision shapes the outcome of your galactic conquest.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-cosmic-gold/80 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trophy text-cosmic-black text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Competitive Play</h3>
              <p className="text-cosmic-silver/80">
                Face AI commanders or challenge other players in ranked battles. 
                Climb the leaderboards and prove your tactical superiority.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Card Collection</h3>
              <p className="text-cosmic-silver/80">
                Collect hundreds of unique cards featuring spaceships, aliens, 
                and cosmic weapons. Build the ultimate deck for victory.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-cosmic-silver/60 text-sm">
            Join thousands of commanders already exploring the Proteus Nebula
          </p>
        </div>
      </div>
    </div>
  );
}

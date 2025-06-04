import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import GameInterface from "@/components/game/GameInterface";
import StarBackground from "@/components/ui/star-background";

export default function Game() {
  const { matchId } = useParams();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: [`/api/matches/${matchId}`],
    enabled: !!matchId,
    retry: false,
  });

  const { data: cards } = useQuery({
    queryKey: ["/api/cards"],
    retry: false,
  });

  if (isLoading || matchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-cosmic-gold">Loading game...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!matchId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold text-cosmic-gold mb-4">No Match Selected</h1>
          <p className="text-foreground/70">Please select a match to play.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <GameInterface 
        matchId={matchId}
        user={user}
        match={match}
        cards={cards || []}
      />
    </div>
  );
}

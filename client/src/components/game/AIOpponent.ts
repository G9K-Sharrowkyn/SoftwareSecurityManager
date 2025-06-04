export class AIOpponent {
  constructor(private difficulty: string = 'Medium') {}

  makeMove(gameState: any, difficulty = this.difficulty): { type: string; data?: any } | null {
    // Very basic AI: simply end phase
    if (!gameState) return null;
    return { type: 'end_phase', data: {} };
  }
}

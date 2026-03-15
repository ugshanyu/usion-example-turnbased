export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export type Ship = {
  row: number;
  col: number;
  size: number;
  horizontal: boolean;
};

export type GamePhase = 'connecting' | 'waiting' | 'setup' | 'battle' | 'finished';

export type GameState = {
  phase: GamePhase;
  myId: string | null;
  roomId: string | null;
  playerIds: string[];
  myGrid: CellState[][];
  enemyGrid: CellState[][];
  myShips: Ship[];
  myTurn: boolean;
  winner: string | null;
  error: string | null;
  opponentReady: boolean;
};

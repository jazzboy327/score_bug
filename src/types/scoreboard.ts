export interface ScoreRow {
  id: string;
  game_id: number;
  inning: number;
  is_top: boolean;
  h_score: number;
  a_score: number;
  s_count: number;
  b_count: number;
  o_count: number;
  is_first: boolean;
  is_second: boolean;
  is_third: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameInfoRow {
  game_id: number;
  title: string;
  date_time: string;
  home_team: string;
  home_bg_color: string;
  away_team: string;
  away_bg_color: string;
  field: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameInfoWithScore extends GameInfoRow {
  current_score?: {
    h_score: number;
    a_score: number;
    inning: number;
    is_top: boolean;
  };
}

export interface GameInfoService {
  subscribeToGameInfoUpdates(callback: (gameInfo: GameInfoRow) => void): () => void;
  updateGameInfo(gameInfo: GameInfoRow): Promise<{success: boolean, error?: string}>;
  getGameInfo(gameId: number): Promise<GameInfoRow | null>;
  createGameInfo(gameInfo: Omit<GameInfoRow, 'game_id' | 'created_at' | 'updated_at'>): Promise<GameInfoRow | null>;
  getAllGames(): Promise<GameInfoRow[]>;
  getAllGamesWithScores(): Promise<GameInfoWithScore[]>;
  deleteGame(gameId: number): Promise<void>;
}

export interface ScoreService {
  subscribeToScoreUpdates(callback: (score: ScoreRow) => void): () => void;
  updateLiveScore(liveScore: ScoreRow): Promise<void>;
  getScore(gameId: number): Promise<ScoreRow | null>;
  createScore(gameId: number): Promise<ScoreRow | null>;
}
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
  away_team: string;
  created_at: string;
  updated_at: string;
} 
import { supabase } from "../utils/supabaseClient";
import type { ScoreRow } from '../types/scoreboard';

export const getScore = async () => {
  const { data, error } = await supabase.from('scores').select('*');
  if (error) throw error;
  return data;
};

export const updateScore = async (score: ScoreRow) => {
    const { error } = await supabase
      .from('scores')
      .upsert({
        home_score: score.h_score,
        away_score: score.a_score,
        inning: score.inning,
        is_top: score.is_top,
        s_count: score.s_count,
        b_count: score.b_count,
        o_count: score.o_count
      })
      .eq('game_id', score.game_id);

    if (error) throw error;
}
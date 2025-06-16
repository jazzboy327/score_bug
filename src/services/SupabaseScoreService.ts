import { supabase } from "../utils/supabaseClient";
import type { ScoreRow, ScoreService } from '../types/scoreboard';


export class SupabaseScoreService implements ScoreService {
    subscribeToScoreUpdates(callback: (score: ScoreRow) => void): () => void {
        const channel = supabase.channel('scores').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scores' }, (payload) => {
            callback(payload.new as ScoreRow);
        }).subscribe();
        return () => {
            channel.unsubscribe();
        }
    }
      
      async updateLiveScore(score: ScoreRow): Promise<void> {
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

    async getScore(gameId: number): Promise<ScoreRow | null> {
        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('game_id', gameId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    }
}

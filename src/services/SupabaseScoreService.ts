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
        console.log("updateLiveScore", score);
          const { error } = await supabase
            .from('scores')
            .update({
              h_score: score.h_score,
              a_score: score.a_score,
              inning: score.inning,
              is_top: score.is_top,
              is_first: score.is_first,
              is_second: score.is_second,
              is_third: score.is_third,
              s_count: score.s_count,
              b_count: score.b_count,
              o_count: score.o_count
            })
            .eq('game_id', score.game_id);
      
          if (error) throw error;
      }

    async getScore(gameId: number): Promise<ScoreRow | null> {
        console.log("getScore", gameId);
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

    async createScore(gameId: number): Promise<ScoreRow | null> {
        console.log("createScore", gameId);
        const defaultScore: Omit<ScoreRow, 'id' | 'created_at' | 'updated_at'> = {
            game_id: gameId,
            inning: 1,
            is_top: true,
            h_score: 0,
            a_score: 0,
            s_count: 0,
            b_count: 0,
            o_count: 0,
            is_first: false,
            is_second: false,
            is_third: false
        };

        const { data, error } = await supabase
            .from('scores')
            .insert(defaultScore)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

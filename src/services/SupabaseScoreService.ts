import { supabase } from "../utils/supabaseClient";
import type { ScoreRow, ScoreService } from '../types/scoreboard';


export class SupabaseScoreService implements ScoreService {
    subscribeToScoreUpdates(callback: (score: ScoreRow) => void): () => void {
        const channel = supabase.channel(`scores-${Date.now()}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scores' }, (payload) => {
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
              o_count: score.o_count,
              top_pitcher_name: score.top_pitcher_name,
              bottom_pitcher_name: score.bottom_pitcher_name,
              top_total_pitch: score.top_total_pitch,
              top_inning_pitch: score.top_inning_pitch,
              bottom_total_pitch: score.bottom_total_pitch,
              bottom_inning_pitch: score.bottom_inning_pitch,
            })
            .eq('game_id', score.game_id);

          if (error) throw error;
      }

    async savePitchInningLog(gameId: number, pitcherId: number, teamSide: 'top' | 'bottom', inning: number, isTop: boolean, pitchCount: number): Promise<void> {
        const { error } = await supabase
            .from('pitch_inning_log')
            .insert({ game_id: gameId, pitcher_id: pitcherId, team_side: teamSide, inning, is_top: isTop, pitch_count: pitchCount });
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

    async setPitcher(gameId: number, side: 'top' | 'bottom', playerId: number | null, playerName: string | null, totalPitch: number = 0): Promise<void> {
        const pitcherField  = side === 'top' ? 'top_pitcher_id'    : 'bottom_pitcher_id'
        const nameField     = side === 'top' ? 'top_pitcher_name'   : 'bottom_pitcher_name'
        const totalField    = side === 'top' ? 'top_total_pitch'    : 'bottom_total_pitch'
        const inningField   = side === 'top' ? 'top_inning_pitch'   : 'bottom_inning_pitch'

        const { error } = await supabase
            .from('scores')
            .update({ [pitcherField]: playerId, [nameField]: playerName, [totalField]: totalPitch, [inningField]: 0 })
            .eq('game_id', gameId)

        if (error) throw error
    }

    async getPitcherAccumulatedTotal(gameId: number, pitcherId: number): Promise<number> {
        const { data, error } = await supabase
            .from('pitch_inning_log')
            .select('pitch_count')
            .eq('game_id', gameId)
            .eq('pitcher_id', pitcherId)
        if (error || !data) return 0
        return data.reduce((sum, row) => sum + (row.pitch_count ?? 0), 0)
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

import { supabase } from "../utils/supabaseClient";
import type { GameInfoRow, GameInfoService } from '../types/scoreboard';

export class SupabaseGameinfoService implements GameInfoService {
    subscribeToGameInfoUpdates(callback: (gameInfo: GameInfoRow) => void): () => void {
        const channel = supabase.channel('game_info').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_info' }, (payload) => {
            callback(payload.new as GameInfoRow);
        }).subscribe();
        return () => {
            channel.unsubscribe();
        }
    }

    async updateGameInfo(gameInfo: GameInfoRow): Promise<{success: boolean, error?: string}> {
        const { error } = await supabase
          .from('game_info')
          .update({
            title: gameInfo.title,
            date_time: gameInfo.date_time,
            home_team: gameInfo.home_team,
            away_team: gameInfo.away_team,
            field: gameInfo.field,
            is_live: gameInfo.is_live
          })
          .eq('game_id', gameInfo.game_id);

        if (error) return {success: false, error: error.message};
        return {success: true};
    }
      
    async getGameInfo(gameId: number): Promise<GameInfoRow | null> {
        const { data, error } = await supabase
            .from('game_info')
            .select('*')
            .eq('game_id', gameId)
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    }

    async getAllGames(): Promise<GameInfoRow[]> {
        const { data, error } = await supabase
            .from('game_info')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createGameInfo(gameInfo: Omit<GameInfoRow, 'game_id' | 'created_at' | 'updated_at'>): Promise<GameInfoRow | null> {
        const { data, error } = await supabase
            .from('game_info')
            .insert(gameInfo)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteGame(gameId: number): Promise<void> {
        const { error } = await supabase
            .from('game_info')
            .delete()
            .eq('game_id', gameId);

        if (error) throw error;
    }
}


 
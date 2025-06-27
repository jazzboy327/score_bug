import { supabase } from "../utils/supabaseClient";
import type { GameInfoRow, GameInfoService, GameInfoWithScore } from '../types/scoreboard';
import { SupabaseJwtproviderService } from "./SupabaeJwtproviderService";

const jwtPayloadService = new SupabaseJwtproviderService();

export class SupabaseGameinfoService implements GameInfoService {
    async getUserId(): Promise<string> {
        const user = await jwtPayloadService.getUser();
        if (!user) throw new Error('User not found');
        return user.id;
    }

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
            home_bg_color: gameInfo.home_bg_color,
            away_bg_color: gameInfo.away_bg_color,
            field: gameInfo.field,
            is_live: gameInfo.is_live
          })
          .eq('game_id', gameInfo.game_id);

        if (error) return {success: false, error: error.message};
        return {success: true};
    }
      
    async getGameInfo(gameId: number): Promise<GameInfoRow | null> {
        console.log("getGameInfo", gameId)
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
            .order('created_at', { ascending: false })
            .eq('user_id', await this.getUserId());

        if (error) throw error;
        return data || [];
    }
    
    async getAllGamesWithScores(): Promise<GameInfoWithScore[]> {
        const { data, error } = await supabase
            .from('game_info')
            .select(`
                *,
                scores!inner(
                    h_score,
                    a_score,
                    inning,
                    is_top
                )
            `)
            .order('created_at', { ascending: false })
            .eq('user_id', await this.getUserId());


        if (error) throw error;
        
        // Transform the data to match our interface
        return (data || []).map(game => ({
            ...game,
            current_score: game.scores?.[0] ? {
                h_score: game.scores[0].h_score,
                a_score: game.scores[0].a_score,
                inning: game.scores[0].inning,
                is_top: game.scores[0].is_top
            } : undefined
        }));
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


 
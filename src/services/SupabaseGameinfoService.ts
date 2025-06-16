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

    async updateGameInfo(gameInfo: GameInfoRow): Promise<void> {
        const { error } = await supabase
          .from('game_info')
          .upsert({
            title: gameInfo.title,
            date_time: gameInfo.date_time,
            home_team: gameInfo.home_team,
            away_team: gameInfo.away_team
          })
          .eq('game_id', gameInfo.game_id);

        if (error) throw error;
      }
      


}


 
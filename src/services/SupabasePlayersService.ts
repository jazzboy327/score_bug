import { supabase } from "../utils/supabaseClient";
import type { PlayerRow } from '../types/scoreboard';

export class SupabasePlayersService {
    async getAllPlayersByTeam(teamId: number): Promise<PlayerRow[]> {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .order('number', { ascending: true, nullsFirst: false });

        if (error) throw error;
        return data || [];
    }

    async createPlayer(player: Omit<PlayerRow, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerRow> {
        const { data, error } = await supabase
            .from('players')
            .insert(player)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updatePlayer(playerId: number, updates: Partial<Omit<PlayerRow, 'id' | 'team_id' | 'created_at' | 'updated_at'>>): Promise<PlayerRow> {
        const { data, error } = await supabase
            .from('players')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', playerId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deletePlayer(playerId: number): Promise<void> {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId);

        if (error) throw error;
    }

    async uploadPhoto(teamId: number, file: File): Promise<string> {
        const ext = file.name.split('.').pop()
        const path = `${teamId}/${Date.now()}.${ext}`

        const { error } = await supabase.storage
            .from('player_photo')
            .upload(path, file, { upsert: true, contentType: file.type })

        if (error) throw error

        const { data } = supabase.storage
            .from('player_photo')
            .getPublicUrl(path)

        return data.publicUrl
    }
}

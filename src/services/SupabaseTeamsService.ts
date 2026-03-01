import { supabase } from "../utils/supabaseClient";
import type { TeamRow } from '../types/scoreboard';

export class SupabaseTeamsService {
    async getAllTeams(): Promise<TeamRow[]> {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    }

    async upsertTeam(team: { name: string; logo_url?: string; bg_color?: string }): Promise<TeamRow | null> {
        const { data, error } = await supabase
            .from('teams')
            .upsert(
                { ...team, updated_at: new Date().toISOString() },
                { onConflict: 'name' }
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

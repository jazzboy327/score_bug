import { supabase } from "../utils/supabaseClient";

export class SupabaseProfileService {
    async createProfile(userId: string, code: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .insert({ id: userId, code })
        if (error) throw error
    }

    async isCodeAvailable(code: string): Promise<boolean> {
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('code', code)
            .maybeSingle()
        return data === null
    }

    async getMyCode(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const { data } = await supabase
            .from('profiles')
            .select('code')
            .eq('id', user.id)
            .maybeSingle()
        return data?.code ?? null
    }
}

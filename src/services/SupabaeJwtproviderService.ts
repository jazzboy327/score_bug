import { supabase } from "../utils/supabaseClient";
import type { JwtPayload, JwtPayloadService } from '../types/jwtPayload'
import { jwtDecode } from "jwt-decode";
import { Appconfig } from "../config";
import type { User } from "@supabase/supabase-js";

export class SupabaseJwtproviderService implements JwtPayloadService {
    async getUser(): Promise<User | null> {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            throw new Error('Failed to get user')
        }
        return user;
    }

    // local storage에 저장된 토큰을 가져옴
    async getJwtPayload(): Promise<JwtPayload> {
        const token = localStorage.getItem(Appconfig.auth_token_key)
        if (!token) {
            throw new Error('No token found')
        }
        const decoded = jwtDecode(token)
        return decoded as JwtPayload
    }

    async isTokenExpired(): Promise<boolean> {
        const jwtPayload = await this.getJwtPayload()
        return jwtPayload?.expires_at! < Math.floor(Date.now() / 1000)
    }

    async refreshToken(): Promise<void> {
        const { data: { session } } = await supabase.auth.refreshSession()
        localStorage.setItem(Appconfig.auth_token_key, session?.access_token || '')
    }
    
}
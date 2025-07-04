import type { User } from "@supabase/supabase-js"

export interface JwtPayload {
    sub: string
    email: string
    exp: number
    [key: string]: any
}

export interface JwtPayloadService {
    getJwtPayload(): Promise<JwtPayload>
    isTokenExpired(): Promise<boolean>
    refreshToken(): Promise<void>
    getUser(): Promise<User | null>
}
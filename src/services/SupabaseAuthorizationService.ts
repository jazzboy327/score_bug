import { supabase } from "../utils/supabaseClient";

export interface AuthorizationService {
    updateUserRole(role: string): Promise<void>;
}


export class SupabaseAuthorizationService {
    async updateUserRole(role: string) {
    // 관리자 사용자 로그인 상태에서 실행
            await supabase.auth.updateUser({
                data: {
                    role: role, // user_metadata.role로 저장됨
                },
            });
        }
}
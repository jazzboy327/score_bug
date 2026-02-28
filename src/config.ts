export const Appconfig = {
    admin_panel_url: '/a',
    scoreboardA_v1_template_url: '/oa1/:gameId',
    scoreboardB_v1_template_url: '/ob1/:gameId',

    scoreboardA_template_url: '/oa/:gameId',
    scoreboardB_template_url: '/ob/:gameId',
    controller_url: '/c/:gameId',
    login_url: '/',
    register_url: '/r',
    edit_url: '/e/:gameId',

    // supabase auth token key (프로젝트 별로 이름이 다르다)
    auth_token_key: import.meta.env.VITE_SUPABASE_AUTH_TOKEN_KEY,
}
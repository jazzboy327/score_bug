-- =============================================
-- Score Bug v2.5 전체 스키마 (신규 DB 한 번에 적용)
-- =============================================
-- 변경 이력:
--   v1.0  : game_info, scores 기본 테이블
--   v1.5  : game_info 로고 URL, 폰트 크기 컬럼 추가
--   v2.0  : teams, players 테이블 추가
--   v2.1  : profiles 테이블 + 사용자 코드 기반 고정 URL
--   v2.2  : scores 투구수/투수ID/투수명 컬럼 추가, pitch_inning_log 테이블 추가
--   v2.4  : 전체 스키마 통합 (테이블 생성 순서 FK 의존성 기준 정렬)
--   v2.5  : pitch_inning_log ball_count/strike_count 추가, scores 이닝별 볼/스트라이크 추가, game_batter_stats 테이블 추가
-- =============================================
-- 실행 순서: game_info → teams → players → scores → profiles → pitch_inning_log → game_batter_stats
-- =============================================


-- =============================================
-- 1. game_info 테이블
--    경기 메타데이터 (팀명, 색상, 로고, 폰트, is_live)
-- =============================================

CREATE TABLE IF NOT EXISTS game_info (
  game_id             bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  date_time           timestamptz NOT NULL,
  home_team           text        NOT NULL,
  home_bg_color       text        NOT NULL DEFAULT '#374151',
  home_team_logo_url  text,
  away_team           text        NOT NULL,
  away_bg_color       text        NOT NULL DEFAULT '#f7f7f7',
  away_team_logo_url  text,
  field               text        NOT NULL DEFAULT '',
  is_live             boolean     NOT NULL DEFAULT false,
  title_font_size     integer     NOT NULL DEFAULT 23,
  team_name_font_size integer     NOT NULL DEFAULT 25,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  game_info                      IS '경기 메타데이터';
COMMENT ON COLUMN game_info.is_live              IS '현재 방송 중인 경기 여부 (유저당 1개만 true 권장)';
COMMENT ON COLUMN game_info.home_team_logo_url   IS '홈팀 로고 이미지 URL';
COMMENT ON COLUMN game_info.away_team_logo_url   IS '원정팀 로고 이미지 URL';
COMMENT ON COLUMN game_info.title_font_size      IS '시합 타이틀 폰트 크기 (px)';
COMMENT ON COLUMN game_info.team_name_font_size  IS '팀명 폰트 크기 (px)';

ALTER TABLE game_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_info_select" ON game_info FOR SELECT USING (true);
CREATE POLICY "game_info_insert" ON game_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_info_update" ON game_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "game_info_delete" ON game_info FOR DELETE USING (auth.uid() = user_id);


-- =============================================
-- 2. teams 테이블 (v2.0)
--    팀 정보 저장 (로고, 배경색 재사용)
-- =============================================

CREATE TABLE IF NOT EXISTS teams (
  id         bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name       text        NOT NULL UNIQUE,
  logo_url   text,
  bg_color   text                 DEFAULT '#374151',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE teams IS '팀 정보 (경기 등록 시 자동 저장/재사용)';

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_modify" ON teams FOR ALL  USING (auth.role() = 'authenticated');


-- =============================================
-- 3. players 테이블 (v2.0)
--    선수 정보 (등번호, 포지션, 투타, 사진)
-- =============================================

CREATE TABLE IF NOT EXISTS players (
  id                bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_id           bigint      NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  number            integer,
  name              text        NOT NULL,
  position          text,
  sub_position      text,
  hand_type         text,
  photo_url         text,
  pitcher_photo_url text,
  is_pitcher        boolean     NOT NULL DEFAULT false,
  is_batter         boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  players                    IS '선수 정보';
COMMENT ON COLUMN players.hand_type          IS '투타: 우투우타 / 우투좌타 / 좌투좌타 등';
COMMENT ON COLUMN players.is_pitcher         IS '투수 여부 (타자와 중복 가능)';
COMMENT ON COLUMN players.is_batter          IS '타자 여부 (투수와 중복 가능)';
COMMENT ON COLUMN players.pitcher_photo_url  IS '투수 전용 사진 URL (팝업 표시용)';

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_modify" ON players FOR ALL  USING (auth.role() = 'authenticated');


-- =============================================
-- 4. scores 테이블
--    실시간 스코어 (이닝, BSO, 주루 상황, 투구수, 투수 정보)
--    players 테이블 생성 후 FK 참조 가능
-- =============================================

CREATE TABLE IF NOT EXISTS scores (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id              bigint      NOT NULL REFERENCES game_info(game_id) ON DELETE CASCADE,
  inning               integer     NOT NULL DEFAULT 1,
  is_top               boolean     NOT NULL DEFAULT true,
  h_score              integer     NOT NULL DEFAULT 0,
  a_score              integer     NOT NULL DEFAULT 0,
  s_count              integer     NOT NULL DEFAULT 0,
  b_count              integer     NOT NULL DEFAULT 0,
  o_count              integer     NOT NULL DEFAULT 0,
  is_first             boolean     NOT NULL DEFAULT false,
  is_second            boolean     NOT NULL DEFAULT false,
  is_third             boolean     NOT NULL DEFAULT false,
  -- v2.2: 투수 ID
  top_pitcher_id       bigint      REFERENCES players(id),
  bottom_pitcher_id    bigint      REFERENCES players(id),
  -- v2.2: 투구수
  top_total_pitch      integer              DEFAULT 0,
  top_inning_pitch     integer              DEFAULT 0,
  bottom_total_pitch   integer              DEFAULT 0,
  bottom_inning_pitch  integer              DEFAULT 0,
  -- v2.2: 투수명 (표시용 캐시)
  top_pitcher_name     text,
  bottom_pitcher_name  text,
  -- v2.5: 이닝별 볼/스트라이크
  top_inning_ball      integer              DEFAULT 0,
  top_inning_strike    integer              DEFAULT 0,
  bottom_inning_ball   integer              DEFAULT 0,
  bottom_inning_strike integer              DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  scores                          IS '실시간 스코어 데이터';
COMMENT ON COLUMN scores.top_pitcher_id           IS '원정팀 투수 (is_top=false 말이닝에 등판)';
COMMENT ON COLUMN scores.bottom_pitcher_id        IS '홈팀 투수 (is_top=true 초이닝에 등판)';
COMMENT ON COLUMN scores.top_total_pitch          IS '원정팀 투수 총 투구수 (교체 시 초기화)';
COMMENT ON COLUMN scores.top_inning_pitch         IS '원정팀 투수 현재 이닝 투구수 (이닝 전환 시 초기화)';
COMMENT ON COLUMN scores.bottom_total_pitch       IS '홈팀 투수 총 투구수 (교체 시 초기화)';
COMMENT ON COLUMN scores.bottom_inning_pitch      IS '홈팀 투수 현재 이닝 투구수 (이닝 전환 시 초기화)';
COMMENT ON COLUMN scores.top_pitcher_name         IS '원정팀 투수 이름 (표시용 캐시)';
COMMENT ON COLUMN scores.bottom_pitcher_name      IS '홈팀 투수 이름 (표시용 캐시)';
COMMENT ON COLUMN scores.top_inning_ball          IS '원정팀 투수 현재 이닝 볼 수';
COMMENT ON COLUMN scores.top_inning_strike        IS '원정팀 투수 현재 이닝 스트라이크 수';
COMMENT ON COLUMN scores.bottom_inning_ball       IS '홈팀 투수 현재 이닝 볼 수';
COMMENT ON COLUMN scores.bottom_inning_strike     IS '홈팀 투수 현재 이닝 스트라이크 수';

ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert" ON scores FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM game_info WHERE game_id = scores.game_id)
);
CREATE POLICY "scores_update" ON scores FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM game_info WHERE game_id = scores.game_id)
);


-- =============================================
-- 5. profiles 테이블 (v2.1)
--    사용자 코드 기반 고정 URL
--    예: /oa/dan → 코드 "dan" 유저의 is_live=true 게임
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code       text        UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  profiles      IS '사용자 고유 코드 (고정 URL용)';
COMMENT ON COLUMN profiles.code IS '소문자 영문 시작, 영문/숫자/하이픈, 3~20자';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_code_format
  CHECK (code ~ '^[a-z][a-z0-9-]{2,19}$');

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);


-- =============================================
-- 6. pitch_inning_log 테이블 (v2.2)
--    이닝 전환 시 이닝별 투구수 기록 저장
-- =============================================
--
-- top/bottom 매핑 참고:
--   is_top = true  (초): 원정 공격 → 홈팀 투수 등판
--     → bottom_pitcher_id / team_side = 'bottom'
--   is_top = false (말): 홈팀 공격 → 원정팀 투수 등판
--     → top_pitcher_id / team_side = 'top'
--
-- 이닝 전환 시 동작:
--   초→말: bottom_inning_pitch → INSERT → bottom_inning_pitch = 0
--   말→초: top_inning_pitch    → INSERT → top_inning_pitch = 0
-- =============================================

CREATE TABLE IF NOT EXISTS pitch_inning_log (
  id          bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  game_id     bigint      NOT NULL REFERENCES game_info(game_id) ON DELETE CASCADE,
  pitcher_id  bigint      NOT NULL REFERENCES players(id),
  team_side   text        NOT NULL CHECK (team_side IN ('bottom', 'top')),
  inning      integer     NOT NULL,
  is_top      boolean     NOT NULL,
  pitch_count  integer     NOT NULL,
  -- v2.5: 이닝별 볼/스트라이크
  ball_count   integer     NOT NULL DEFAULT 0,
  strike_count integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pitch_inning_log_unique UNIQUE (game_id, pitcher_id, inning, is_top)
);

COMMENT ON TABLE  pitch_inning_log              IS '이닝별 투구수 기록 (이닝 전환 시 자동 저장)';
COMMENT ON COLUMN pitch_inning_log.team_side    IS 'bottom=홈팀투수, top=원정팀투수';
COMMENT ON COLUMN pitch_inning_log.is_top       IS 'true=초(홈팀투수), false=말(원정팀투수)';
COMMENT ON COLUMN pitch_inning_log.pitch_count  IS '해당 이닝에서 던진 투구수';
COMMENT ON COLUMN pitch_inning_log.ball_count   IS '해당 이닝에서 던진 볼 수';
COMMENT ON COLUMN pitch_inning_log.strike_count IS '해당 이닝에서 던진 스트라이크 수 (파울 포함)';

ALTER TABLE pitch_inning_log DISABLE ROW LEVEL SECURITY;


-- =============================================
-- 7. game_batter_stats 테이블 (v2.5)
--    경기별 타자 기록
-- =============================================

CREATE TABLE IF NOT EXISTS game_batter_stats (
  id          bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  game_id     bigint      NOT NULL REFERENCES game_info(game_id) ON DELETE CASCADE,
  player_id   bigint      REFERENCES players(id) ON DELETE SET NULL,
  player_name text        NOT NULL,
  team_side   text        NOT NULL CHECK (team_side IN ('home', 'away')),
  at_bats     integer     NOT NULL DEFAULT 0,
  hits        integer     NOT NULL DEFAULT 0,
  doubles     integer     NOT NULL DEFAULT 0,
  triples     integer     NOT NULL DEFAULT 0,
  home_runs   integer     NOT NULL DEFAULT 0,
  rbi         integer     NOT NULL DEFAULT 0,
  runs        integer     NOT NULL DEFAULT 0,
  walks       integer     NOT NULL DEFAULT 0,
  strikeouts  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  game_batter_stats            IS '경기별 타자 기록';
COMMENT ON COLUMN game_batter_stats.team_side  IS 'home=홈팀, away=원정팀';
COMMENT ON COLUMN game_batter_stats.at_bats    IS '타수';
COMMENT ON COLUMN game_batter_stats.hits       IS '안타';
COMMENT ON COLUMN game_batter_stats.doubles    IS '2루타';
COMMENT ON COLUMN game_batter_stats.triples    IS '3루타';
COMMENT ON COLUMN game_batter_stats.home_runs  IS '홈런';
COMMENT ON COLUMN game_batter_stats.rbi        IS '타점';
COMMENT ON COLUMN game_batter_stats.runs       IS '득점';
COMMENT ON COLUMN game_batter_stats.walks      IS '볼넷';
COMMENT ON COLUMN game_batter_stats.strikeouts IS '삼진';

ALTER TABLE game_batter_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batter_stats_select" ON game_batter_stats FOR SELECT USING (true);
CREATE POLICY "batter_stats_insert" ON game_batter_stats FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM game_info WHERE game_id = game_batter_stats.game_id)
);
CREATE POLICY "batter_stats_update" ON game_batter_stats FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM game_info WHERE game_id = game_batter_stats.game_id)
);
CREATE POLICY "batter_stats_delete" ON game_batter_stats FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM game_info WHERE game_id = game_batter_stats.game_id)
);


-- =============================================
-- 9. 트리거: 신규 유저 가입 시 profiles 자동 생성
--    signUp options.data.code 값을 사용
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, code)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'code')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =============================================
-- 10. Realtime 활성화
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE game_info;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE pitch_inning_log;

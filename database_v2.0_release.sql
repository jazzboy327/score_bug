-- =============================================
-- Score Bug v2.0 릴리즈 DDL
-- =============================================
-- v1.5: 팀 로고 및 폰트 크기 커스터마이징
-- v2.0: teams, players 테이블 추가 (팀 관리 + 콤보박스 연동)
-- =============================================
-- 신규 DB에 전체 적용하거나, v1.5 이후 DB에는
-- [v2.0 신규] 섹션만 실행하면 됩니다.
-- =============================================


-- =============================================
-- [v1.5] game_info 테이블 컬럼 추가
-- =============================================

ALTER TABLE game_info
ADD COLUMN IF NOT EXISTS home_team_logo_url TEXT,
ADD COLUMN IF NOT EXISTS away_team_logo_url TEXT,
ADD COLUMN IF NOT EXISTS title_font_size INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS team_name_font_size INTEGER DEFAULT 30;

COMMENT ON COLUMN game_info.home_team_logo_url IS '홈팀 로고 이미지 URL';
COMMENT ON COLUMN game_info.away_team_logo_url IS '원정팀 로고 이미지 URL';
COMMENT ON COLUMN game_info.title_font_size IS '시합 타이틀 폰트 크기 (px)';
COMMENT ON COLUMN game_info.team_name_font_size IS '팀명 폰트 크기 (px)';

UPDATE game_info
SET
    title_font_size = 30,
    team_name_font_size = 30
WHERE
    title_font_size IS NULL
    OR team_name_font_size IS NULL;


-- =============================================
-- [v2.0] teams 테이블
-- =============================================

CREATE TABLE IF NOT EXISTS teams (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  logo_url text,
  bg_color text DEFAULT '#374151',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_modify" ON teams FOR ALL USING (auth.role() = 'authenticated');


-- =============================================
-- [v2.0] players 테이블 (선수 관리 - 추후 활용)
-- =============================================

CREATE TABLE IF NOT EXISTS players (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_id bigint NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  number integer,
  name text NOT NULL,
  position text,
  sub_position text,
  hand_type text,  -- 투타: 우투우타 / 우투좌타 / 좌투좌타 등
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_modify" ON players FOR ALL USING (auth.role() = 'authenticated');

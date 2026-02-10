-- =============================================
-- Score Bug v1.5 업그레이드 DDL
-- =============================================
-- 학교 로고 및 폰트 크기 커스터마이징 기능 추가

-- game_info 테이블에 새 컬럼 추가
ALTER TABLE game_info 
ADD COLUMN IF NOT EXISTS home_team_logo_url TEXT,
ADD COLUMN IF NOT EXISTS away_team_logo_url TEXT,
ADD COLUMN IF NOT EXISTS title_font_size INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS team_name_font_size INTEGER DEFAULT 30;

-- 컬럼 설명 추가
COMMENT ON COLUMN game_info.home_team_logo_url IS '홈팀 로고 이미지 URL';
COMMENT ON COLUMN game_info.away_team_logo_url IS '원정팀 로고 이미지 URL';
COMMENT ON COLUMN game_info.title_font_size IS '시합 타이틀 폰트 크기 (px)';
COMMENT ON COLUMN game_info.team_name_font_size IS '팀명 폰트 크기 (px)';

-- 기존 데이터에 기본값 적용
UPDATE game_info 
SET 
    title_font_size = 30,
    team_name_font_size = 30
WHERE 
    title_font_size IS NULL 
    OR team_name_font_size IS NULL;


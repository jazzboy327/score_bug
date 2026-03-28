-- =============================================
-- Score Bug v2.5 업그레이드 마이그레이션
-- 기존 DB에 적용 (신규 DB는 v2.4 full schema 이후 이 파일 실행)
-- =============================================
-- 변경 내용:
--   1. pitch_inning_log: ball_count, strike_count 컬럼 추가
--   2. scores: top/bottom inning_ball, inning_strike 컬럼 추가
--   3. game_batter_stats 테이블 신규 생성
-- =============================================

-- 1. pitch_inning_log 볼/스트라이크 컬럼 추가
ALTER TABLE pitch_inning_log
  ADD COLUMN IF NOT EXISTS ball_count   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strike_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN pitch_inning_log.ball_count   IS '해당 이닝에서 던진 볼 수';
COMMENT ON COLUMN pitch_inning_log.strike_count IS '해당 이닝에서 던진 스트라이크 수 (파울 포함)';

-- 중복 방지: 동일 게임/투수/이닝에 upsert 허용
ALTER TABLE pitch_inning_log
  DROP CONSTRAINT IF EXISTS pitch_inning_log_unique;
ALTER TABLE pitch_inning_log
  ADD CONSTRAINT pitch_inning_log_unique UNIQUE (game_id, pitcher_id, inning, is_top);

-- 2. scores 이닝별 볼/스트라이크 컬럼 추가
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS top_inning_ball      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_inning_strike    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bottom_inning_ball   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bottom_inning_strike integer DEFAULT 0;

COMMENT ON COLUMN scores.top_inning_ball      IS '원정팀 투수 현재 이닝 볼 수';
COMMENT ON COLUMN scores.top_inning_strike    IS '원정팀 투수 현재 이닝 스트라이크 수';
COMMENT ON COLUMN scores.bottom_inning_ball   IS '홈팀 투수 현재 이닝 볼 수';
COMMENT ON COLUMN scores.bottom_inning_strike IS '홈팀 투수 현재 이닝 스트라이크 수';

-- 3. game_batter_stats 테이블 생성
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

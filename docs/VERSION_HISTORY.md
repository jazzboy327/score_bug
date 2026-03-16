# Score Bug — 버전 이력

---

## v2.1
**주요 변경사항**

- **고정 URL**: 사용자 코드 기반 URL — `/oa/코드`, `/ob/코드`, `/c/코드` 접속 시 `is_live=true` 게임 자동 표시
- **is_live 토글**: AdminPanel에서 방송중/OFF 원클릭 전환, 전체 OFF 가능
- **실시간 is_live 감지**: WebSocket으로 is_live 변경 시 스코어보드/컨트롤러 자동 전환
- **회원가입 코드 등록**: 소문자 영문 시작 3~20자 고유 코드 입력 (중복 불가)
- **profiles 테이블 추가**: 사용자 코드 저장, 신규 가입 시 트리거로 자동 생성
- **teams 테이블 활용**: 팀 등록/선택 기능, 로고·배경색 재사용
- **선수 관리**: 팀별 선수 등록/수정/삭제, 사진 업로드, 투수/타자 구분
- **선수 프로필 팝업**: 방송 화면에 선수 카드 슬라이드 애니메이션 표시
- **GameCard 상태 배지**: is_live 기준으로 방송중/대기중/종료 표시 개선
- **날짜 기준 상태 판정**: 년월일만 비교 — 지난 날짜=종료, 당일=대기중, 미래=대기중

**DB 변경**
- `profiles` 테이블 추가 (id, code)
- `teams` 테이블 추가 (name, logo_url, bg_color)
- `players` 테이블 추가 (team_id, number, name, position, hand_type, player_type, photo_url)
- `database_v2.1_full_schema.sql` — 전체 스키마 한 번에 생성 가능

---

## v2.0

**주요 변경사항**

- teams, players 테이블 추가
- 선수 등록/관리 화면 (`/p`)
- 선수 팝업 방송 기능 (ScoreControl에서 팝업 전송)

---

## v1.5

**주요 변경사항**

- 팀 로고 URL 지원 — ScoreboardA/B 모두 표시
- 폰트 크기 커스터마이징 — 타이틀(16~50px), 팀명(20~60px)
- 설정 모달 통합 (로고 + 폰트 + 배경색)
- 실시간 미리보기

**DB 변경** (`game_info` 컬럼 추가)

| 컬럼 | 타입 | 기본값 |
|------|------|--------|
| `home_team_logo_url` | TEXT | NULL |
| `away_team_logo_url` | TEXT | NULL |
| `title_font_size` | INTEGER | 30 |
| `team_name_font_size` | INTEGER | 30 |

---

## v1.0

**주요 기능**

- 경기 등록/수정/삭제
- 실시간 스코어 컨트롤러 (`/c/:gameId`)
- ScoreboardA — 세로형 오버레이 (330×180px 기준)
- ScoreboardB — 가로형 오버레이 (1210×47px)
- Supabase Realtime WebSocket 기반 실시간 업데이트
- BSO 카운트, 주루 상황, 이닝 관리

# Score Bug System v2.1

야구 경기 실시간 스코어보드 관리 시스템입니다.
Supabase WebSocket 기반으로 스코어, 이닝, 볼카운트를 실시간 관리하며 OBS 등 방송 소프트웨어에서 오버레이로 사용할 수 있습니다.

📖 **[사용자 가이드](./docs/USERGUIDE.md)** · 📋 **[버전 이력](./docs/VERSION_HISTORY.md)**

## 주요 기능

- **실시간 스코어보드**: A타입(세로형 330×180px), B타입(가로형 1210×47px) 두 가지 오버레이 템플릿
- **고정 URL** _(v2.1)_: 사용자 코드 기반 URL — `/oa/코드` 접속 시 `is_live` 게임 자동 표시
- **is_live 토글** _(v2.1)_: AdminPanel에서 원클릭으로 활성 경기 전환, 스코어보드 자동 전환
- **경기 관리**: 경기 생성, 수정, 삭제
- **팀 관리**: 팀 정보(로고, 배경색) 저장 및 재사용
- **선수 관리** _(v2.0)_: 팀별 선수 등록/수정/삭제, 사진 업로드
- **선수 프로필 팝업** _(v2.0)_: 방송 화면에 선수 카드 슬라이드 애니메이션 표시
- **테마 커스터마이징**: 팀별 배경색, 로고, 폰트 크기 설정

## 기술 스택

- **Frontend**: React 19, TypeScript (strict), Tailwind CSS 4, Vite
- **Backend**: Supabase (PostgreSQL, Realtime WebSocket, Auth)
- **Deployment**: Vercel
- **Package Manager**: yarn

## 프로젝트 구조

```
src/
├── components/
│   ├── AdminPanel.tsx        # 경기 목록 관리자 패널
│   ├── GameCard.tsx          # 경기 카드 컴포넌트
│   ├── GameForm.tsx          # 경기 등록/수정 폼
│   ├── Login.tsx             # 로그인/회원가입 페이지
│   ├── PlayerManagement.tsx  # 선수 등록/관리 화면
│   ├── ScoreControl.tsx      # 실시간 스코어 컨트롤러
│   ├── ScoreboardA.tsx       # A타입 스코어보드 오버레이
│   └── ScoreboardB.tsx       # B타입 스코어보드 오버레이
├── services/
│   ├── SupabaseGameinfoService.ts
│   ├── SupabaseScoreService.ts
│   ├── SupabaseTeamsService.ts
│   ├── SupabasePlayersService.ts
│   ├── SupabaseProfileService.ts  # v2.1 신규
│   ├── SupabaseAuthorizationService.ts
│   └── SupabaeJwtproviderService.ts
├── types/
│   └── scoreboard.ts
├── utils/
│   ├── colorUtils.ts
│   ├── dateUtils.ts
│   └── supabaseClient.ts
├── hooks/
│   ├── userAuth.ts
│   └── userInfo.ts
├── styles/
│   └── playerPopup.css
└── config.ts
```

## 라우트 구조

| 경로 | 컴포넌트 | 인증 | 설명 |
|------|----------|------|------|
| `/` | `Login` | | 로그인 / 회원가입 |
| `/a` | `AdminPanel` | ✅ | 경기 목록 관리, 고정 URL 확인 |
| `/r` | `GameForm` | ✅ | 새 경기 등록 |
| `/e/:gameId` | `GameForm` | ✅ | 경기 수정 |
| `/p` | `PlayerManagement` | ✅ | 선수 등록/관리 |
| `/c/:code` or `/c/:gameId` | `ScoreControl` | ✅ | 실시간 스코어 컨트롤러 |
| `/oa/:code` or `/oa/:gameId` | `ScoreboardA` | | A타입 오버레이 (330×180px 기준) |
| `/ob/:code` or `/ob/:gameId`| `ScoreboardB` | | B타입 오버레이 (1210×47px) |


> `:id` 파라미터는 **숫자(gameId)** 또는 **문자열(사용자 코드)** 모두 사용 가능합니다.
> - 숫자: 해당 gameId의 경기를 직접 표시
> - 문자열: 해당 코드 유저의 `is_live=true` 경기를 자동으로 찾아 표시

## 데이터베이스 스키마

| 테이블 | 설명 |
|--------|------|
| `game_info` | 경기 메타데이터 (팀명, 색상, 로고, 폰트, is_live) |
| `scores` | 실시간 스코어 (이닝, BSO, 주루 상황) |
| `teams` | 팀 정보 (로고 URL, 배경색) |
| `players` | 선수 정보 (등번호, 이름, 포지션, 투타, 사진) |
| `profiles` | 사용자 코드 (고정 URL용) _(v2.1 신규)_ |

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd score_bug
yarn install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정합니다:

```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_SUPABASE_AUTH_TOKEN_KEY=sb-[project-ref]-auth-token
```

> `VITE_SUPABASE_AUTH_TOKEN_KEY`: 프로젝트 ref 기반 자동 생성 토큰 이름
> 예: ref가 `abcdef1234`이면 → `sb-abcdef1234-auth-token`

### 3. Supabase 데이터베이스 설정

Supabase 대시보드 → **SQL Editor** 에서 `database_v2.1_full_schema.sql` 전체를 실행합니다.

포함 내용:
- `game_info`, `scores`, `teams`, `players`, `profiles` 테이블 생성
- 모든 RLS 정책
- 신규 유저 가입 시 profiles 자동 생성 트리거
- Realtime 활성화

### 4. Supabase Storage 버킷 생성

1. Supabase 대시보드 → **Storage** → **New bucket**
2. 버킷명: `player_photo`, Public: `false`
3. **Storage** → **Policies** → `player_photo` 버킷에 다음 RLS 정책 추가:

```sql
CREATE POLICY "player_photo_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'player_photo');

CREATE POLICY "player_photo_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'player_photo' AND auth.role() = 'authenticated');

CREATE POLICY "player_photo_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'player_photo' AND auth.role() = 'authenticated');

CREATE POLICY "player_photo_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'player_photo' AND auth.role() = 'authenticated');
```

### 5. Supabase 인증 설정

**Authentication** → **Providers** → **Email** 에서:
- **Confirm email**: 개발 중에는 OFF 권장 (이메일 발송 rate limit 방지)

**Authentication** → **URL Configuration** 에서:
- **Site URL**: `http://localhost:5173` (개발) / 프로덕션 URL
- **Redirect URLs**: `http://localhost:5173/a` 추가

### 6. 개발 서버 실행

```bash
yarn dev
# http://localhost:5173
```

## 명령어

```bash
yarn dev      # 개발 서버 실행
yarn build    # TypeScript 컴파일 + Vite 빌드 → dist/
yarn lint     # ESLint 실행
yarn preview  # 프로덕션 빌드 로컬 미리보기
```

## Vercel 배포

| 항목 | 값 |
|------|----|
| Framework | Vite (자동 감지) |
| Build Command | `yarn build` |
| Output Directory | `dist` |
| Install Command | `yarn install` |

Vercel 프로젝트 설정 → **Environment Variables** 에서 `.env`와 동일하게 설정하세요.

배포 후 Supabase **Site URL** 과 **Redirect URLs** 를 프로덕션 도메인으로 업데이트하세요.

## 버전 이력

| 버전 | 주요 변경사항 |
|------|-------------|
| v1.0 | game_info, scores 기본 테이블, 스코어보드 A/B 타입 |
| v1.5 | 팀 로고 URL, 폰트 크기 커스터마이징 |
| v2.0 | teams, players 테이블, 선수 관리, 선수 팝업 |
| v2.1 | profiles 테이블, 사용자 코드 기반 고정 URL, is_live 토글 |

## 라이선스

© 2025 Sco-B System. All rights reserved.

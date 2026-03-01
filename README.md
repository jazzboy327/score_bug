# Score Bug System v2.0.0

야구 경기 스코어보드 관리 시스템입니다. 실시간으로 경기 점수, 이닝, 볼카운트 등을 관리하고 다양한 형태의 스코어보드를 제공합니다.

## 🚀 주요 기능

- **실시간 스코어보드**: A타입(세로형), B타입(가로형) 두 가지 스코어보드 템플릿
- **경기 관리**: 경기 생성, 수정, 삭제
- **팀 관리**: 팀 정보(로고, 배경색) 저장 및 재사용
- **선수 관리**: 팀별 선수 등록/수정/삭제, 사진 업로드 _(v2.0 신규)_
- **선수 프로필 팝업**: 방송 화면에 선수 카드 슬라이드 애니메이션 표시 _(v2.0 신규)_
- **실시간 업데이트**: Supabase 실시간 구독으로 즉시 반영
- **테마 커스터마이징**: 팀별 배경색, 로고, 폰트 크기 설정
- **인증 시스템**: Supabase Auth를 통한 사용자 관리

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript (strict), Tailwind CSS 4, Vite
- **Backend**: Supabase (PostgreSQL, Real-time, Auth, Storage)
- **Deployment**: Vercel
- **Package Manager**: yarn

## 📋 프로젝트 구조

```
src/
├── components/
│   ├── AdminPanel.tsx        # 경기 목록 관리자 패널
│   ├── GameCard.tsx          # 경기 카드 컴포넌트
│   ├── GameForm.tsx          # 경기 등록/수정 폼 (팀 콤보박스 포함)
│   ├── Login.tsx             # 로그인 페이지
│   ├── PlayerManagement.tsx  # 선수 등록/관리 화면 (v2.0 신규)
│   ├── ScoreControl.tsx      # 스코어 컨트롤러 (선수 팝업 포함)
│   ├── ScoreboardA.tsx       # A타입 스코어보드 (세로형)
│   └── ScoreboardB.tsx       # B타입 스코어보드 (가로형)
├── services/
│   ├── SupabaseGameinfoService.ts
│   ├── SupabaseScoreService.ts
│   ├── SupabaseTeamsService.ts    # (v2.0 신규)
│   ├── SupabasePlayersService.ts  # (v2.0 신규)
│   ├── SupabaseAuthorizationService.ts
│   └── SupabaeJwtproviderService.ts
├── types/
│   └── scoreboard.ts         # 공통 타입 정의
├── utils/
│   ├── colorUtils.ts
│   └── supabaseClient.ts
├── hooks/
│   ├── userAuth.ts
│   └── userInfo.ts
├── styles/
│   └── playerPopup.css       # 선수 팝업 슬라이드 애니메이션 (v2.0 신규)
└── config.ts
```

## 🗺️ 라우트 구조

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `Login` | 로그인 |
| `/a` | `AdminPanel` | 경기 목록 관리 |
| `/r` | `GameForm` | 새 경기 등록 |
| `/e/:gameId` | `GameForm` | 경기 수정 |
| `/c/:gameId` | `ScoreControl` | 실시간 스코어 컨트롤러 |
| `/oa/:gameId` | `ScoreboardA` | A타입 스코어보드 오버레이 |
| `/ob/:gameId` | `ScoreboardB` | B타입 스코어보드 오버레이 |
| `/p` | `PlayerManagement` | 선수 등록/관리 _(v2.0 신규)_ |

## 🗄️ 데이터베이스 스키마

### v2.0 테이블 구성

| 테이블 | 설명 |
|--------|------|
| `game_info` | 경기 메타데이터 (팀명, 색상, 로고, 폰트 크기) |
| `scores` | 실시간 스코어 (이닝, BSO, 주루 상황) |
| `teams` | 팀 정보 저장 (로고 URL, 배경색) _(v2.0 신규)_ |
| `players` | 선수 정보 (등번호, 이름, 포지션, 투타, 사진) _(v2.0 신규)_ |

### Supabase Storage

| 버킷 | 설명 |
|------|------|
| `player_photo` | 선수 프로필 사진 _(v2.0 신규)_ |

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd score_bug
```

### 2. 의존성 설치

```bash
yarn install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_SUPABASE_AUTH_TOKEN_KEY=sb-[project-ref]-auth-token
```

> `VITE_SUPABASE_AUTH_TOKEN_KEY`는 Supabase 프로젝트 ref 기반으로 자동 생성되는 토큰 이름입니다.
> 예: 프로젝트 ref가 `ansxsldpfwefqomeuwsu1`이면 → `sb-ansxsldpfwefqomeuwsu1-auth-token`

### 4. 개발 서버 실행

```bash
yarn dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

## 🔧 Supabase 설정 가이드

### 1. 데이터베이스 테이블 생성

SQL Editor에서 `database_v2.0_release.sql` 파일 전체를 실행하세요.

이 파일에는 다음이 포함됩니다:
- `game_info` 테이블 및 v1.5 컬럼 마이그레이션 (로고 URL, 폰트 크기)
- `scores` 테이블
- `teams` 테이블 (v2.0 신규)
- `players` 테이블 (v2.0 신규)
- 모든 테이블 RLS 정책

### 2. 실시간 기능 활성화

Supabase 대시보드 > **Database** > **Replication** 에서 `game_info`, `scores` 테이블의 실시간 기능을 활성화하세요.

### 3. Storage 버킷 생성 (v2.0)

1. Supabase 대시보드 > **Storage** > **New bucket**
2. 버킷명: `player_photo`, Public: `false`
3. **Storage** > **Policies** > `player_photo` 버킷에 다음 RLS 정책 추가:

```sql
-- 전체 공개 읽기
CREATE POLICY "player_photo_select"
ON storage.objects FOR SELECT
USING ( bucket_id = 'player_photo' );

-- 인증된 사용자만 업로드
CREATE POLICY "player_photo_insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'player_photo' AND auth.role() = 'authenticated' );

-- 인증된 사용자만 수정
CREATE POLICY "player_photo_update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'player_photo' AND auth.role() = 'authenticated' );

-- 인증된 사용자만 삭제
CREATE POLICY "player_photo_delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'player_photo' AND auth.role() = 'authenticated' );
```

### 4. 인증 설정

**Authentication** > **Settings** 에서:
- **Site URL**: `http://localhost:5173` (개발) / 프로덕션 URL
- **Redirect URLs**: `http://localhost:5173/a` 추가

## 🚀 Vercel 배포 가이드

### 빌드 설정

| 항목 | 값 |
|------|----|
| Framework | Vite (자동 감지) |
| Build Command | `yarn build` |
| Output Directory | `dist` |
| Install Command | `yarn install` |

### 환경 변수

Vercel 프로젝트 설정 > **Environment Variables** 에서 `.env`와 동일하게 설정하세요.

### 배포 후 Supabase 설정

- **Site URL** → 프로덕션 도메인으로 변경
- **Redirect URLs** → `https://your-domain.vercel.app/a` 추가

## 📱 사용법

### 경기 관리

1. `/a` 관리자 패널에서 새 경기 등록
2. 팀명 입력 시 저장된 팀 콤보박스에서 선택하면 로고·색상 자동 적용
3. 테마 저장 시 팀 정보가 자동으로 teams 테이블에 저장

### 선수 관리 _(v2.0 신규)_

1. 관리자 패널 우측 상단 **"👤 선수 관리"** 버튼 클릭 또는 `/p` 접속
2. 팀 선택 후 **"+ 선수 등록"** 클릭
3. 등번호, 이름, 주포지션, 부포지션, 투타, 사진 업로드
4. 카드 hover 시 나타나는 ✏ / ✕ 버튼으로 수정·삭제
5. 우측 상단 **2열 / 3열 / 4열** 버튼으로 그리드 레이아웃 전환

### 선수 프로필 팝업 _(v2.0 신규)_

컨트롤러(`/c/:gameId`) 하단 **"👤 선수 프로필 팝업"** 섹션:
1. 어웨이/홈 팀 토글 선택
2. 선수 선택
3. 표시 위치 선택 (왼쪽 / 오른쪽)
4. **확인** 버튼 → 스코어보드에 3초간 슬라이드 팝업 표시

### 스코어보드 오버레이

- **A타입** (세로형, 330×180px): `/oa/{gameId}`
- **B타입** (가로형, 1210×47px): `/ob/{gameId}`
- OBS 등 방송 소프트웨어에서 브라우저 소스로 추가

## 📄 라이선스

© 2025 Sco-B System. All rights reserved.

# Score Bug System

야구 경기 스코어보드 관리 시스템입니다. 실시간으로 경기 점수, 이닝, 볼카운트 등을 관리하고 다양한 형태의 스코어보드를 제공합니다.

## 🚀 주요 기능

- **실시간 스코어보드**: A타입, B타입 두 가지 스코어보드 템플릿
- **경기 관리**: 경기 생성, 수정, 삭제
- **실시간 업데이트**: Supabase 실시간 구독으로 즉시 반영
- **테마 커스터마이징**: 팀별 배경색 설정
- **반응형 디자인**: 다양한 화면 크기에 최적화
- **인증 시스템**: Supabase Auth를 통한 사용자 관리

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Deployment**: Vercel
- **Package Manager**: yarn

## 📋 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── AdminPanel.tsx   # 관리자 패널
│   ├── GameCard.tsx     # 경기 카드 컴포넌트
│   ├── GameForm.tsx     # 경기 등록/수정 폼
│   ├── Login.tsx        # 로그인 페이지
│   ├── ScoreControl.tsx # 스코어 컨트롤러
│   ├── ScoreboardA.tsx  # A타입 스코어보드
│   └── ScoreboardB.tsx  # B타입 스코어보드
├── services/            # Supabase 서비스
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
├── hooks/              # 커스텀 훅
└── config.ts           # 설정 파일
```

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

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
yarn dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

## 🔧 Supabase 설정 가이드

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 이름과 데이터베이스 비밀번호를 설정합니다.
3. 프로젝트가 생성되면 대시보드로 이동합니다.

### 2. 데이터베이스 테이블 생성

SQL Editor에서 다음 SQL을 실행하여 필요한 테이블을 생성합니다:

```sql
-- 게임 정보 테이블
CREATE TABLE game_info (
    game_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    field VARCHAR(100),
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_live BOOLEAN DEFAULT false,
    home_bg_color VARCHAR(7) DEFAULT '#374151',
    away_bg_color VARCHAR(7) DEFAULT '#f7f7f7',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스코어 테이블
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES game_info(game_id) ON DELETE CASCADE,
    inning INTEGER DEFAULT 1,
    is_top BOOLEAN DEFAULT true,
    b_count INTEGER DEFAULT 0,
    s_count INTEGER DEFAULT 0,
    o_count INTEGER DEFAULT 0,
    h_score INTEGER DEFAULT 0,
    a_score INTEGER DEFAULT 0,
    is_first BOOLEAN DEFAULT false,
    is_second BOOLEAN DEFAULT false,
    is_third BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE game_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 모든 작업 가능하도록 정책 설정
CREATE POLICY "Enable all for authenticated users" ON game_info
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON scores
    FOR ALL USING (auth.role() = 'authenticated');
```

### 3. 실시간 기능 활성화

1. Supabase 대시보드에서 **Database** > **Replication** 메뉴로 이동
2. **Real-time** 섹션에서 `game_info`와 `scores` 테이블의 실시간 기능을 활성화

### 4. 인증 설정

1. **Authentication** > **Settings** 메뉴로 이동
2. **Site URL**을 개발 환경에서는 `http://localhost:5173`으로 설정
3. **Redirect URLs**에 다음을 추가:
   - `http://localhost:5173`
   - `http://localhost:5173/a`
   - `http://localhost:5173/c/*`

### 5. 환경 변수 설정

프로젝트 설정에서 다음 정보를 복사하여 `.env.local`에 설정:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Vercel 배포 가이드

### 1. Vercel 계정 설정

1. [Vercel](https://vercel.com)에 가입하고 GitHub 계정과 연결
2. **New Project**를 클릭하여 새 프로젝트 생성

### 2. 프로젝트 연결

1. GitHub 저장소를 선택
2. 프레임워크는 **Vite**로 자동 감지됨
3. **Root Directory**는 기본값 유지

### 3. 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수들을 설정:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 배포 설정

- **Build Command**: `yarn build`
- **Output Directory**: `dist`
- **Install Command**: `yarn install`

### 5. 배포 실행

**Deploy** 버튼을 클릭하여 배포를 시작합니다.

### 6. 도메인 설정 (선택사항)

1. **Settings** > **Domains**에서 커스텀 도메인 추가
2. DNS 설정을 Vercel에서 제공하는 값으로 변경

### 7. Supabase 프로덕션 설정

배포 후 Supabase 대시보드에서:

1. **Authentication** > **Settings**에서 **Site URL**을 프로덕션 URL로 변경
2. **Redirect URLs**에 프로덕션 URL 추가:
   - `https://your-domain.vercel.app`
   - `https://your-domain.vercel.app/a`
   - `https://your-domain.vercel.app/c/*`

## 📱 사용법

### 1. 관리자 로그인

1. 루트 URL(`/`)에서 로그인
2. 이메일과 비밀번호로 인증
3. 관리자 패널(`/a`)로 자동 이동

### 2. 경기 관리

- **새 경기 등록**: "New Game" 버튼 클릭
- **경기 수정**: 경기 카드의 "✏️ 경기 수정" 버튼
- **경기 삭제**: 드롭다운 메뉴의 "🗑️ 삭제" 옵션

### 3. 스코어보드 사용

- **A타입 스코어보드**: `/o/{gameId}/a`
- **B타입 스코어보드**: `/o/{gameId}/b`
- **컨트롤러**: `/c/{gameId}`

### 4. 실시간 업데이트

- 스코어보드는 실시간으로 업데이트됩니다
- 컨트롤러에서 변경사항이 즉시 반영됩니다

## 🔧 개발 가이드

### 새로운 컴포넌트 추가

```bash
# 컴포넌트 생성
touch src/components/NewComponent.tsx

# 타입 정의 추가
# src/types/에 관련 타입 정의
```

### 스타일링

- Tailwind CSS 사용
- 컴포넌트별 스타일링
- 반응형 디자인 고려

### 상태 관리

- React hooks 사용
- Supabase 실시간 구독
- 로컬 상태와 서버 상태 분리

## 🐛 문제 해결

### 일반적인 문제

1. **인증 오류**: Supabase 설정 확인
2. **실시간 업데이트 안됨**: RLS 정책 및 실시간 설정 확인
3. **배포 실패**: 환경 변수 설정 확인

### 로그 확인

```bash
# 개발 서버 로그
yarn dev

# 빌드 로그
yarn build
```

## 📄 라이선스

© 2025 Sco-B System. All rights reserved.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

# Score Bug v1.5 업그레이드 가이드

## 🎉 새로운 기능

### 1. 팀 로고 표시 기능
- 홈팀과 원정팀의 로고 이미지를 표시할 수 있습니다
- 로고 URL을 입력하면 팀명 옆에 자동으로 표시됩니다
- ScoreboardA와 ScoreboardB 템플릿 모두 지원

### 2. 폰트 크기 커스터마이징
- **시합 타이틀 폰트 크기**: 16px ~ 50px (슬라이더로 조정 가능)
- **팀명 폰트 크기**: 20px ~ 60px (슬라이더로 조정 가능)
- 실시간 미리보기 기능으로 변경사항을 즉시 확인

### 3. 통합 설정 모달
- 기존 배경색 설정과 새로운 기능들을 하나의 모달에 통합
- 섹션별로 구분된 깔끔한 UI
- 실시간 미리보기로 변경사항 확인 가능

## 📋 데이터베이스 업그레이드

### 실행 방법
데이터베이스를 업그레이드하려면 다음 SQL 파일을 실행하세요:

```bash
psql -h [호스트] -U [사용자명] -d [데이터베이스명] -f database_v1.5_upgrade.sql
```

또는 Supabase SQL Editor에서 `database_v1.5_upgrade.sql` 파일의 내용을 복사하여 실행하세요.

### 추가된 컬럼

| 컬럼명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `home_team_logo_url` | TEXT | NULL | 홈팀 로고 이미지 URL |
| `away_team_logo_url` | TEXT | NULL | 원정팀 로고 이미지 URL |
| `title_font_size` | INTEGER | 30 | 시합 타이틀 폰트 크기 (px) |
| `team_name_font_size` | INTEGER | 36 | 팀명 폰트 크기 (px) |

## 🔧 업그레이드 단계

### 1단계: 데이터베이스 업그레이드
```sql
-- database_v1.5_upgrade.sql 파일 실행
```

### 2단계: 코드 업데이트
```bash
# Git에서 최신 코드 받기
git pull origin main

# 의존성 설치 (필요한 경우)
yarn install

# 빌드
yarn build
```

### 3단계: 배포
```bash
# Vercel 배포 (자동 배포 설정된 경우 git push만으로 충분)
vercel --prod
```

## 📖 사용 방법

### 1. 관리자 패널에서 설정하기

1. **관리자 패널** 접속
2. 경기 카드에서 **🎨 테마 변경** 버튼 클릭
3. 설정 모달에서 다음 항목 조정:

#### 🏫 팀 로고
- 홈팀/원정팀 로고 URL 입력
- 이미지 URL은 직접 접근 가능한 주소여야 합니다
- 예: `https://example.com/logo.png`
- 입력 후 미리보기에서 즉시 확인 가능
- 📋 **팀 로고 참조**: [대한야구소프트볼협회 팀 정보](http://www.korea-baseball.com/info/team/team_list)

#### 📏 폰트 크기
- **시합 타이틀 폰트 크기**: 슬라이더 또는 숫자 입력으로 조정 (16-50px)
- **팀명 폰트 크기**: 슬라이더 또는 숫자 입력으로 조정 (20-60px)
- 미리보기에서 실시간으로 변경사항 확인

#### 🎨 배경색
- 기존과 동일하게 홈팀/원정팀 배경색 설정

4. **저장** 버튼 클릭

### 2. 로고 이미지 준비

#### 권장 사항
- **형식**: PNG (투명 배경 권장), SVG, JPG
- **크기**: 가로 200px 이상 권장
- **비율**: 정사각형 또는 가로로 약간 긴 비율 권장
- **용량**: 500KB 이하 권장 (로딩 속도 고려)

#### 이미지 호스팅 옵션
1. **Supabase Storage** (권장)
   - 프로젝트 내에서 통합 관리
   - 안정적인 접근성

2. **외부 이미지 호스팅**
   - Imgur, Cloudinary 등
   - CORS 정책 확인 필요

3. **팀 로고 찾기**
   - [대한야구소프트볼협회 팀 정보](http://www.korea-baseball.com/info/team/team_list)에서 팀별 로고 확인 가능
   - 우클릭으로 이미지 URL 복사하여 사용

## 🎯 기본값

새로운 경기를 생성할 때 기본값:
- `title_font_size`: 30px
- `team_name_font_size`: 36px
- `home_team_logo_url`: NULL (로고 없음)
- `away_team_logo_url`: NULL (로고 없음)

## 🔄 하위 호환성

- 기존 경기는 자동으로 기본값이 적용됩니다
- 로고 URL이 없는 경우 팀명만 표시됩니다
- ScoreboardA와 ScoreboardB 모두 정상 작동합니다

## 📱 템플릿별 특징

### ScoreboardA (세로형)
- 타이틀 기본 크기: 30px
- 팀명 기본 크기: 36px
- 로고 최대 높이: 팀명 폰트 크기 × 1.2
- 로고 최대 너비: 60px

### ScoreboardB (가로형)
- 타이틀 기본 크기: 23px
- 팀명 기본 크기: 25px
- 로고 최대 높이: 팀명 폰트 크기 × 1.2
- 로고 최대 너비: 40px

## 🐛 문제 해결

### 로고가 표시되지 않는 경우
1. 이미지 URL이 올바른지 확인
2. 이미지가 HTTPS로 제공되는지 확인
3. CORS 정책으로 차단되지 않았는지 확인
4. 브라우저 개발자 도구(F12)에서 콘솔 에러 확인

### 폰트 크기가 적용되지 않는 경우
1. 페이지 새로고침
2. 브라우저 캐시 삭제
3. 데이터베이스에 값이 저장되었는지 확인

### 데이터베이스 컬럼 추가 실패
```sql
-- 수동으로 각 컬럼 추가 시도
ALTER TABLE game_info ADD COLUMN home_team_logo_url TEXT;
ALTER TABLE game_info ADD COLUMN away_team_logo_url TEXT;
ALTER TABLE game_info ADD COLUMN title_font_size INTEGER DEFAULT 30;
ALTER TABLE game_info ADD COLUMN team_name_font_size INTEGER DEFAULT 36;
```

## 📝 변경 파일 목록

### 추가된 파일
- `database_v1.5_upgrade.sql` - 데이터베이스 마이그레이션 스크립트
- `UPGRADE_V1.5.md` - 이 문서

### 수정된 파일
- `src/types/scoreboard.ts` - GameInfoRow 인터페이스에 새 필드 추가
- `src/services/SupabaseGameinfoService.ts` - updateGameInfo에 새 필드 포함
- `src/components/AdminPanel.tsx` - 설정 모달 UI 개선
- `src/components/ScoreboardA.tsx` - 로고 표시 및 동적 폰트 크기 적용
- `src/components/ScoreboardB.tsx` - 로고 표시 및 동적 폰트 크기 적용
- `src/components/GameForm.tsx` - 새 게임 생성 시 기본값 설정

## 🎨 미리보기

### 설정 모달
- 3개 섹션으로 구성: 팀 로고, 폰트 크기, 배경색
- 실시간 미리보기 기능
- 직관적인 슬라이더 및 입력 필드

### 스코어보드
- 로고가 팀명 옆에 자연스럽게 표시
- 폰트 크기가 실시간으로 반영
- 기존 기능 모두 정상 작동

## 📞 지원

문제가 발생하거나 질문이 있으시면:
1. GitHub Issues에 등록
2. 개발자에게 문의

---

**버전**: 1.5.0  
**릴리스 날짜**: 2025-12-17  
**호환성**: v1.0.0 이상


import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"
import type { ScoreRow, GameInfoRow } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"
import { getContrastYIQ } from "../utils/colorUtils"

const gameInfoService: SupabaseGameinfoService = new SupabaseGameinfoService();
const scoreService: SupabaseScoreService = new SupabaseScoreService();

function Circle({ active, color = 'green', size = 32 }: { active?: boolean; color?: 'green' | 'yellow' | 'red'; size?: number }) {
  const bgColor = active
    ? color === 'red'
      ? '#ef4444'
      : color === 'yellow'
      ? '#eab308'
      : '#4ade80'
    : '#d1d5db'
  return <span style={{ 
    display: 'inline-block', 
    width: `${size}px`, 
    height: `${size}px`, 
    borderRadius: '50%', 
    backgroundColor: bgColor,
    margin: '0 4px'
  }} />
}

export default function ScoreboardA() {
  const { gameId} = useParams<{ gameId: string}>()
  const [score, setScore] = useState<ScoreRow | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfoRow | null>(null)

  const baseWidth = 700;
  const baseHeight = 345;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const widthRatio = windowWidth / baseWidth;
      const heightRatio = windowHeight / baseHeight;
      setScale(Math.min(widthRatio, heightRatio));
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const fetchScore = async () => {
      const data = await scoreService.getScore(Number(gameId));
      if (data) {
        console.log("fetchScore", data)
        setScore(data)
      }
    }
    const fetchGameInfo = async () => {
      const data = await gameInfoService.getGameInfo(Number(gameId));
      if (data) {
        console.log("fetchGameInfo", data)
        setGameInfo(data)
      }
    }
    const unsubscribeScore = scoreService.subscribeToScoreUpdates((newScore) => {
      if (newScore.game_id === Number(gameId)) {
        setScore(newScore);
      }
    });

    const unsubscribeGameInfo = gameInfoService.subscribeToGameInfoUpdates((newGameInfo) => {
      if (newGameInfo.game_id === Number(gameId)) {
        setGameInfo(newGameInfo);
      }
    });

    fetchScore()
    fetchGameInfo()

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribeScore()
      unsubscribeGameInfo()
    }
  }, [gameId])

  const inning = score?.inning ?? 1
  const isTop = score?.is_top ?? true
  const bCount = score?.b_count ?? 0
  const sCount = score?.s_count ?? 0
  const oCount = score?.o_count ?? 0
  const homeScore = score?.h_score ?? 0
  const awayScore = score?.a_score ?? 0
  const is_first = score?.is_first ?? false
  const is_second = score?.is_second ?? false
  const is_third = score?.is_third ?? false
  const homeTeam = gameInfo?.home_team ?? "HOME TEAM"
  const awayTeam = gameInfo?.away_team ?? "AWAY TEAM"
  const gameTitle = gameInfo?.title ?? "TITLE"

  const hBgColor = gameInfo?.home_bg_color ?? "#374151"
  const aBgColor = gameInfo?.away_bg_color ?? "#f7f7f7"
  const hTextColor = getContrastYIQ(hBgColor)
  const aTextColor = getContrastYIQ(aBgColor)
console.log(hBgColor, aBgColor, hTextColor, aTextColor)

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' }}>
  <div
    ref={containerRef}
    style={{
      width: '700px',
      height: '345px',
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      opacity: 1
    }}
  >
    {/* SCOREBOARD 콘텐츠 */}
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6' }}>
      {/* 1. 상단: 타이틀 */}
      <div style={{ height: '19%', fontSize: '30px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#000000' }}>
        {gameTitle}
      </div>
      {/* 2. 중앙: 팀 + 주루 + 이닝 */}
      <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, padding: 0, height: '63%' }}>

        {/* 왼쪽 70%: 어웨이 / 홈 팀 점수 */}
        <div style={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ 
            backgroundColor: aBgColor, 
            display: 'flex', 
            alignItems: 'center', 
            height: '50%',
            color: aTextColor === 'text-white' ? '#ffffff' : '#000000'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700', textAlign: 'center', padding: '8px 16px', width: '70%' }}>{awayTeam}</div>
            <div style={{ fontSize: '60px', fontWeight: '700', textAlign: 'center', width: '30%' }}>{awayScore}</div>
          </div>
          <div style={{ 
            backgroundColor: hBgColor, 
            display: 'flex', 
            alignItems: 'center', 
            height: '50%',
            color: hTextColor === 'text-white' ? '#ffffff' : '#000000'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700', textAlign: 'center', padding: '8px 16px', width: '70%' }}>{homeTeam}</div>
            <div style={{ fontSize: '60px', fontWeight: '700', textAlign: 'center', width: '30%' }}>{homeScore}</div>
          </div>
        </div>

  {/* 오른쪽 30%: 주루 상황 + 이닝 */}
  <div style={{ width: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', backgroundColor: '#d1d5db' }}>

    {/* 주루 마름모 */}
    <div style={{ position: 'relative', width: '128px', height: '128px' }}>
      {/* 2루 */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        width: '48px', 
        height: '48px', 
        transform: 'translateX(-50%) rotate(45deg)',
        backgroundColor: is_second ? '#eab308' : '#ffffff' 
      }} />
      {/* 1루 */}
      <div style={{ 
        position: 'absolute', 
        bottom: '33.33%', 
        left: '66.67%', 
        width: '48px', 
        height: '48px', 
        transform: 'translateY(66.67%) rotate(45deg)',
        backgroundColor: is_first ? '#eab308' : '#ffffff' 
      }} />
      {/* 3루 */}
      <div style={{ 
        position: 'absolute', 
        bottom: '33.33%', 
        right: '66.67%', 
        width: '48px', 
        height: '48px', 
        transform: 'translateY(66.67%) rotate(45deg)',
        backgroundColor: is_third ? '#eab308' : '#ffffff' 
      }} />
     </div>

    {/* 이닝 정보 */}
    <div style={{ fontSize: '36px', fontWeight: '600', color: '#f97316' }}>{inning} {isTop ? '▲' : '▼'}</div>
  </div>
</div>

{/* 3. 하단: BSO */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  gap: '48px', 
  padding: '0 16px', 
  fontSize: '20px', 
  fontWeight: '700', 
  height: '18%', 
  backgroundColor: '#f3f4f6', 
  color: '#000000' 
}}>

  {/* B */}
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '37%', borderRight: '1px solid #d9d9d9' }}>
    <div style={{ fontSize: '36px', marginRight: '8px' }}>B</div>
    <div style={{ display: 'flex', gap: '8px' }}>
      {[...Array(3)].map((_, i) => (
              <Circle key={i} active={i < bCount} color="green" size={32} />
        ))}
    </div>
  </div>

  {/* S */}
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '34%', borderRight: '1px solid #d9d9d9' }}>
    <div style={{ fontSize: '36px', marginRight: '8px' }}>S</div>
    <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
      {[...Array(2)].map((_, i) => (
              <Circle key={i} active={i < sCount} color="yellow" size={32} />
            ))}
    </div>
  </div>

  {/* O */}
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '29%' }}>
    <div style={{ fontSize: '36px', marginRight: '8px' }}>O</div>
    <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
      {[...Array(2)].map((_, i) => (
              <Circle key={i} active={i < oCount} color="red" size={32} />
            ))}
    </div>
  </div>
</div>
</div>
</div>
</div>
  );
}

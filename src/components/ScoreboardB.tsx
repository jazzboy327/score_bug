import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"
import type { ScoreRow, GameInfoRow } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"
import { getContrastYIQ } from "../utils/colorUtils"

const gameInfoService: SupabaseGameinfoService = new SupabaseGameinfoService();
const scoreService: SupabaseScoreService = new SupabaseScoreService();

function Circle({ active, color = 'green', size = 16 }: { active?: boolean; color?: 'green' | 'yellow' | 'red'; size?: number }) {
  const bgColor = active
    ? color === 'red'
      ? '#ef4444'
      : color === 'yellow'
      ? '#eab308'
      : '#4ade80'
    : '#9ca3af'
  return <span style={{ 
    display: 'inline-block', 
    width: `${size}px`, 
    height: `${size}px`, 
    borderRadius: '50%', 
    backgroundColor: bgColor,
    margin: '0px 2px',
    padding: 0,
    boxSizing: 'border-box',
    flexShrink: 0
  }} />
}

export default function ScoreboardB() {
  const { gameId} = useParams<{ gameId: string}>()
  const [score, setScore] = useState<ScoreRow | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfoRow | null>(null)

  const baseWidth = 1200;
  const baseHeight = 60;
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
        console.log("fetchScore")
        setScore(data)
      }
    }
    const fetchGameInfo = async () => {
      const data = await gameInfoService.getGameInfo(Number(gameId));
      if (data) {
        console.log("fetchGameInfo")
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


  return (
    <div style={{ position: 'fixed', top: '0px', left: '0px', right: '0px', bottom: '0px', backgroundColor: 'transparent', margin: 0, padding: 0 }}>
      <div
        ref={containerRef}
        style={{
          width: '1200px',
          height: '60px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          opacity: 1,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box'
        }}
      >
        {/* SCOREBOARD 콘텐츠 */}
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
          {/* 1. 좌측: 타이틀 */}
          <div style={{ 
            width: '400px', 
            height: '100%', 
            fontSize: '20px', 
            fontWeight: '600', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#e5e7eb', 
            color: '#000000',
            boxSizing: 'border-box',
            margin: 0,
            padding: '0px 8px',
            lineHeight: '1.2',
            textAlign: 'center'
          }}>
            {gameTitle}
          </div>
          {/* 2. 중앙: 팀, 점수 */}
          <div style={{ position: 'relative', display: 'flex', width: '400px', height: '100%', justifyContent: 'center' }}>
            {/*  어웨이 / 홈 팀 점수 */}
            <div style={{ 
              backgroundColor: aBgColor, 
              display: 'flex', 
              width: '50%', 
              fontWeight: '600', 
              alignItems: 'center',
              color: aTextColor === 'text-white' ? '#ffffff' : '#000000',
              boxSizing: 'border-box',
              margin: 0
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', textAlign: 'center', padding: '4px 8px', width: '70%', boxSizing: 'border-box', lineHeight: '1.2' }}>{awayTeam}</div>
              <div style={{ fontSize: '30px', fontWeight: '700', textAlign: 'center', width: '30%', boxSizing: 'border-box', lineHeight: '1' }}>{awayScore}</div>
            </div>
            <div style={{ 
              backgroundColor: hBgColor, 
              display: 'flex', 
              width: '50%', 
              fontWeight: '600', 
              alignItems: 'center',
              color: hTextColor === 'text-white' ? '#ffffff' : '#000000',
              boxSizing: 'border-box',
              margin: 0
            }}>
              <div style={{ fontSize: '30px', fontWeight: '700', textAlign: 'center', width: '30%', boxSizing: 'border-box', lineHeight: '1' }}>{homeScore}</div>
              <div style={{ fontSize: '18px', fontWeight: '700', textAlign: 'center', padding: '4px 8px', width: '70%', boxSizing: 'border-box', lineHeight: '1.2' }}>{homeTeam}</div>
            </div>
          </div>

        {/* 3. 우측: 이닝 주루 BSO */}
        <div style={{ 
          display: 'flex', 
          width: '400px', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '0px 8px', 
          fontSize: '16px', 
          fontWeight: '700', 
          backgroundColor: '#1a1a1a', 
          color: '#ffffff',
          boxSizing: 'border-box',
          margin: 0
        }}>
        {/* 이닝 정보 */}
        <div style={{ display: 'flex', width: '40px', fontSize: '24px', justifyContent: 'center', color: '#f97316', lineHeight: '1', boxSizing: 'border-box' }}>
          {inning} {isTop ? '▲' : '▼'}
        </div>
        {/* 주루 마름모 */}
        <div style={{ position: 'relative', width: '70px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          {/* 2루 */}
          <div style={{ 
            position: 'absolute', 
            top: '12px', 
            left: '50%', 
            width: '16px', 
            height: '16px', 
            transform: 'translateX(-50%) rotate(45deg)',
            backgroundColor: is_second ? '#eab308' : '#9ca3af',
            boxSizing: 'border-box',
            margin: 0,
            padding: 0
          }} />
          {/* 1루 */}
          <div style={{ 
            position: 'absolute', 
            bottom: '37%', 
            right: '12px', 
            width: '16px', 
            height: '16px', 
            transform: 'translateY(50%) rotate(45deg)',
            backgroundColor: is_first ? '#eab308' : '#9ca3af',
            boxSizing: 'border-box',
            margin: 0,
            padding: 0
          }} />
          {/* 3루 */}
          <div style={{ 
            position: 'absolute', 
            bottom: '37%', 
            left: '12px', 
            width: '16px', 
            height: '16px', 
            transform: 'translateY(50%) rotate(45deg)',
            backgroundColor: is_third ? '#eab308' : '#9ca3af',
            boxSizing: 'border-box',
            margin: 0,
            padding: 0
          }} />
        </div>
        {/* B */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '16px', lineHeight: '1', fontWeight: '700' }}>B</div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(3)].map((_, i) => (
                    <Circle key={i} active={i < bCount} color="green" size={16} />
              ))}
          </div>
        </div>
        {/* S */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '16px', lineHeight: '1', fontWeight: '700' }}>S</div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(2)].map((_, i) => (
                    <Circle key={i} active={i < sCount} color="yellow" size={16} />
                  ))}
          </div>
        </div>
        {/* O */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '16px', lineHeight: '1', fontWeight: '700' }}>O</div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(2)].map((_, i) => (
                    <Circle key={i} active={i < oCount} color="red" size={16} />
                  ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"
import type { ScoreRow, GameInfoRow, OverlayPosition, PlayerPopupPayload } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"
import { getContrastYIQ } from "../utils/colorUtils"
import { supabase } from "../utils/supabaseClient"
import '../styles/playerPopup.css'

const gameInfoService = new SupabaseGameinfoService();
const scoreService = new SupabaseScoreService();

function Circle({ active, color = 'green', size = 32 }: { active?: boolean; color?: 'green' | 'yellow' | 'red'; size?: number }) {
  const bgColor = active
    ? color === 'red' ? '#ef4444' : color === 'yellow' ? '#eab308' : '#4ade80'
    : '#d1d5db'
  return <span style={{
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: bgColor,
    margin: '0px 4px',
    padding: 0,
    boxSizing: 'border-box',
    flexShrink: 0
  }} />
}

function getPositionContainerStyle(position: OverlayPosition): React.CSSProperties {
  switch (position) {
    case 'top-left':      return { position: 'absolute', top: 10, left: 10 }
    case 'top-center':    return { position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center' }
    case 'top-right':     return { position: 'absolute', top: 10, right: 10 }
    case 'bottom-left':   return { position: 'absolute', bottom: 10, left: 10 }
    case 'bottom-center': return { position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center' }
    case 'bottom-right':  return { position: 'absolute', bottom: 10, right: 10 }
  }
}

function getTransformOrigin(position: OverlayPosition): string {
  switch (position) {
    case 'top-left':      return 'top left'
    case 'top-center':    return 'top center'
    case 'top-right':     return 'top right'
    case 'bottom-left':   return 'bottom left'
    case 'bottom-center': return 'bottom center'
    case 'bottom-right':  return 'bottom right'
  }
}

export default function ScoreboardA() {
  const { gameId } = useParams<{ gameId: string }>()
  const [score, setScore] = useState<ScoreRow | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfoRow | null>(null)
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>('top-left')
  const [overlayScale, setOverlayScale] = useState(1.0)
  const [playerPopup, setPlayerPopup] = useState<PlayerPopupPayload | null>(null)
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchScore = async () => {
      const data = await scoreService.getScore(Number(gameId))
      if (data) setScore(data)
    }
    const fetchGameInfo = async () => {
      const data = await gameInfoService.getGameInfo(Number(gameId))
      if (data) setGameInfo(data)
    }

    const unsubscribeScore = scoreService.subscribeToScoreUpdates((newScore) => {
      if (newScore.game_id === Number(gameId)) setScore(newScore)
    })
    const unsubscribeGameInfo = gameInfoService.subscribeToGameInfoUpdates((newGameInfo) => {
      if (newGameInfo.game_id === Number(gameId)) setGameInfo(newGameInfo)
    })

    const overlayChannel = supabase
      .channel(`overlay-control-${gameId}`)
      .on('broadcast', { event: 'OVERLAY_UPDATE' }, ({ payload }) => {
        if (payload.position) setOverlayPosition(payload.position as OverlayPosition)
        if (payload.scale !== undefined) setOverlayScale(payload.scale as number)
      })
      .on('broadcast', { event: 'PLAYER_POPUP' }, ({ payload }) => {
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
        setImgOrientation('portrait')
        setPlayerPopup(payload as PlayerPopupPayload)
        popupTimerRef.current = setTimeout(() => setPlayerPopup(null), 3000)
      })
      .subscribe()

    fetchScore()
    fetchGameInfo()

    return () => {
      unsubscribeScore()
      unsubscribeGameInfo()
      supabase.removeChannel(overlayChannel)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
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
  const homeLogoUrl = gameInfo?.home_team_logo_url
  const awayLogoUrl = gameInfo?.away_team_logo_url
  // B 타입(400px) 기준 폰트 크기를 A 타입(350px) 비율로 환산 (350/400 = 0.875)
  const titleFontSize = Math.round((gameInfo?.title_font_size ?? 30) * (350 / 400))
  const teamNameFontSize = gameInfo?.team_name_font_size ?? 36
  const hBgColor = gameInfo?.home_bg_color ?? "#374151"
  const aBgColor = gameInfo?.away_bg_color ?? "#f7f7f7"
  const hTextColor = getContrastYIQ(hBgColor)
  const aTextColor = getContrastYIQ(aBgColor)

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', margin: 0, padding: 0 }}>
      <div style={getPositionContainerStyle(overlayPosition)}>
        <div style={{
          width: '330px',
          height: '180px',
          transform: `scale(${overlayScale})`,
          transformOrigin: getTransformOrigin(overlayPosition),
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box',
        }}>
          {/* SCOREBOARD 콘텐츠 */}
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6', boxSizing: 'border-box' }}>
            {/* 1. 상단: 타이틀 */}
            <div style={{ height: '25%', fontSize: `${titleFontSize}px`, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#000000', boxSizing: 'border-box', padding: '0px 16px', lineHeight: '1.2', textAlign: 'center', margin: 0 }}>
              {gameTitle}
            </div>
            {/* 2. 중앙: 팀 + 주루 + 이닝 */}
            <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, padding: 0, height: '50%' }}>
              {/* 왼쪽 57%: 어웨이 / 홈 팀 점수 */}
              <div style={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                {/* 어웨이: 로고 → 팀명 → 스코어 */}
                <div style={{ backgroundColor: aBgColor, display: 'flex', fontWeight: '600', alignItems: 'center', height: '55%', color: aTextColor === 'text-white' ? '#ffffff' : '#000000', boxSizing: 'border-box', margin: 0 }}>
                  <div style={{ width: '35px', height: '35px', flexShrink: 0, margin: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {awayLogoUrl && <img src={awayLogoUrl} alt={`${awayTeam} 로고`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />}
                  </div>
                  <div style={{ flex: 1, fontSize: `${teamNameFontSize}px`, fontWeight: '700', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden' }}>
                    {awayTeam}
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: '700', textAlign: 'center', width: '50px', flexShrink: 0, lineHeight: '1' }}>{awayScore}</div>
                </div>
                {/* 홈: 로고 → 팀명 → 스코어 */}
                <div style={{ backgroundColor: hBgColor, display: 'flex', fontWeight: '600', alignItems: 'center', height: '50%', color: hTextColor === 'text-white' ? '#ffffff' : '#000000', boxSizing: 'border-box', margin: 0 }}>
                  <div style={{ width: '35px', height: '35px', flexShrink: 0, margin: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {homeLogoUrl && <img src={homeLogoUrl} alt={`${homeTeam} 로고`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />}
                  </div>
                  <div style={{ flex: 1, fontSize: `${teamNameFontSize}px`, fontWeight: '700', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden' }}>
                    {homeTeam}
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: '700', textAlign: 'center', width: '50px', flexShrink: 0, lineHeight: '1' }}>{homeScore}</div>
                </div>
              </div>

              {/* 오른쪽 30%: 주루 상황 + 이닝 */}
              <div style={{ width: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', backgroundColor: '#d1d5db', boxSizing: 'border-box', margin: 0, padding: '5px 0px' }}>
                {/* 주루 마름모 */}
                <div style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ position: 'absolute', top: '5px', left: '50%', width: '20px', height: '20px', transform: 'translateX(-50%) rotate(45deg)', backgroundColor: is_second ? '#eab308' : '#ffffff', boxSizing: 'border-box', margin: 0, padding: 0 }} />
                  <div style={{ position: 'absolute', bottom: '0%', left: '60%', width: '20px', height: '20px', transform: 'translateY(66.67%) rotate(45deg)', backgroundColor: is_first ? '#eab308' : '#ffffff', boxSizing: 'border-box', margin: 0, padding: 0 }} />
                  <div style={{ position: 'absolute', bottom: '0%', right: '60%', width: '20px', height: '20px', transform: 'translateY(66.67%) rotate(45deg)', backgroundColor: is_third ? '#eab308' : '#ffffff', boxSizing: 'border-box', margin: 0, padding: 0 }} />
                </div>
                {/* 이닝 정보 */}
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#f97316', lineHeight: '1', boxSizing: 'border-box', whiteSpace: 'nowrap', textAlign: 'center' }}>{inning} {isTop ? '▲' : '▼'}</div>
              </div>
            </div>

            {/* 3. 하단: BSO */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1px', padding: '0px 10px', fontSize: '20px', fontWeight: '700', height: '20%', backgroundColor: '#f3f4f6', color: '#000000', boxSizing: 'border-box', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '37%', borderRight: '1px solid #d9d9d9', boxSizing: 'border-box', paddingRight: '10px' }}>
                <div style={{ fontSize: '20px',  lineHeight: '1', fontWeight: '700' }}>B</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(3)].map((_, i) => <Circle key={i} active={i < bCount} color="green" size={16} />)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '34%', borderRight: '1px solid #d9d9d9', boxSizing: 'border-box', paddingRight: '10px' }}>
                <div style={{ fontSize: '20px',  lineHeight: '1', fontWeight: '700' }}>S</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(2)].map((_, i) => <Circle key={i} active={i < sCount} color="yellow" size={16} />)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '29%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '20px',  lineHeight: '1', fontWeight: '700' }}>O</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(2)].map((_, i) => <Circle key={i} active={i < oCount} color="red" size={16} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 선수 프로필 팝업 - Media Card */}
      {playerPopup && (() => {
        const isLandscape = imgOrientation === 'landscape'
        const cardWidth = isLandscape ? 250 : 150
        const imgW = isLandscape ? 250 : 150
        const imgH = isLandscape ? 180 : 230
        const animSuffix = isLandscape ? 'Landscape' : ''
        const animName = playerPopup.position === 'left-middle'
          ? `playerPopupFromLeft${animSuffix}`
          : `playerPopupFromRight${animSuffix}`
        return (
        <div style={{
          position: 'fixed',
          top: '50%',
          ...(playerPopup.position === 'left-middle' ? { left: '20px' } : { right: '20px' }),
          width: `${cardWidth}px`,
          borderRadius: '10px',
          overflow: 'hidden',
          zIndex: 200,
          boxShadow: '0 6px 28px rgba(0,0,0,0.65)',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: `${animName} 3s ease forwards`,
        }}>
          {/* 상단 - 이미지 */}
          <div style={{ width: `${imgW}px`, height: `${imgH}px`, backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {playerPopup.player.photo_url ? (
              <img
                src={playerPopup.player.photo_url}
                alt={playerPopup.player.name}
                style={{ width: `${imgW}px`, height: `${imgH}px`, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                onLoad={e => {
                  const img = e.currentTarget
                  if (img.naturalWidth > img.naturalHeight) setImgOrientation('landscape')
                }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span style={{ fontSize: '52px' }}>👤</span>
            )}
          </div>
          {/* 하단 10% - 메타정보 */}
          <div style={{
            backgroundColor: 'rgba(10,10,10,0.92)',
            padding: '7px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              {playerPopup.player.number != null && (
                <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '13px' }}>#{playerPopup.player.number}</span>
              )}
              <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '14px', lineHeight: '1.2' }}>{playerPopup.player.name}</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: '1.3' }}>
              {[playerPopup.player.position, playerPopup.player.sub_position].filter(Boolean).join(' · ')}
              {playerPopup.player.hand_type && ` · ${playerPopup.player.hand_type}`}
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  );
}

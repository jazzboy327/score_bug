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

function Circle({ active, color = 'green', size = 16 }: { active?: boolean; color?: 'green' | 'yellow' | 'red'; size?: number }) {
  const bgColor = active
    ? color === 'red' ? '#ef4444' : color === 'yellow' ? '#eab308' : '#4ade80'
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

function getPositionContainerStyle(position: OverlayPosition): React.CSSProperties {
  switch (position) {
    case 'top-left':      return { position: 'absolute', top: 0, left: 0 }
    case 'top-center':    return { position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center' }
    case 'top-right':     return { position: 'absolute', top: 0, right: 0 }
    case 'bottom-left':   return { position: 'absolute', bottom: 0, left: 0 }
    case 'bottom-center': return { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center' }
    case 'bottom-right':  return { position: 'absolute', bottom: 0, right: 0 }
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

export default function ScoreboardB() {
  const { gameId } = useParams<{ gameId: string }>()
  const [score, setScore] = useState<ScoreRow | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfoRow | null>(null)
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>('top-left')
  const [overlayScale, setOverlayScale] = useState(1.0)
  const [playerPopup, setPlayerPopup] = useState<PlayerPopupPayload | null>(null)
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [popupKey, setPopupKey] = useState(0)
  const [connStatus, setConnStatus] = useState<'connected' | 'disconnected'>('connected')
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectedOnceRef = useRef(false)

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
        setPopupKey(k => k + 1)
        setPlayerPopup(payload as PlayerPopupPayload)
        const ms = ((payload as PlayerPopupPayload).duration ?? 3) * 1000
        popupTimerRef.current = setTimeout(() => setPlayerPopup(null), ms)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (connectedOnceRef.current) {
            fetchScore()
            fetchGameInfo()
          }
          connectedOnceRef.current = true
          setConnStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnStatus('disconnected')
        }
      })

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
  const titleFontSize = gameInfo?.title_font_size ?? 23
  const teamNameFontSize = gameInfo?.team_name_font_size ?? 25
  const hBgColor = gameInfo?.home_bg_color ?? "#374151"
  const aBgColor = gameInfo?.away_bg_color ?? "#f7f7f7"
  const hTextColor = getContrastYIQ(hBgColor)
  const aTextColor = getContrastYIQ(aBgColor)

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', margin: 0, padding: 0 }}>
      <div style={getPositionContainerStyle(overlayPosition)}>
        <div style={{
          width: '1210px',
          height: '47px',
          transform: `scale(${overlayScale})`,
          transformOrigin: getTransformOrigin(overlayPosition),
          fontFamily: "'Noto Sans KR', 'Pretendard Variable', Pretendard, sans-serif",
          boxSizing: 'border-box',
        }}>
          {/* SCOREBOARD 콘텐츠 */}
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
            {/* 1. 좌측: 타이틀 */}
            <div style={{ width: '380px', height: '100%', fontSize: `${titleFontSize}px`, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#000000', boxSizing: 'border-box', margin: 0, padding: '0px 8px', lineHeight: '1.2', textAlign: 'center' }}>
              {gameTitle}
            </div>
            {/* 2. 중앙: 팀, 점수 */}
            <div style={{ position: 'relative', display: 'flex', width: '450px', height: '100%', justifyContent: 'center' }}>
              {/* 어웨이 */}
              <div style={{ backgroundColor: aBgColor, display: 'flex', width: '50%', fontWeight: '600', alignItems: 'center', color: aTextColor === 'text-white' ? '#ffffff' : '#000000', boxSizing: 'border-box', margin: 0, position: 'relative' }}>
                {awayLogoUrl && (
                  <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={awayLogoUrl} alt={`${awayTeam} 로고`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <div style={{ fontSize: `${teamNameFontSize}px`, fontWeight: '700', textAlign: 'center', padding: '4px 8px', width: '70%', boxSizing: 'border-box', lineHeight: '1.2', paddingLeft: '48px' }}>
                  {awayTeam}
                </div>
                <div style={{ fontSize: '30px', fontWeight: '700', textAlign: 'center', width: '30%', boxSizing: 'border-box', lineHeight: '1' }}>{awayScore}</div>
              </div>
              {/* 홈 */}
              <div style={{ backgroundColor: hBgColor, display: 'flex', width: '50%', fontWeight: '600', alignItems: 'center', color: hTextColor === 'text-white' ? '#ffffff' : '#000000', boxSizing: 'border-box', margin: 0, position: 'relative' }}>
                <div style={{ fontSize: '30px', fontWeight: '700', textAlign: 'center', width: '30%', boxSizing: 'border-box', lineHeight: '1' }}>{homeScore}</div>
                <div style={{ fontSize: `${teamNameFontSize}px`, fontWeight: '700', textAlign: 'center', padding: '4px 8px', width: '70%', boxSizing: 'border-box', lineHeight: '1.2', paddingRight: '48px' }}>
                  {homeTeam}
                </div>
                {homeLogoUrl && (
                  <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={homeLogoUrl} alt={`${homeTeam} 로고`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            </div>

            {/* 3. 우측: 이닝 주루 BSO */}
            <div style={{ display: 'flex', width: '380px', alignItems: 'center', gap: '0', padding: '0px 8px', fontSize: '16px', fontWeight: '700', backgroundColor: '#1a1a1a', color: '#ffffff', boxSizing: 'border-box', margin: 0 }}>
              {/* 이닝 정보 */}
              <div style={{ display: 'flex', width: '50px', fontSize: '24px', justifyContent: 'center', color: '#f97316', lineHeight: '1', boxSizing: 'border-box', whiteSpace: 'nowrap', flexShrink: 0, marginRight: '4px' }}>
                {inning} {isTop ? '▲' : '▼'}
              </div>
              {/* 주루 마름모 */}
              <div style={{ position: 'relative', width: '70px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', top: '10px', left: '50%', width: '14px', height: '14px', transform: 'translateX(-50%) rotate(45deg)', backgroundColor: is_second ? '#eab308' : '#9ca3af', boxSizing: 'border-box', margin: 0, padding: 0 }} />
                <div style={{ position: 'absolute', bottom: '35%', right: '15px', width: '14px', height: '14px', transform: 'translateY(50%) rotate(45deg)', backgroundColor: is_first ? '#eab308' : '#9ca3af', boxSizing: 'border-box', margin: 0, padding: 0 }} />
                <div style={{ position: 'absolute', bottom: '35%', left: '15px', width: '14px', height: '14px', transform: 'translateY(50%) rotate(45deg)', backgroundColor: is_third ? '#eab308' : '#9ca3af', boxSizing: 'border-box', margin: 0, padding: 0 }} />
              </div>
              {/* B */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxSizing: 'border-box', marginRight: '8px' }}>
                <div style={{ fontSize: '16px', lineHeight: '1', fontWeight: '700' }}>B</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(3)].map((_, i) => <Circle key={i} active={i < bCount} color="green" size={16} />)}
                </div>
              </div>
              {/* S */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxSizing: 'border-box', marginRight: '8px' }}>
                <div style={{ fontSize: '16px', lineHeight: '1', fontWeight: '700' }}>S</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(2)].map((_, i) => <Circle key={i} active={i < sCount} color="yellow" size={16} />)}
                </div>
              </div>
              {/* O */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '16px', lineHeight: '1', fontWeight: '700' }}>O</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(2)].map((_, i) => <Circle key={i} active={i < oCount} color="red" size={16} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 선수 프로필 팝업 - Media Card */}
      {connStatus === 'disconnected' && (
        <div style={{ position: 'fixed', bottom: 12, right: 12, width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', zIndex: 999, boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
      )}

      {playerPopup && (() => {
        // key={popupKey} 로 강제 remount → 애니메이션 재시작
        const isLandscape = imgOrientation === 'landscape'
        const cardWidth = isLandscape ? 375 : 225
        const imgW = isLandscape ? 375 : 225
        const imgH = isLandscape ? 270 : 345
        const animSuffix = isLandscape ? 'Landscape' : ''
        const animName = playerPopup.position === 'left-middle'
          ? `playerPopupFromLeft${animSuffix}`
          : `playerPopupFromRight${animSuffix}`
        return (
        <div key={popupKey} style={{
          position: 'fixed',
          top: '50%',
          ...(playerPopup.position === 'left-middle' ? { left: '20px' } : { right: '20px' }),
          width: `${cardWidth}px`,
          borderRadius: '10px',
          overflow: 'hidden',
          zIndex: 200,
          boxShadow: '0 6px 28px rgba(0,0,0,0.65)',
          border: '2px solid rgba(255,255,255,0.45)',
          animation: `${animName} ${playerPopup.duration ?? 3}s ease forwards`,
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
            padding: '11px 15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
              {playerPopup.player.number != null && (
                <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '20px' }}>#{playerPopup.player.number}</span>
              )}
              <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '21px', lineHeight: '1.2' }}>{playerPopup.player.name}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '15px', lineHeight: '1.3' }}>
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

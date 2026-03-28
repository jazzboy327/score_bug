import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import type { ScoreRow, OverlayPosition, PlayerRow, PlayerPopupPosition, PlayerPopupPayload } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"
import { SupabaseTeamsService } from "../services/SupabaseTeamsService"
import { SupabasePlayersService } from "../services/SupabasePlayersService"
import { supabase } from "../utils/supabaseClient"

const gameInfoService = new SupabaseGameinfoService();
const scoreService = new SupabaseScoreService();
const teamsService = new SupabaseTeamsService();
const playersService = new SupabasePlayersService();
 

export default function ScoreControl() {
    const { gameId } = useParams<{ gameId: string }>()
    const isUserCode = isNaN(Number(gameId))
    const [resolvedGameId, setResolvedGameId] = useState<number | null>(
        isUserCode ? null : Number(gameId)
    )
    const [score, setScore] = useState<ScoreRow | null>(null)
    const [gameInfo, setGameInfo] = useState<any>(null)
    // const [ setGameInfo] = useState<GameInfoRow | null>(null)
    const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>('top-left')
    const [overlayScale, setOverlayScale] = useState(1.0)
    const [positionOpen, setPositionOpen] = useState(false)
    const overlayChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // 선수 팝업
    const [playerPopupOpen, setPlayerPopupOpen] = useState(false)
    const [popupTeamSide, setPopupTeamSide] = useState<'away' | 'home'>('away')
    const [popupPlayers, setPopupPlayers] = useState<PlayerRow[]>([])
    const [popupPlayerId, setPopupPlayerId] = useState<number | ''>('')
    const [popupPosition, setPopupPosition] = useState<PlayerPopupPosition>('left-middle')
    const [popupDuration, setPopupDuration] = useState(3)
    const [isBroadcasting, setIsBroadcasting] = useState(false)
    const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false)
    const [popupPlayerType, setPopupPlayerType] = useState<'all' | 'p' | 'b'>('all')
    const [connStatus, setConnStatus] = useState<'connected' | 'disconnected'>('connected')
    const broadcastCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const connectedOnceRef = useRef(false)
    const [allTeams, setAllTeams] = useState<{ id: number; name: string }[]>([])
    const prevScoreRef = useRef<ScoreRow | null>(null)       // undo용 이전 상태
    const isInningChangingRef = useRef(false)                 // 이닝 전환 중복 방지
    const [canUndo, setCanUndo] = useState(false)
    const [showCorrection, setShowCorrection] = useState(false)
    const prevPitchLogRef = useRef<{ gameId: number; pitcherId: number; teamSide: 'top' | 'bottom'; inning: number; isTop: boolean; wasNew: boolean; prevPitchCount: number; prevBallCount: number; prevStrikeCount: number } | null>(null)

    // 이닝 조작
    const handleInningChange = async (increment: boolean) => {
        if (!score) return;
        if (isInningChangingRef.current) return;
        isInningChangingRef.current = true;
        prevPitchLogRef.current = null;
        const updatedScore = { ...score };
        
        if (increment) {
            // 현재 초(상)이면 말(하)로 변경
            if (score.is_top) {
                updatedScore.is_top = false;
            } else {
                // 현재 말(하)이면 다음 이닝 초(상)로 변경
                if (score.inning < 9) {
                    updatedScore.inning = score.inning + 1;
                    updatedScore.is_top = true;
                }
            }
        } else {
            // 현재 말(하)이면 초(상)로 변경
            if (!score.is_top) {
                updatedScore.is_top = true;
            } else {
                // 현재 초(상)이면 이전 이닝 말(하)로 변경
                if (score.inning > 1) {
                    updatedScore.inning = score.inning - 1;
                    updatedScore.is_top = false;
                }
            }
        }
        
        // 이닝이 변경되거나 초/말이 바뀔 때 카운트와 베이스 초기화
        if (updatedScore.inning !== score.inning || updatedScore.is_top !== score.is_top) {
            // 앞으로 이닝 전환 시: 현재 사이드 투수 이닝 투구수 로그 저장 후 초기화
            if (increment) {
                const leavingSide = score.is_top ? 'bottom' : 'top'
                const leavingPitcherId = score.is_top ? score.bottom_pitcher_id : score.top_pitcher_id
                const leavingInningPitch = score.is_top ? (score.bottom_inning_pitch ?? 0) : (score.top_inning_pitch ?? 0)
                if (leavingPitcherId && leavingInningPitch > 0) {
                    const leavingBall = score.is_top ? (score.bottom_inning_ball ?? 0) : (score.top_inning_ball ?? 0)
                    const leavingStrike = score.is_top ? (score.bottom_inning_strike ?? 0) : (score.top_inning_strike ?? 0)
                    try {
                        // 기존 로그 확인 (undo 복원용)
                        const existingLog = await scoreService.getPitchInningLog(score.game_id, leavingPitcherId, score.inning, score.is_top)
                        // 없으면 INSERT, 있으면 UPDATE (upsert)
                        await scoreService.savePitchInningLog(score.game_id, leavingPitcherId, leavingSide, score.inning, score.is_top, leavingInningPitch, leavingBall, leavingStrike)
                        prevPitchLogRef.current = {
                            gameId: score.game_id,
                            pitcherId: leavingPitcherId,
                            teamSide: leavingSide,
                            inning: score.inning,
                            isTop: score.is_top,
                            wasNew: !existingLog,
                            prevPitchCount: existingLog?.pitch_count ?? 0,
                            prevBallCount: existingLog?.ball_count ?? 0,
                            prevStrikeCount: existingLog?.strike_count ?? 0,
                        }
                    } catch (e) {
                        console.error('Failed to save pitch inning log:', e)
                    }
                }
                if (score.is_top) {
                    updatedScore.bottom_inning_pitch = 0
                    updatedScore.bottom_inning_ball = 0
                    updatedScore.bottom_inning_strike = 0
                } else {
                    updatedScore.top_inning_pitch = 0
                    updatedScore.top_inning_ball = 0
                    updatedScore.top_inning_strike = 0
                }
            } else {
                // 이전 이닝 복귀: prevPitchLogRef가 있으면 방금 저장된 로그 자동 정리
                if (prevPitchLogRef.current) {
                    const { gameId, pitcherId, teamSide, inning, isTop, wasNew, prevPitchCount, prevBallCount, prevStrikeCount } = prevPitchLogRef.current
                    try {
                        if (wasNew) {
                            await scoreService.deletePitchInningLog(gameId, pitcherId, inning, isTop)
                        } else {
                            await scoreService.savePitchInningLog(gameId, pitcherId, teamSide, inning, isTop, prevPitchCount, prevBallCount, prevStrikeCount)
                        }
                    } catch (e) {
                        console.error('Failed to auto-cleanup pitch log on backward:', e)
                    }
                    prevPitchLogRef.current = null
                    setCanUndo(false)
                }
                // 복귀할 이닝의 기존 로그가 있으면 inning_pitch 복원
                const enteringSide: 'top' | 'bottom' = updatedScore.is_top ? 'bottom' : 'top'
                const enteringPitcherId = updatedScore.is_top ? score.bottom_pitcher_id : score.top_pitcher_id
                if (enteringPitcherId && resolvedGameId) {
                    try {
                        const log = await scoreService.getPitchInningLog(resolvedGameId, enteringPitcherId, updatedScore.inning, updatedScore.is_top)
                        if (log) {
                            if (enteringSide === 'bottom') {
                                updatedScore.bottom_inning_pitch = log.pitch_count
                                updatedScore.bottom_inning_ball = log.ball_count
                                updatedScore.bottom_inning_strike = log.strike_count
                            } else {
                                updatedScore.top_inning_pitch = log.pitch_count
                                updatedScore.top_inning_ball = log.ball_count
                                updatedScore.top_inning_strike = log.strike_count
                            }
                        }
                    } catch (e) {
                        console.error('Failed to restore pitch log on backward:', e)
                    }
                }
            }
            updatedScore.b_count = 0;
            updatedScore.s_count = 0;
            updatedScore.o_count = 0;
            updatedScore.is_first = false;
            updatedScore.is_second = false;
            updatedScore.is_third = false;
        }

        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update inning:', error);
            console.log(updatedScore);
        } finally {
            isInningChangingRef.current = false;
        }
    };

    // 점수 조작
    const handleScoreChange = async (team: 'a_score' | 'h_score', increment: boolean) => {
        if (!score) return;
        const updatedScore = { ...score };
        if (team === 'a_score') {
            updatedScore.a_score = increment ? score.a_score + 1 : Math.max(0, score.a_score - 1);
        } else {
            updatedScore.h_score = increment ? score.h_score + 1 : Math.max(0, score.h_score - 1);
        }
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update score:', error);
        }
    };

    // 베이스 토글
    const handleBaseToggle = async (base: 'first' | 'second' | 'third') => {
        if (!score) return;
        const updatedScore = { ...score };
        switch (base) {
            case 'first':
                updatedScore.is_first = !score.is_first;
                break;
            case 'second':
                updatedScore.is_second = !score.is_second;
                break;
            case 'third':
                updatedScore.is_third = !score.is_third;
                break;
        }
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update base:', error);
        }
    };

    // 볼/스트라이크/파울/아웃 카운트 조작
    const handleCountChange = async (type: 'ball' | 'strike' | 'foul' | 'out'| 'on-base' | 'b-out') => {
        if (!score) return;
        prevScoreRef.current = { ...score };
        setCanUndo(true);
        const updatedScore = { ...score };

        // ball/strike/foul 은 투구수 증가
        // on-base/b-out 는 투구수 증가 및 볼카운트 초기화
        if (type !== 'out') {
            if (score.is_top) {
                updatedScore.bottom_total_pitch = (score.bottom_total_pitch ?? 0) + 1
                updatedScore.bottom_inning_pitch = (score.bottom_inning_pitch ?? 0) + 1
                if (type === 'ball') {
                    updatedScore.bottom_inning_ball = (score.bottom_inning_ball ?? 0) + 1
                } else if (type === 'strike' || type === 'foul') {
                    updatedScore.bottom_inning_strike = (score.bottom_inning_strike ?? 0) + 1
                }
            } else {
                updatedScore.top_total_pitch = (score.top_total_pitch ?? 0) + 1
                updatedScore.top_inning_pitch = (score.top_inning_pitch ?? 0) + 1
                if (type === 'ball') {
                    updatedScore.top_inning_ball = (score.top_inning_ball ?? 0) + 1
                } else if (type === 'strike' || type === 'foul') {
                    updatedScore.top_inning_strike = (score.top_inning_strike ?? 0) + 1
                }
            }
        }

        switch (type) {
            case 'ball':
                updatedScore.b_count = (score.b_count + 1) % 4;
                break;
            case 'strike':
                updatedScore.s_count = (score.s_count + 1) % 3;
                break;
            case 'foul':
                // 파울: 2스트라이크 이상이면 스트라이크 증가 안 함
                updatedScore.s_count = Math.min(score.s_count + 1, 2);
                break;
            case 'out':
                updatedScore.o_count = (score.o_count + 1) % 3;
                break;
            case 'on-base':
                // 출루: 볼/스트라이크 카운트 초기화
                updatedScore.b_count = 0;
                updatedScore.s_count = 0;
                break;
            case 'b-out':
                // 타자 아웃: 아웃 카운트 +1, 볼/스트라이크 카운트 초기화
                updatedScore.o_count = (score.o_count + 1) % 3;
                updatedScore.b_count = 0;
                updatedScore.s_count = 0;
                break;
        }

        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update count:', error);
        }
    };

    // 화면 표시만 수정 (투구수/볼카운트 기록 영향 없음)
    const handleDisplayCorrection = async (type: 'ball' | 'strike' | 'out') => {
        if (!score) return;
        const updatedScore = { ...score };
        switch (type) {
            case 'ball':   updatedScore.b_count = (score.b_count + 1) % 4; break;
            case 'strike': updatedScore.s_count = (score.s_count + 1) % 3; break;
            case 'out':    updatedScore.o_count = (score.o_count + 1) % 3; break;
        }
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to correct display:', error);
        }
    };

    // 투수 설정
    const handleSetPitcher = async (playerId: number | null) => {
        if (!resolvedGameId || !score) return
        const side: 'top' | 'bottom' = popupTeamSide === 'away' ? 'top' : 'bottom'
        const player = playerId !== null ? popupPlayers.find(p => p.id === playerId) : null
        const playerName = player?.name ?? null
        try {
            // 1. 교체 전 현재 투수의 이닝 투구수 로그 저장
            const prevPitcherId = side === 'top' ? score.top_pitcher_id : score.bottom_pitcher_id
            const prevInningPitch = side === 'top' ? (score.top_inning_pitch ?? 0) : (score.bottom_inning_pitch ?? 0)
            if (prevPitcherId && prevInningPitch > 0) {
                const prevBall = side === 'top' ? (score.top_inning_ball ?? 0) : (score.bottom_inning_ball ?? 0)
                const prevStrike = side === 'top' ? (score.top_inning_strike ?? 0) : (score.bottom_inning_strike ?? 0)
                await scoreService.savePitchInningLog(score.game_id, prevPitcherId, side, score.inning, score.is_top, prevInningPitch, prevBall, prevStrike)
            }

            // 2. 재등판 시 누적 투구수 복원
            let restoredTotal = 0
            if (playerId !== null) {
                restoredTotal = await scoreService.getPitcherAccumulatedTotal(resolvedGameId, playerId)
            }

            // 3. 투수 설정 (복원된 total_pitch 포함)
            await scoreService.setPitcher(resolvedGameId, side, playerId, playerName, restoredTotal)

            // 4. 로컬 score 상태 즉시 업데이트
            const updatedScore = { ...score }
            if (side === 'top') {
                updatedScore.top_pitcher_id = playerId
                updatedScore.top_pitcher_name = playerName
                updatedScore.top_total_pitch = restoredTotal
                updatedScore.top_inning_pitch = 0
                updatedScore.top_inning_ball = 0
                updatedScore.top_inning_strike = 0
            } else {
                updatedScore.bottom_pitcher_id = playerId
                updatedScore.bottom_pitcher_name = playerName
                updatedScore.bottom_total_pitch = restoredTotal
                updatedScore.bottom_inning_pitch = 0
                updatedScore.bottom_inning_ball = 0
                updatedScore.bottom_inning_strike = 0
            }
            setScore(updatedScore)
            // 투수 등판은 undo 대상 아님 → undo 상태 초기화
            prevScoreRef.current = null
            prevPitchLogRef.current = null
            setCanUndo(false)

            // 5. overlay 채널로 브로드캐스트
            if (overlayChannelRef.current) {
                overlayChannelRef.current.send({
                    type: 'broadcast',
                    event: 'PITCHER_UPDATE',
                    payload: { side, pitcherId: playerId, pitcherName: playerName, totalPitch: restoredTotal, inningPitch: 0 },
                })
            }
        } catch (error) {
            console.error('Failed to set pitcher:', error)
        }
    }

    // 볼카운트 초기화
    const handleCountReset = async () => {
        if (!score) return;
        const updatedScore = { ...score };
        updatedScore.b_count = 0;
        updatedScore.s_count = 0;
        // updatedScore.o_count = 0;
        
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to reset count:', error);
        }
    };

    // 되돌리기 (마지막 카운트/이닝 변경 1단계 undo)
    const handleUndo = async () => {
        if (!prevScoreRef.current) return;
        const prev = prevScoreRef.current;
        try {
            // 이닝 전환 시 저장된 pitch_inning_log 되돌리기
            if (prevPitchLogRef.current) {
                const { gameId, pitcherId, teamSide, inning, isTop, wasNew, prevPitchCount, prevBallCount, prevStrikeCount } = prevPitchLogRef.current;
                try {
                    if (wasNew) {
                        // 새로 INSERT된 경우 → 삭제
                        await scoreService.deletePitchInningLog(gameId, pitcherId, inning, isTop);
                    } else {
                        // 기존 row를 UPDATE한 경우 → 이전 값으로 복원
                        await scoreService.savePitchInningLog(gameId, pitcherId, teamSide, inning, isTop, prevPitchCount, prevBallCount, prevStrikeCount);
                    }
                } catch (e) {
                    console.error('Failed to undo pitch log:', e);
                }
                prevPitchLogRef.current = null;
            }
            await scoreService.updateLiveScore(prev);
            setScore(prev);
            prevScoreRef.current = null;
            setCanUndo(false);
        } catch (error) {
            console.error('Failed to undo:', error);
        }
    };

    // 출루 초기화
    const handleBaseReset = async () => {
        if (!score) return;
        const updatedScore = { ...score };
        updatedScore.is_first = false;
        updatedScore.is_second = false;
        updatedScore.is_third = false;
        
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to reset bases:', error);
        }
    };

    // 팀 목록 로드
    // userCode 모드: 코드 → is_live 게임 ID 조회 + is_live 변경 실시간 감지
    useEffect(() => {
        if (!isUserCode || !gameId) return

        const resolve = () => {
            gameInfoService.getLiveGameByUserCode(gameId).then(game => {
                if (game) {
                    setGameInfo(game)
                    setResolvedGameId(game.game_id)
                } else {
                    setGameInfo(null)
                    setResolvedGameId(null)
                }
            })
        }

        resolve()

        // game_info 변경 시 live 게임 재조회 (is_live 토글 감지)
        const unsubscribe = gameInfoService.subscribeToGameInfoUpdates(() => resolve())
        return () => unsubscribe()
    }, [gameId, isUserCode])

    useEffect(() => {
        teamsService.getAllTeams().then(setAllTeams).catch(console.error)
    }, [])

    // 팀 사이드 변경 시 선수 목록 로드
    useEffect(() => {
        if (!gameInfo || allTeams.length === 0) return
        const teamName = popupTeamSide === 'away' ? gameInfo.away_team : gameInfo.home_team
        const team = allTeams.find(t => t.name === teamName)
        if (!team) { setPopupPlayers([]); return }
        playersService.getAllPlayersByTeam(team.id).then(players => {
            setPopupPlayers(players)
            setPopupPlayerId('')
            players.forEach(p => {
                if (p.photo_url) {
                    const img = new Image()
                    img.src = p.photo_url
                }
            })
        }).catch(console.error)
    }, [popupTeamSide, gameInfo, allTeams])

    const broadcastPlayerPopup = () => {
        if (!overlayChannelRef.current || popupPlayerId === '' || isBroadcasting) return
        const player = popupPlayers.find(p => p.id === popupPlayerId)
        if (!player) return
        const displayPlayer = (popupPlayerType === 'p' && player.pitcher_photo_url)
            ? { ...player, photo_url: player.pitcher_photo_url }
            : player
        overlayChannelRef.current.send({
            type: 'broadcast',
            event: 'PLAYER_POPUP',
            payload: { player: displayPlayer, position: popupPosition, duration: popupDuration } as PlayerPopupPayload,
        })
        setIsBroadcasting(true)
        if (broadcastCooldownRef.current) clearTimeout(broadcastCooldownRef.current)
        broadcastCooldownRef.current = setTimeout(() => setIsBroadcasting(false), popupDuration * 1000)
    }

    const broadcastOverlayUpdate = (position: OverlayPosition, scale: number) => {
        if (!overlayChannelRef.current) return
        overlayChannelRef.current.send({
            type: 'broadcast',
            event: 'OVERLAY_UPDATE',
            payload: { position, scale },
        })
    }

    const handlePositionChange = (position: OverlayPosition) => {
        setOverlayPosition(position)
        broadcastOverlayUpdate(position, overlayScale)
    }

    const handleScaleChange = (scale: number) => {
        setOverlayScale(scale)
        broadcastOverlayUpdate(overlayPosition, scale)
    }

    useEffect(() => {
        if (resolvedGameId === null) return

        const fetchScore = async () => {
            const data = await scoreService.getScore(resolvedGameId);
            if (data) setScore(data);
        }
        const fetchGameInfo = async () => {
            const data = await gameInfoService.getGameInfo(resolvedGameId);
            if (data) setGameInfo(data);
        }

        const unsubscribeScore = scoreService.subscribeToScoreUpdates((newScore) => {
            if (newScore.game_id === resolvedGameId) setScore(newScore);
        });

        const unsubscribeGameInfo = gameInfoService.subscribeToGameInfoUpdates((newGameInfo) => {
            if (newGameInfo.game_id === resolvedGameId) setGameInfo(newGameInfo);
        });

        overlayChannelRef.current = supabase.channel(`overlay-control-${resolvedGameId}`)
        overlayChannelRef.current.subscribe((status) => {
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

        fetchScore();
        fetchGameInfo();

        return () => {
            unsubscribeScore();
            unsubscribeGameInfo();
            if (overlayChannelRef.current) {
                supabase.removeChannel(overlayChannelRef.current)
            }
        }
    }, [resolvedGameId]);

    const inning = score?.inning ?? 1
    const h_score = score?.h_score ?? 0
    const a_score = score?.a_score ?? 0
    const isTop = score?.is_top ?? true
    const bCount = score?.b_count ?? 0
    const sCount = score?.s_count ?? 0
    const oCount = score?.o_count ?? 0
    const isFirst = score?.is_first ?? false
    const isSecond = score?.is_second ?? false
    const isThird = score?.is_third ?? false
    const currentTotalPitch = isTop ? (score?.bottom_total_pitch ?? 0) : (score?.top_total_pitch ?? 0)
    const currentInningPitch = isTop ? (score?.bottom_inning_pitch ?? 0) : (score?.top_inning_pitch ?? 0)
    const pitcherName = isTop ? (score?.bottom_pitcher_name ?? null) : (score?.top_pitcher_name ?? null)
    
    return (
        <div className="bg-[#222] w-screen min-h-screen flex flex-col overflow-y-auto select-none">

          {/* 연결 상태 배너 */}
          {connStatus === 'disconnected' && (
            <div className="bg-red-600 text-white text-sm text-center py-2 font-bold tracking-wide">
              ⚠ 연결이 끊어졌습니다. 재연결 중...
            </div>
          )}

          {/* 게임 제목 */}
          <div className="text-center pt-3 pb-2 px-4">
            <div className="text-white text-lg font-bold tracking-wide">{gameInfo?.away_team} vs {gameInfo?.home_team}</div>
          </div>

          {/* 투수 현황 배너 */}
          {pitcherName && (
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a2a3a] mx-3 rounded-xl mb-2 border border-[#2a4a6a]">
              <div className="flex items-center gap-2">
                <span className="text-blue-300 text-xs font-bold">⚾ 투수</span>
                <span className="text-white text-sm font-bold">{pitcherName}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">이닝</div>
                  <div className="text-yellow-300 text-sm font-bold">{currentInningPitch}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">총</div>
                  <div className="text-orange-300 text-sm font-bold">{currentTotalPitch}</div>
                </div>
              </div>
            </div>
          )}

          {/* 현황 표시 (컴팩트 배너) */}
          <div className="flex flex-row items-center justify-around px-4 py-3 bg-[#2a2a2a] mx-3 rounded-xl mb-4">
            {/* 스코어 + 이닝 */}
            <div className="flex flex-col items-center">
              <div className="text-white text-2xl font-bold">{a_score} : {h_score}</div>
              <div className="text-gray-300 text-sm font-bold mt-0.5">{inning}{isTop ? ' ▲' : ' ▼'}</div>
            </div>
            {/* 볼카운트 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[#00c853] text-xs font-bold w-4">B</span>
                {[0,1,2].map(i => <div key={i} className={`w-4 h-4 rounded-full ${bCount > i ? 'bg-[#00c853]' : 'bg-[#555]'}`} />)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#ffd600] text-xs font-bold w-4">S</span>
                {[0,1].map(i => <div key={i} className={`w-4 h-4 rounded-full ${sCount > i ? 'bg-[#ffd600]' : 'bg-[#555]'}`} />)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#ff1744] text-xs font-bold w-4">O</span>
                {[0,1].map(i => <div key={i} className={`w-4 h-4 rounded-full ${oCount > i ? 'bg-[#ff1744]' : 'bg-[#555]'}`} />)}
              </div>
            </div>
            {/* 베이스 */}
            <div className="relative w-16 h-14">
              <div className={`absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-5 ${isSecond ? 'bg-[#FFA83F]' : 'bg-[#555]'} -rotate-45`} />
              <div className={`absolute bottom-1/3 right-1 w-5 h-5 ${isFirst ? 'bg-[#FFA83F]' : 'bg-[#555]'} -rotate-45`} />
              <div className={`absolute bottom-1/3 left-1 w-5 h-5 ${isThird ? 'bg-[#FFA83F]' : 'bg-[#555]'} -rotate-45`} />
            </div>
          </div>

          {/* 게임 진행용 버튼 */}
          <div className="px-4 mb-1">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">⚾ 게임 진행</div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => handleCountChange('ball')}
                className="flex-1 h-16 bg-[#00c853] text-white rounded-2xl active:opacity-80 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-xl font-black">볼</span>
                <span className="text-[10px] opacity-70">+1</span>
              </button>
              <button
                onClick={() => handleCountChange('strike')}
                className="flex-1 h-16 bg-[#d4a800] text-white rounded-2xl active:opacity-80 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-xl font-black">스트라이크</span>
                <span className="text-[10px] opacity-70">+1</span>
              </button>
              <button
                onClick={() => handleCountChange('foul')}
                className="flex-1 h-16 bg-[#6d28d9] text-white rounded-2xl active:opacity-80 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-xl font-black">파울</span>
                <span className="text-[10px] opacity-70">+1</span>
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => handleCountChange('on-base')}
                className="flex-1 h-14 bg-[#0288d1] text-white rounded-2xl active:opacity-80 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-lg font-black">출루</span>
                <span className="text-[10px] opacity-70">투구+1 · BSO초기화</span>
              </button>
              <button
                onClick={() => handleCountChange('b-out')}
                className="flex-1 h-14 bg-[#e53935] text-white rounded-2xl active:opacity-80 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-lg font-black">타자 아웃</span>
                <span className="text-[10px] opacity-70">아웃+1 · BSO초기화</span>
              </button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-full border-t border-gray-700 mx-0 mb-3 mt-1" />

          {/* 스코어보드 수정용 버튼 */}
          <div className="px-4 mb-2">
            <button
              onClick={() => setShowCorrection(v => !v)}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 hover:text-gray-300 transition-colors"
            >
              🔧 스코어보드 수정 <span className="text-[10px]">{showCorrection ? '▲' : '▼'}</span>
            </button>
            {showCorrection && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDisplayCorrection('ball')}
                  className="flex-1 h-10 bg-[#1a3a1a] border border-[#00c853]/40 text-[#00c853] text-sm font-bold rounded-xl active:opacity-80"
                >B +1</button>
                <button
                  onClick={() => handleDisplayCorrection('strike')}
                  className="flex-1 h-10 bg-[#3a3000] border border-[#d4a800]/40 text-[#d4a800] text-sm font-bold rounded-xl active:opacity-80"
                >S +1</button>
                <button
                  onClick={() => handleDisplayCorrection('out')}
                  className="flex-1 h-10 bg-[#3a0a0a] border border-[#ff1744]/40 text-[#ff1744] text-sm font-bold rounded-xl active:opacity-80"
                >O +1</button>
              </div>
            )}
          </div>

          {/* 볼카운트 초기화 + 되돌리기 */}
          <div className="flex gap-3 px-4 mb-4">
              <button
                  onClick={() => handleCountReset()}
                  className="flex-1 h-14 bg-[#444] text-gray-200 text-base font-semibold rounded-2xl active:opacity-80"
              >🚥 볼카운트 초기화</button>
              <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`w-20 h-14 text-base font-bold rounded-2xl transition-colors ${canUndo ? 'bg-orange-600 text-white active:opacity-80' : 'bg-[#333] text-gray-600 cursor-not-allowed'}`}
              >↩ 취소</button>
          </div>

          {/* 구분선 */}
          <div className="w-full border-t border-gray-700 mb-4"></div>

          {/* ② 출루 + 베이스 초기화 */}
          <div className="flex flex-row gap-2 px-4 mb-4">
              <button
                  onClick={() => handleBaseToggle('third')}
                  className={`flex-1 h-14 rounded-2xl text-white text-lg font-bold active:opacity-80 ${isThird ? 'bg-[#FFA83F]' : 'bg-[#444]'}`}
              >3루</button>
              <button
                  onClick={() => handleBaseToggle('second')}
                  className={`flex-1 h-14 rounded-2xl text-white text-lg font-bold active:opacity-80 ${isSecond ? 'bg-[#FFA83F]' : 'bg-[#444]'}`}
              >2루</button>
              <button
                  onClick={() => handleBaseToggle('first')}
                  className={`flex-1 h-14 rounded-2xl text-white text-lg font-bold active:opacity-80 ${isFirst ? 'bg-[#FFA83F]' : 'bg-[#444]'}`}
              >1루</button>
              <button
                  onClick={() => handleBaseReset()}
                  className="w-20 h-14 bg-[#444] text-gray-300 text-xs font-semibold rounded-2xl active:opacity-80"
              >🔸베이스<br/> 🔸초기화</button>
          </div>

          {/* 구분선 */}
          <div className="w-full border-t border-gray-700 mb-4"></div>

          {/* ③ 이닝·초말 / 점수 */}
          {/* 행1: 이닝 */}
          <div className="flex flex-row gap-3 px-4 mb-3">
              <div className="flex flex-col items-center w-full">
                  <div className="text-gray-400 text-xs mb-1.5">이닝</div>
                  <div className="flex items-center gap-1 w-full">
                      <button onClick={() => handleInningChange(false)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">−</button>
                      <div className="flex flex-col items-center justify-center w-20">
                          <div className={`text-xl font-bold leading-tight ${isTop ? 'text-[#f97316]' : 'text-[#60a5fa]'}`}>{inning}{isTop ? '초' : '말'}</div>
                      </div>
                      <button onClick={() => handleInningChange(true)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">+</button>
                  </div>
              </div>
          </div>
          {/* 행2: 초공A / 말공B 점수 */}
          <div className="flex flex-row gap-3 px-4 mb-6">
              <div className="flex flex-col items-center flex-1">
                  <div className="text-gray-400 text-xs mb-1.5">{gameInfo?.away_team ?? '초공격'}(초)</div>
                  <div className="flex items-center gap-2 w-full">
                      <button onClick={() => handleScoreChange('a_score', false)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">−</button>
                      <div className="text-white text-2xl font-bold w-8 text-center">{a_score}</div>
                      <button onClick={() => handleScoreChange('a_score', true)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">+</button>
                  </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                  <div className="text-gray-400 text-xs mb-1.5">{gameInfo?.home_team ?? '말공격'}(말)</div>
                  <div className="flex items-center gap-2 w-full">
                      <button onClick={() => handleScoreChange('h_score', false)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">−</button>
                      <div className="text-white text-2xl font-bold w-8 text-center">{h_score}</div>
                      <button onClick={() => handleScoreChange('h_score', true)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">+</button>
                  </div>
              </div>
          </div>

          {/* 선수 프로필 팝업 */}
          <div className="w-full px-4 pb-4">
              <button
                  onClick={() => setPlayerPopupOpen(prev => !prev)}
                  className="flex items-center justify-between w-full py-3 px-4 bg-[#333] rounded-2xl active:opacity-80"
              >
                  <span className="text-white text-base font-bold">👤 선수 프로필 팝업</span>
                  <span className="text-gray-400">{playerPopupOpen ? '▲' : '▼'}</span>
              </button>
              {playerPopupOpen && (
                  <div className="mt-3 flex flex-col gap-3">
                      {/* 팀 선택 */}
                      <div className="flex gap-2">
                          <button
                              onClick={() => setPopupTeamSide('away')}
                              className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${popupTeamSide === 'away' ? 'bg-[#f97316] text-white' : 'bg-[#444] text-gray-300'}`}
                          >
                              {gameInfo?.away_team ?? '초공'}
                          </button>
                          <button
                              onClick={() => setPopupTeamSide('home')}
                              className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${popupTeamSide === 'home' ? 'bg-[#60a5fa] text-white' : 'bg-[#444] text-gray-300'}`}
                          >
                              {gameInfo?.home_team ?? '말공'}
                          </button>
                      </div>

                      {/* 투수/타자 필터 */}
                      <div className="flex gap-1">
                          {([ 'p', 'b'] as const).map(type => {
                              const label = type === 'p' ? '투수' : '타자'
                              const active = popupPlayerType === type
                              return (
                                  <button
                                      key={type}
                                      onClick={() => { setPopupPlayerType(type); setPopupPlayerId(''); setPlayerDropdownOpen(false) }}
                                      className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors ${active ? (type === 'p' ? 'bg-blue-600 text-white' : type === 'b' ? 'bg-orange-500 text-white' : 'bg-[#555] text-white') : 'bg-[#333] text-gray-400'}`}
                                  >{label}</button>
                              )
                          })}
                      </div>

                      {/* 선수 선택 - 커스텀 드롭다운 */}
                      <div className="relative">
                          <button
                              onClick={() => setPlayerDropdownOpen(prev => !prev)}
                              className="w-full px-3 py-2.5 bg-[#444] text-left text-white rounded-xl border border-[#555] flex items-center justify-between"
                          >
                              <span className={popupPlayerId === '' ? 'text-gray-400' : 'text-white'}>
                                  {popupPlayerId === ''
                                      ? '선수 선택'
                                      : (() => { const p = popupPlayers.find(p => p.id === popupPlayerId); return p ? `${p.number != null ? `#${p.number} ` : ''}${p.name}` : '선수 선택' })()
                                  }
                              </span>
                              <span className="text-gray-400 text-xs">{playerDropdownOpen ? '▲' : '▼'}</span>
                          </button>
                          {playerDropdownOpen && (
                              <div className="absolute z-50 w-full mt-1 bg-[#333] border border-[#555] rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                                  {(() => {
                                      const filtered = popupPlayerType === 'all'
                                          ? popupPlayers
                                          : popupPlayerType === 'p'
                                              ? popupPlayers.filter(p => p.is_pitcher)
                                              : popupPlayers.filter(p => p.is_batter)
                                      return filtered.length === 0 ? (
                                          <div className="text-gray-400 text-sm text-center py-3">선수 없음</div>
                                      ) : filtered.map(p => (
                                          <button
                                              key={p.id}
                                              onClick={() => { setPopupPlayerId(p.id); setPlayerDropdownOpen(false) }}
                                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors active:opacity-80 ${popupPlayerId === p.id ? 'bg-[#6366f1] text-white' : 'text-gray-200 hover:bg-[#444]'}`}
                                          >
                                              {p.number != null ? <span className="text-[#fbbf24] font-bold">#{p.number} </span> : null}
                                              {p.name}{(p.is_pitcher || p.is_batter) ? <span className="opacity-60"> ({[p.is_pitcher && '투수', p.is_batter && '타자'].filter(Boolean).join('/')})</span> : null}
                                          </button>
                                      ))
                                  })()}
                              </div>
                          )}
                      </div>

                      {/* 투수 설정 (투수 필터 선택 시만 표시) */}
                      {popupPlayerType === 'p' && (() => {
                          const sidePitcherId = popupTeamSide === 'away' ? score?.top_pitcher_id : score?.bottom_pitcher_id
                          const currentPitcher = popupPlayers.find(p => p.id === sidePitcherId)
                          const selectedIsCurrentPitcher = popupPlayerId !== '' && popupPlayerId === sidePitcherId
                          return (
                              <div className="flex flex-col gap-2 p-3 bg-[#1a2a3a] rounded-xl border border-[#2a4a6a]">
                                  <div className="flex items-center justify-between">
                                      <span className="text-blue-300 text-xs font-bold">⚾ 현재 등판 투수</span>
                                      {currentPitcher ? (
                                          <div className="flex items-center gap-2">
                                              <span className="text-white text-sm font-bold">{currentPitcher.name}</span>
                                              <button
                                                  onClick={() => handleSetPitcher(null)}
                                                  className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white text-xs rounded-lg"
                                              >해제</button>
                                          </div>
                                      ) : (
                                          <span className="text-gray-400 text-xs">미설정</span>
                                      )}
                                  </div>
                                  <button
                                      onClick={() => { if (popupPlayerId !== '') handleSetPitcher(selectedIsCurrentPitcher ? null : popupPlayerId as number) }}
                                      disabled={popupPlayerId === ''}
                                      className={`w-full h-10 rounded-xl text-sm font-bold transition-colors disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed ${
                                          selectedIsCurrentPitcher
                                              ? 'bg-red-700 hover:bg-red-600 text-white'
                                              : 'bg-blue-700 hover:bg-blue-600 text-white'
                                      }`}
                                  >
                                      {popupPlayerId === '' ? '선수를 선택하세요' : selectedIsCurrentPitcher ? '🔴 투수 해제' : '⚾ 투수 등판'}
                                  </button>
                              </div>
                          )
                      })()}

                      {/* 위치 선택 */}
                      <div className="flex gap-2">
                          <button
                              onClick={() => setPopupPosition('left-middle')}
                              className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${popupPosition === 'left-middle' ? 'bg-[#00c853] text-white' : 'bg-[#444] text-gray-300'}`}
                          >
                              ◀ 좌측
                          </button>
                          <button
                              onClick={() => setPopupPosition('right-middle')}
                              className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${popupPosition === 'right-middle' ? 'bg-[#00c853] text-white' : 'bg-[#444] text-gray-300'}`}
                          >
                              우측 ▶
                          </button>
                      </div>

                      {/* 확인 버튼 + 노출 시간 */}
                      <div className="flex items-center gap-2">
                          <button
                              onClick={broadcastPlayerPopup}
                              disabled={popupPlayerId === '' || isBroadcasting}
                              className="flex-1 h-12 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#555] disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                          >
                              {isBroadcasting ? '방송 중...' : '확인'}
                          </button>
                          <button
                              onClick={() => setPopupDuration(prev => Math.max(1, prev - 1))}
                              className="w-9 h-12 bg-[#444] text-white text-lg font-bold rounded-xl active:opacity-80"
                          >−</button>
                          <div className="w-12 text-center text-white font-bold text-sm">{popupDuration}초</div>
                          <button
                              onClick={() => setPopupDuration(prev => Math.min(30, prev + 1))}
                              className="w-9 h-12 bg-[#444] text-white text-lg font-bold rounded-xl active:opacity-80"
                          >+</button>
                      </div>
                  </div>
              )}
          </div>

          {/* 오버레이 위치 (접기/펼치기) */}
          <div className="w-full px-4 pb-10">
              <button
                  onClick={() => setPositionOpen(prev => !prev)}
                  className="flex items-center justify-between w-full py-3 px-4 bg-[#333] rounded-2xl active:opacity-80"
              >
                  <span className="text-white text-base font-bold">📍오버레이 위치</span>
                  <span className="text-gray-400">{positionOpen ? '▲' : '▼'}</span>
              </button>
              {positionOpen && (
                  <div className="flex flex-col items-center mt-3">
                      <div className="grid grid-cols-3 gap-2 w-full mb-5">
                          {([
                              { key: 'top-left',      label: '↖ 상좌' },
                              { key: 'top-center',    label: '↑ 상중' },
                              { key: 'top-right',     label: '↗ 상우' },
                              { key: 'bottom-left',   label: '↙ 하좌' },
                              { key: 'bottom-center', label: '↓ 하중' },
                              { key: 'bottom-right',  label: '↘ 하우' },
                          ] as { key: OverlayPosition; label: string }[]).map(({ key, label }) => (
                              <button
                                  key={key}
                                  onClick={() => handlePositionChange(key)}
                                  className={`h-12 rounded-xl text-white text-sm font-medium active:opacity-80 ${overlayPosition === key ? 'bg-[#f97316]' : 'bg-[#444]'}`}
                              >
                                  {label}
                              </button>
                          ))}
                      </div>
                      <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                              <div className="text-white text-base font-bold">스케일</div>
                              <div className="flex items-center gap-2">
                                  <button
                                      onClick={() => handleScaleChange(Math.max(0.5, parseFloat((overlayScale - 0.1).toFixed(1))))}
                                      className="w-7 h-7 rounded bg-[#444] text-white text-base font-bold active:opacity-80 flex items-center justify-center"
                                  >‹</button>
                                  <div className="text-[#f97316] text-base font-bold w-10 text-center">{overlayScale.toFixed(1)}×</div>
                                  <button
                                      onClick={() => handleScaleChange(Math.min(3.0, parseFloat((overlayScale + 0.1).toFixed(1))))}
                                      className="w-7 h-7 rounded bg-[#444] text-white text-base font-bold active:opacity-80 flex items-center justify-center"
                                  >›</button>
                              </div>
                          </div>
                          <input
                              type="range"
                              min={0.5}
                              max={3.0}
                              step={0.1}
                              value={overlayScale}
                              onChange={(e) => handleScaleChange(Number(e.target.value))}
                              className="w-full accent-[#f97316]"
                          />
                          <div className="flex justify-between text-gray-400 text-xs mt-1">
                              <span>0.5×</span>
                              <span>3.0×</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>

        </div>
      )
}
  




import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import type { ScoreRow, OverlayPosition } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"
import { supabase } from "../utils/supabaseClient"

const gameInfoService = new SupabaseGameinfoService();
const scoreService = new SupabaseScoreService();
 

export default function ScoreControl() {
    const { gameId } = useParams<{ gameId: string }>()
    const [score, setScore] = useState<ScoreRow | null>(null)
    const [gameInfo, setGameInfo] = useState<any>(null)
    // const [ setGameInfo] = useState<GameInfoRow | null>(null)
    const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>('top-left')
    const [overlayScale, setOverlayScale] = useState(1.0)
    const [positionOpen, setPositionOpen] = useState(false)
    const overlayChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // 이닝 조작
    const handleInningChange = async (increment: boolean) => {
        if (!score) return;
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

    // 초말 토글
    const handleTopBottomToggle = async () => {
        if (!score) return;
        const updatedScore = { ...score };
        updatedScore.is_top = !score.is_top;
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update top/bottom:', error);
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

    // 볼/스트라이크/아웃 카운트 조작
    const handleCountChange = async (type: 'ball' | 'strike' | 'out') => {
        if (!score) return;
        const updatedScore = { ...score };
        
        switch (type) {
            case 'ball':
                updatedScore.b_count = (score.b_count + 1) % 4;
                break;
            case 'strike':
                updatedScore.s_count = (score.s_count + 1) % 3;
                break;
            case 'out':
                updatedScore.o_count = (score.o_count + 1) % 3;
                break;
        }
        
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update count:', error);
        }
    };

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
        const fetchScore = async () => {
            const data = await scoreService.getScore(Number(gameId));
            if (data) {
                setScore(data);
            }
        }
        const fetchGameInfo = async () => {
            const data = await gameInfoService.getGameInfo(Number(gameId));
            if (data) {
                setGameInfo(data);
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

        overlayChannelRef.current = supabase.channel(`overlay-control-${gameId}`)
        overlayChannelRef.current.subscribe()

        fetchScore();
        fetchGameInfo();

        return () => {
            unsubscribeScore();
            unsubscribeGameInfo();
            if (overlayChannelRef.current) {
                supabase.removeChannel(overlayChannelRef.current)
            }
        }
    }, [gameId]);

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
    
    return (
        <div className="bg-[#222] w-screen min-h-screen flex flex-col overflow-y-auto select-none">

          {/* 게임 제목 */}
          <div className="text-center pt-3 pb-2 px-4">
            <div className="text-white text-lg font-bold tracking-wide">{gameInfo?.away_team} vs {gameInfo?.home_team}</div>
          </div>

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

          {/* ① BSO 버튼 — 가장 자주 탭 */}
          <div className="flex flex-row gap-3 px-4 mb-2">
              <button
                  onClick={() => handleCountChange('ball')}
                  className="flex-1 h-20 bg-[#00c853] text-white text-2xl font-bold rounded-2xl active:opacity-80"
              >Ball</button>
              <button
                  onClick={() => handleCountChange('strike')}
                  className="flex-1 h-20 bg-[#d4a800] text-white text-2xl font-bold rounded-2xl active:opacity-80"
              >Strike</button>
              <button
                  onClick={() => handleCountChange('out')}
                  className="flex-1 h-20 bg-[#ff1744] text-white text-2xl font-bold rounded-2xl active:opacity-80"
              >Out</button>
          </div>

          {/* 볼카운트 초기화 */}
          <div className="px-4 mb-4">
              <button
                  onClick={() => handleCountReset()}
                  className="w-full h-14 bg-[#444] text-gray-200 text-base font-semibold rounded-2xl active:opacity-80"
              >볼카운트 초기화</button>
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
              >베이스<br/>초기화</button>
          </div>

          {/* 구분선 */}
          <div className="w-full border-t border-gray-700 mb-4"></div>

          {/* ③ 이닝·초말 / 점수 */}
          {/* 행1: 이닝 */}
          <div className="flex flex-row gap-3 px-4 mb-3">
              <div className="flex flex-col items-center w-full">
                  <div className="text-gray-400 text-xs mb-1.5">이닝</div>
                  <div className="flex items-center gap-2 w-full">
                      <button onClick={() => handleInningChange(false)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">−</button>
                      <div className="text-white text-2xl font-bold w-8 text-center">{inning}</div>
                      <button onClick={() => handleInningChange(true)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">+</button>
                  </div>
              </div>
          </div>
          {/* 행2: 초공A / 말공B 점수 */}
          <div className="flex flex-row gap-3 px-4 mb-6">
              <div className="flex flex-col items-center flex-1">
                  <div className="text-gray-400 text-xs mb-1.5">초공(A) 점수</div>
                  <div className="flex items-center gap-2 w-full">
                      <button onClick={() => handleScoreChange('a_score', false)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">−</button>
                      <div className="text-white text-2xl font-bold w-8 text-center">{a_score}</div>
                      <button onClick={() => handleScoreChange('a_score', true)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">+</button>
                  </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                  <div className="text-gray-400 text-xs mb-1.5">말공(B) 점수</div>
                  <div className="flex items-center gap-2 w-full">
                      <button onClick={() => handleScoreChange('h_score', false)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">−</button>
                      <div className="text-white text-2xl font-bold w-8 text-center">{h_score}</div>
                      <button onClick={() => handleScoreChange('h_score', true)} className="flex-1 h-14 bg-[#444] text-white text-2xl font-bold rounded-2xl active:opacity-80">+</button>
                  </div>
              </div>
          </div>

          {/* 오버레이 위치 (접기/펼치기) */}
          <div className="w-full px-4 pb-10">
              <button
                  onClick={() => setPositionOpen(prev => !prev)}
                  className="flex items-center justify-between w-full py-3 px-4 bg-[#333] rounded-2xl active:opacity-80"
              >
                  <span className="text-white text-base font-bold">오버레이 위치</span>
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
                              <div className="text-[#f97316] text-base font-bold">{overlayScale.toFixed(1)}×</div>
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
  




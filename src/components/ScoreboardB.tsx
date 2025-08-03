import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"
import type { ScoreRow, GameInfoRow } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"
import { getContrastYIQ } from "../utils/colorUtils"

const gameInfoService: SupabaseGameinfoService = new SupabaseGameinfoService();
const scoreService: SupabaseScoreService = new SupabaseScoreService();

function Circle({ active, color = 'green', size = 'w-6 h-6' }: { active?: boolean; color?: 'green' | 'yellow' | 'red'; size?: string }) {
  const colorClass = active
    ? color === 'red'
      ? 'bg-red-500'
      : color === 'yellow'
      ? 'bg-yellow-500'
      : 'bg-green-400'
    : 'bg-white'
  return <span className={`inline-block rounded-full mx-1 ${size} ${colorClass}`} />
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
    <div className="fixed inset-0 bg-transparent">
      <div
        ref={containerRef}
        className="w-[1200px] h-[60px] transition-opacity duration-700 opacity-100 origin-top-left"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {/* SCOREBOARD 콘텐츠 */}
        <div className="relative w-full h-full overflow-hidden bg-white flex">
          {/* 1. 좌측: 타이틀 */}
          <div className="w-[400px] h-full text-xl font-semibold text-black flex items-center justify-center">
            {gameTitle}
          </div>
          {/* 2. 중앙: 팀, 점수 */}
          <div className="relative flex w-[400px] h-full justify-center">
            {/*  어웨이 / 홈 팀 점수 */}
            <div style={{ backgroundColor: aBgColor }} className={`flex w-[50%] font-semibold items-center ${aTextColor}`}>
              <div className="text-lg font-bold text-center px-2 py-1 w-[70%]">{awayTeam}</div>
              <div className="text-3xl font-bold text-center w-[30%]">{awayScore}</div>
            </div>
            <div style={{ backgroundColor: hBgColor }} className={`flex w-[50%] font-semibold items-center ${hTextColor}`}>
              <div className="text-3xl font-bold text-center w-[30%]">{homeScore}</div>
              <div className="text-lg font-bold text-center px-2 py-1 w-[70%]">{homeTeam}</div>
            </div>
          </div>

        {/* 3. 우측: 이닝 주루 BSO */}
        <div className="flex w-[400px] items-center gap-3 px-2 py-0 text-base font-bold text-white bg-black/70">
        {/* 이닝 정보 */}
        <div className="flex w-[40px] text-2xl text-orange-500 justify-center">{inning} {isTop ? '▲' : '▼'}</div>
        {/* 주루 마름모 */}
        <div className="relative w-[70px] h-full flex items-center justify-center">
          {/* 2루 */}
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45  ${is_second ? 'bg-yellow-500' : 'bg-white'}`} />
          {/* 1루 */}
          <div className={`absolute bottom-[45%] right-3 translate-y-1/2 w-4 h-4 rotate-45  ${is_first ? 'bg-yellow-500' : 'bg-white'}`} />
          {/* 3루 */}
          <div className={`absolute bottom-[45%] left-3 translate-y-1/2 w-4 h-4 rotate-45  ${is_third ? 'bg-yellow-500' : 'bg-white'}`} />
        </div>
        {/* B */}
        <div className="flex items-center justify-center gap-1">
          <div className="text-base">B</div>
          <div className="flex ">
            {[...Array(3)].map((_, i) => (
                    <Circle key={i} active={i < bCount} color="green" size="w-4 h-4" />
              ))}
          </div>
        </div>
        {/* S */}
        <div className="flex items-center justify-center gap-1">
          <div className="text-base">S</div>
          <div className="flex ">
            {[...Array(2)].map((_, i) => (
                    <Circle key={i} active={i < sCount} color="yellow" size="w-4 h-4" />
                  ))}
          </div>
        </div>
        {/* O */}
        <div className="flex items-center justify-center gap-1">
          <div className="text-base">O</div>
          <div className="flex ">
            {[...Array(2)].map((_, i) => (
                    <Circle key={i} active={i < oCount} color="red" size="w-4 h-4" />
                  ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
  );
}

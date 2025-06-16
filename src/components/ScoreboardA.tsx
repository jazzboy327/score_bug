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
    : 'bg-gray-300'
  return <span className={`inline-block rounded-full mx-1 ${size} ${colorClass}`} />
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
    <div className="fixed inset-0 bg-transparent">
  <div
    ref={containerRef}
    className="w-[700px] h-[345px] transition-opacity duration-700 opacity-100 origin-top-left"
    style={{
      transform: `scale(${scale})`,
    }}
  >
    {/* SCOREBOARD 콘텐츠 */}
    <div className="relative w-full h-full overflow-hidden bg-white flex flex-col">
      {/* 1. 상단: 타이틀 */}
      <div className="h-[19%] text-2xl font-semibold text-black flex items-center justify-center">
        {gameTitle}
      </div>
      {/* 2. 중앙: 팀 + 주루 + 이닝 */}
      <div className="flex flex-row flex-grow px-0  py-0 h-[63%]">

        {/* 왼쪽 70%: 어웨이 / 홈 팀 점수 */}
        <div className="w-[70%] flex flex-col justify-center ">
          <div style={{ backgroundColor: aBgColor }} className={`flex items-center h-[50%] ${aTextColor}`}>
            <div className="text-4xl   text-center px-4 py-2 w-[70%]">{awayTeam}</div>
            <div className="text-6xl font-bold text-center  w-[30%]">{awayScore}</div>
          </div>
          <div style={{ backgroundColor: hBgColor }} className={`flex items-center h-[50%] ${hTextColor}`}>
            <div className="text-4xl text-center px-4 py-2 w-[70%]">{homeTeam}</div>
            <div className="text-6xl font-bold text-center w-[30%]">{homeScore}</div>
          </div>
        </div>

  {/* 오른쪽 30%: 주루 상황 + 이닝 */}
  <div className="w-[30%] flex flex-col items-center justify-center gap-6 bg-gray-200">

    {/* 주루 마름모 */}
    <div className="relative w-32 h-32 ">
      {/* 2루 */}
      <div className={`absolute top-5 left-1/2 -translate-x-1/2 w-12 h-12 rotate-45 rounded ${is_second ? 'bg-yellow-500' : 'bg-white'}`} />
      {/* 1루 */}
      <div className={`absolute bottom-1/3 right-0 translate-y-1/2 w-12 h-12 rotate-45 rounded ${is_first ? 'bg-yellow-500' : 'bg-white'}`} />
      {/* 3루 */}
      <div className={`absolute bottom-1/3 left-0 translate-y-1/2 w-12 h-12  rotate-45 rounded ${is_third ? 'bg-yellow-500' : 'bg-white'}`} />
     </div>

    {/* 이닝 정보 */}
    <div className="text-4xl font-semibold text-orange-500">{inning} {isTop ? '▲' : '▼'}</div>
  </div>
</div>

{/* 3. 하단: BSO */}
<div className="flex justify-center items-center gap-12 px-4 py-0 text-xl font-bold text-black h-[18%] divide-x divide-[#d9d9d9]">

  {/* B */}
  <div className="flex items-center justify-center gap-2 w-[37%]  ">
    <div className="text-4xl mr-2">B</div>
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
              <Circle key={i} active={i < bCount} color="green" size="w-8 h-8" />
        ))}
    </div>
  </div>

  {/* S */}
  <div className="flex items-center justify-center gap-2 w-[34%]">
    <div className="text-4xl mr-2">S</div>
    <div className="flex gap-2 mr-3">
      {[...Array(2)].map((_, i) => (
              <Circle key={i} active={i < sCount} color="yellow" size="w-8 h-8" />
            ))}
    </div>
  </div>

  {/* O */}
  <div className="flex items-center justify-center gap-2 w-[29%]">
    <div className="text-4xl mr-2">O</div>
    <div className="flex gap-2 mr-3">
      {[...Array(2)].map((_, i) => (
              <Circle key={i} active={i < oCount} color="red" size="w-8 h-8" />
            ))}
    </div>
  </div>
</div>
</div>
</div>
</div>
  );
}

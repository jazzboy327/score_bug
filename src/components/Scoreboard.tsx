import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../services/supabase"
import type { ScoreRow, GameInfoRow } from "../types/scoreboard"

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

// 베이스 다이아몬드 표시 컴포넌트 (빨간 사각형, 2배 크기)
function BaseDiamond({ runners }: { runners: [boolean, boolean, boolean] }) {
  // runners: [1루, 2루, 3루]
  return (
    <div className="flex flex-col items-center">
      {/* 다이아몬드 */}
      <div className="w-38 h-30 relative">
        { /* 1루 */}
        <div className={`w-12 h-12 left-[47.57px] top-[55px] absolute origin-top-left -rotate-45 ${runners[0] ? 'bg-orange-500' : 'bg-gray-300'}`} />
        { /* 2루 */}
        <div className={`w-12 h-12 left-[10.5px] top-[94px] absolute origin-top-left -rotate-45 ${runners[1] ? 'bg-orange-500' : 'bg-gray-300'}`} />
        { /* 3루 */}
        <div className={`w-12 h-12 left-[85px] top-[94px] absolute origin-top-left -rotate-45 ${runners[2] ? 'bg-orange-500' : 'bg-gray-300'}`} />
      </div>
    
    </div>
  );
}

export default function Scoreboard() {
  const { gameId } = useParams<{ gameId: string }>()
  const [score, setScore] = useState<ScoreRow | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfoRow | null>(null)

  useEffect(() => {
    const fetchScore = async () => {
      const { data } = await supabase
        .from("scores")
        .select("*")
        .eq("game_id", gameId)
        .order("updated_at", { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        console.log("fetchScore")
        console.log(data[0])
        setScore(data[0])
      }
    }
    const fetchGameInfo = async () => {
      const { data } = await supabase
        .from("game_info")
        .select("*")
        .eq("game_id", gameId)
        .limit(1)
      if (data && data.length > 0) {
        console.log("fetchGameInfo")
        console.log(data[0])
        setGameInfo(data[0])
      }
    }
    const scoreChannel = supabase
      .channel("score-update")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        fetchScore
      )
      .subscribe()
    const gameInfoChannel = supabase
      .channel("gameinfo-update")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_info" },
        fetchGameInfo
      )
      .subscribe()

    fetchScore()
    fetchGameInfo()

    return () => {
      supabase.removeChannel(scoreChannel)
      supabase.removeChannel(gameInfoChannel)
    }
  }, [gameId])

  // runners, 점수, 카운트 등 가공
  const runners: [boolean, boolean, boolean] = [
    score?.is_first ?? false,
    score?.is_second ?? false,
    score?.is_third ?? false,
  ]
  const inning = score?.inning ?? 1
  const isTop = score?.is_top ?? true
  const bCount = score?.b_count ?? 0
  const sCount = score?.s_count ?? 0
  const oCount = score?.o_count ?? 0
  const homeScore = score?.h_score ?? 0
  const awayScore = score?.a_score ?? 0
  const homeTeam = gameInfo?.home_team ?? "HOME"
  const awayTeam = gameInfo?.away_team ?? "AWAY"
  const gameTitle = gameInfo?.title ?? "경기 제목"

  return (
    <div className="bg-gray-100 w-[750px] p-4 font-sans text-xl rounded shadow-md mx-auto mt-8">
      {/* 상단: 대회명 */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
        <span className="text-gray-800 font-semibold text-3xl">{gameTitle}</span>
      </div>
      {/* 중간: 점수판 + 베이스/이닝 */}
      <div className="flex items-center space-x-8">
        {/* 점수판 */}
        <div className="bg-white rounded overflow-hidden border border-gray-300 w-[520px]">
          <div className="flex justify-between px-12 py-6 bg-gray-700 text-white">
            <span className="text-3xl">{awayTeam}</span>
            <span className="font-bold text-6xl">{awayScore}</span>
          </div>
          <div className="flex justify-between px-12 py-6 bg-blue-600 text-white">
            <span className="text-3xl">{homeTeam}</span>
            <span className="font-bold text-6xl">{homeScore}</span>
          </div>
        </div>
        {/* 주루상황 */}
        <div className="flex flex-col items-center justify-center w-36 mt-2 gap-2">
          <BaseDiamond runners={runners} />
          <div className="flex flex-row items-center justify-center mt-2 gap-2">
            <span className="text-4xl font-bold text-orange-500">{inning}</span>
            <span className="text-4xl text-orange-500">{isTop ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>
      {/* B/S/O 카운트 */}
      <div className="flex justify-around mt-6 px-8 text-5xl font-semibold text-gray-800">
        <div className="flex items-center space-x-2">
          <span>B</span>
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <Circle key={i} active={i < bCount} color="green" size="w-8 h-8" />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span>S</span>
          <div className="flex space-x-2">
            {[...Array(2)].map((_, i) => (
              <Circle key={i} active={i < sCount} color="yellow" size="w-8 h-8" />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span>O</span>
          <div className="flex space-x-2">
            {[...Array(2)].map((_, i) => (
              <Circle key={i} active={i < oCount} color="red" size="w-8 h-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

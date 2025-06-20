import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { ScoreRow, GameInfoRow } from "../types/scoreboard"
import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"

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
// 베이스 다이아몬드 표시 컴포넌트 (빨간 사각형, 2배 크기)
function BaseDiamondA({ runners }: { runners: [boolean, boolean, boolean] }) {
  // runners: [1루, 2루, 3루]
  return (
    <div className="flex flex-col items-center">
      {/* 다이아몬드 */}
      <div className="w-38 h-30 relative">
        { /* 1루 */}
        <div className={`w-12 h-12 left-[47.57px] top-[55px] absolute origin-top-left -rotate-45 ${runners[1] ? 'bg-orange-500' : 'bg-gray-300'}`} />
        { /* 2루 */}
        <div className={`w-12 h-12 left-[10.5px] top-[94px] absolute origin-top-left -rotate-45 ${runners[2] ? 'bg-orange-500' : 'bg-gray-300'}`} />
        { /* 3루 */}
        <div className={`w-12 h-12 left-[85px] top-[94px] absolute origin-top-left -rotate-45 ${runners[0] ? 'bg-orange-500' : 'bg-gray-300'}`} />
      </div>
    
    </div>
  );
}
// 베이스 다이아몬드 표시 컴포넌트 (빨간 사각형, 2배 크기)
function BaseDiamondB({ runners }: { runners: [boolean, boolean, boolean] }) {
  // runners: [1루, 2루, 3루]
  return (
    <div className="flex flex-col items-center">
      {/* 다이아몬드 */}
      <div className="w-25  relative">
        { /* 2루 */}
        <div className={`w-5 h-5 left-[45px] top-[30px] absolute origin-top-left -rotate-45 ${runners[1] ? 'bg-orange-500' : 'bg-gray-300'}`} />
        { /* 3루 */}
        <div className={`w-5 h-5 left-[25px] top-[50px] absolute origin-top-left -rotate-45 ${runners[2] ? 'bg-orange-500' : 'bg-gray-300'}`} />
        { /* 1루 */}
        <div className={`w-5 h-5 left-[65px] top-[50px] absolute origin-top-left -rotate-45 ${runners[0] ? 'bg-orange-500' : 'bg-gray-300'}`} />
      </div>
    </div>
  );
}

function getContrastYIQ(hexcolor: string){
  // '#' 기호 제거 (있어도 없어도 OK하게 처리)
  const hex = hexcolor.replace('#', '')

  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? 'text-black' : 'text-white'
}

// A타입 템플릿 (기존 스타일)
function ScoreboardTemplateA({ 
  gameTitle, 
  awayTeam, 
  homeTeam, 
  awayScore, 
  homeScore, 
  aBgColor, 
  hBgColor, 
  aTextColor, 
  hTextColor, 
  runners, 
  inning, 
  isTop, 
  bCount, 
  sCount, 
  oCount 
}: {
  gameTitle: string
  awayTeam: string
  homeTeam: string
  awayScore: number
  homeScore: number
  aBgColor: string
  hBgColor: string
  aTextColor: string
  hTextColor: string
  runners: [boolean, boolean, boolean]
  inning: number
  isTop: boolean
  bCount: number
  sCount: number
  oCount: number
}) {
  return (
    <div className="bg-gray-100 w-[750px] p-4 font-sans text-xl rounded shadow-md mx-auto mt-8">
      {/* 상단: 대회명 */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
        <span className="text-gray-800 font-semibold text-3xl truncate max-w-full block">{gameTitle}</span>
      </div>
      {/* 중간: 점수판 + 베이스/이닝 */}
      <div className="flex items-center space-x-8">
        {/* 점수판 */}
        <div className="bg-white rounded overflow-hidden border border-gray-300 w-[520px]">
          <div style={{ backgroundColor: aBgColor }}className={`flex justify-between px-12 py-6 ${aTextColor}`}>
            <span className="text-6xl truncate max-w-full block">{awayTeam}</span>
            <span className="font-bold text-6xl">{awayScore}</span>
          </div>
          <div style={{ backgroundColor: hBgColor }}className={`flex justify-between px-12 py-6 ${hTextColor}`}>
            <span className="text-6xl truncate max-w-full block">{homeTeam}</span>
            <span className="font-bold text-6xl">{homeScore}</span>
          </div>
        </div>
        {/* 주루상황 */}
        <div className="flex flex-col items-center justify-center w-36 mt-2 gap-2">
          <BaseDiamondA runners={runners} />
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

// B타입 템플릿 (새로운 스타일)
function ScoreboardTemplateB({ 
  gameTitle, 
  awayTeam, 
  homeTeam, 
  awayScore, 
  homeScore, 
  aBgColor, 
  hBgColor, 
  aTextColor, 
  hTextColor, 
  runners, 
  inning, 
  isTop, 
  bCount, 
  sCount, 
  oCount 
}: {
  gameTitle: string
  awayTeam: string
  homeTeam: string
  awayScore: number
  homeScore: number
  aBgColor: string
  hBgColor: string
  aTextColor: string
  hTextColor: string
  runners: [boolean, boolean, boolean]
  inning: number
  isTop: boolean
  bCount: number
  sCount: number
  oCount: number
}) {
  return (
      <div className="flex items-center justify-between  bg-white[0%] w-full  font-sans text-xl h-[80px]">
        {/* 타이틀 */}
        <div className="flex-shrink-0">
          <span className="text-black font-bold text-2xl ml-5  mr-5">{gameTitle}</span>
        </div>
        
        {/* 어웨이팀명 점수 */}
        <div className="flex flex-1 w-full">
          <div style={{ backgroundColor: aBgColor }} className={`flex items-center px-6 py-4 ${aTextColor} flex-1 h-full`}>
            <span className="text-3xl font-bold mr-4 whitespace-nowrap overflow-hidden text-ellipsis">{awayTeam}</span>
            <span className="text-4xl font-bold whitespace-nowrap">{awayScore}</span>
          </div>
          
          {/* 점수 홈팀명 */}
          <div style={{ backgroundColor: hBgColor }} className={`flex items-center px-6 py-4 ${hTextColor} flex-1 h-full`}>
            <span className="text-4xl font-bold mr-4 whitespace-nowrap">{homeScore}</span>
            <span className="text-3xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{homeTeam}</span>
          </div>
        </div>
        
        {/* 이닝, 주루, 카운트 */}
        <div className="flex items-center space-x-4 bg-black h-[90%]">
          {/* 이닝 */}
          <div className="flex items-center space-x-2 bg-black h-full ">
            <span className="text-2xl font-bold text-white ml-3 whitespace-nowrap overflow-hidden text-ellipsis">{inning}회</span>
            <span className="text-2xl text-white">{isTop ? '▲' : '▼'}</span>
          </div>
          
          {/* 주루 */}
          <div className="flex flex-col items-center bg-black h-full">
            <BaseDiamondB runners={runners} />
          </div>
          
          {/* 카운트 */}
          <div className="flex items-center space-x-4 bg-black text-white">
            <div className="flex items-center space-x-2 h-full">
              <span className="text-xl font-bold">B</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Circle key={i} active={i < bCount} color="green" size="w-7 h-7" />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 h-full">
              <span className="text-xl font-bold">S</span>
              <div className="flex space-x-1">
                {[...Array(2)].map((_, i) => (
                  <Circle key={i} active={i < sCount} color="yellow" size="w-7 h-7" />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 h-full mr-2">
              <span className="text-xl font-bold">O</span>
              <div className="flex space-x-1">
                {[...Array(2)].map((_, i) => (
                  <Circle key={i} active={i < oCount} color="red" size="w-7 h-7" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default function Scoreboard() {
  const { gameId, template = 'a' } = useParams<{ gameId: string; template?: string }>()
  const [score, setScore] = useState<ScoreRow | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfoRow | null>(null)

  useEffect(() => {
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
      unsubscribeScore()
      unsubscribeGameInfo()
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

  const hBgColor = gameInfo?.home_bg_color ?? "#374151"
  const aBgColor = gameInfo?.away_bg_color ?? "#f7f7f7"
  const hTextColor = getContrastYIQ(hBgColor)
  const aTextColor = getContrastYIQ(aBgColor)

  // 템플릿 타입에 따라 분기
  const templateProps = {
    gameTitle,
    awayTeam,
    homeTeam,
    awayScore,
    homeScore,
    aBgColor,
    hBgColor,
    aTextColor,
    hTextColor,
    runners,
    inning,
    isTop,
    bCount,
    sCount,
    oCount
  }

  return template === 'b' ? (
    <ScoreboardTemplateB {...templateProps} />
  ) : (
    <ScoreboardTemplateA {...templateProps} />
  )
}


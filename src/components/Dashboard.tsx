import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import type { GameInfoRow, GameBatterStats } from '../types/scoreboard'

// 더미 타자 데이터 생성
function generateDummyBatterStats(gameId: number, _homeTeam: string, _awayTeam: string): GameBatterStats[] {
  const homeNames = ['김철수', '이영희', '박민준', '최지훈', '정우성', '강동원', '류준열', '조인성']
  const awayNames = ['한석규', '설경구', '최민식', '황정민', '송강호', '이병헌', '정우성', '원빈']
  const makeStats = (names: string[], side: 'home' | 'away'): GameBatterStats[] =>
    names.slice(0, 6).map((name, i) => {
      const ab = Math.floor(Math.random() * 3) + 2
      const hits = Math.floor(Math.random() * (ab + 1))
      const hr = hits > 0 && Math.random() > 0.8 ? 1 : 0
      return {
        id: i + (side === 'home' ? 100 : 200),
        game_id: gameId,
        player_id: null,
        player_name: name,
        team_side: side,
        at_bats: ab,
        hits,
        doubles: hits > 1 && Math.random() > 0.7 ? 1 : 0,
        triples: 0,
        home_runs: hr,
        rbi: hr + Math.floor(Math.random() * 2),
        runs: Math.floor(Math.random() * 2),
        walks: Math.random() > 0.7 ? 1 : 0,
        strikeouts: Math.floor(Math.random() * 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })
  return [...makeStats(homeNames, 'home'), ...makeStats(awayNames, 'away')]
}

interface PitcherStat {
  pitcher_id: number
  pitcher_name: string
  team_side: 'top' | 'bottom'
  pitcher_number?: number
  pitcher_photo?: string
  innings: { inning: number; is_top: boolean; pitch_count: number; ball_count: number; strike_count: number }[]
  total_pitch: number
  total_ball: number
  total_strike: number
}

async function fetchPitcherStats(gameId: number): Promise<PitcherStat[]> {
  const { data, error } = await supabase
    .from('pitch_inning_log')
    .select(`id, pitcher_id, team_side, inning, is_top, pitch_count, ball_count, strike_count, players!pitcher_id(name, number, photo_url, pitcher_photo_url)`)
    .eq('game_id', gameId)
    .order('inning', { ascending: true })

  if (error || !data) return []

  const map = new Map<number, PitcherStat>()
  for (const row of data) {
    const existing = map.get(row.pitcher_id)
    const inningEntry = {
      inning: row.inning,
      is_top: row.is_top,
      pitch_count: row.pitch_count ?? 0,
      ball_count: row.ball_count ?? 0,
      strike_count: row.strike_count ?? 0,
    }
    if (existing) {
      existing.innings.push(inningEntry)
      existing.total_pitch += inningEntry.pitch_count
      existing.total_ball += inningEntry.ball_count
      existing.total_strike += inningEntry.strike_count
    } else {
      const player = row.players as any
      const name = player?.name ?? `선수 #${row.pitcher_id}`
      const photo = player?.pitcher_photo_url || player?.photo_url || null
      map.set(row.pitcher_id, {
        pitcher_id: row.pitcher_id,
        pitcher_name: name,
        pitcher_number: player?.number ?? undefined,
        pitcher_photo: photo,
        team_side: row.team_side,
        innings: [inningEntry],
        total_pitch: inningEntry.pitch_count,
        total_ball: inningEntry.ball_count,
        total_strike: inningEntry.strike_count,
      })
    }
  }
  return Array.from(map.values())
}

function avg(hits: number, ab: number) {
  if (ab === 0) return '.000'
  return ('.' + Math.round((hits / ab) * 1000).toString().padStart(3, '0'))
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [games, setGames] = useState<GameInfoRow[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedGame, setSelectedGame] = useState<GameInfoRow | null>(null)
  const [activeTab, setActiveTab] = useState<'pitcher' | 'batter'>('pitcher')
  const [pitcherStats, setPitcherStats] = useState<PitcherStat[]>([])
  const [batterStats, setBatterStats] = useState<GameBatterStats[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    supabase
      .from('game_info')
      .select('*')
      .order('date_time', { ascending: false })
      .then(({ data }) => {
        if (data) setGames(data as GameInfoRow[])
      })
  }, [])

  const years = Array.from(new Set(games.map(g => new Date(g.date_time).getFullYear()))).sort((a, b) => b - a)
  if (!years.includes(selectedYear) && years.length > 0) {
    // auto select latest year
  }
  const availableYears = years.length > 0 ? years : [new Date().getFullYear()]

  const filteredGames = games.filter(g => new Date(g.date_time).getFullYear() === selectedYear)

  const openGame = async (game: GameInfoRow) => {
    setSelectedGame(game)
    setActiveTab('pitcher')
    setLoadingDetail(true)
    try {
      const stats = await fetchPitcherStats(game.game_id)
      setPitcherStats(stats)
      setBatterStats(generateDummyBatterStats(game.game_id, game.home_team, game.away_team))
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeModal = () => setSelectedGame(null)

  const formatDate = (dt: string) => {
    const d = new Date(dt)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#333]">
        <button onClick={() => navigate('/a')} className="text-gray-400 text-sm hover:text-white">← 관리</button>
        <h1 className="text-lg font-bold tracking-wide">⚾ 기록 대시보드</h1>
        <div className="w-12" />
      </div>

      {/* 연도 탭 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              selectedYear === year
                ? 'bg-blue-500 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
          >
            {year}년
          </button>
        ))}
      </div>

      {/* 게임 목록 */}
      <div className="px-4 pb-6">
        {filteredGames.length === 0 ? (
          <div className="text-center text-gray-500 py-16">경기 기록이 없습니다</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGames.map(game => (
              <button
                key={game.game_id}
                onClick={() => openGame(game)}
                className="w-full text-left bg-[#1e1e1e] rounded-2xl p-4 border border-[#333] hover:border-[#555] active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{formatDate(game.date_time)}</span>
                  {game.field && <span className="text-xs text-gray-600">{game.field}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-300 shrink-0">{game.title}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm font-bold text-white">{game.away_team}</span>
                    <span className="text-xs font-black text-gray-500">VS</span>
                    <span className="text-sm font-bold text-white">{game.home_team}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 게임 상세 모달 */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={closeModal}>
          <div
            className="bg-[#1a1a1a] rounded-t-2xl mt-auto max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#333]">
              <div>
                <div className="font-bold text-white">{selectedGame.away_team} vs {selectedGame.home_team}</div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(selectedGame.date_time)} · {selectedGame.field}</div>
              </div>
              <button onClick={closeModal} className="text-gray-400 text-2xl leading-none hover:text-white">×</button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-[#333]">
              <button
                onClick={() => setActiveTab('pitcher')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'pitcher' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}
              >
                ⚾ 투수 기록
              </button>
              <button
                onClick={() => setActiveTab('batter')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'batter' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500'}`}
              >
                🏏 타자 기록
              </button>
            </div>

            {/* 탭 내용 */}
            <div className="overflow-y-auto flex-1 p-4">
              {loadingDetail ? (
                <div className="text-center text-gray-500 py-10">불러오는 중...</div>
              ) : activeTab === 'pitcher' ? (
                <PitcherTab stats={pitcherStats} game={selectedGame} />
              ) : (
                <BatterTab stats={batterStats} game={selectedGame} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PitcherTab({ stats, game }: { stats: PitcherStat[]; game: GameInfoRow }) {
  if (stats.length === 0) {
    return <div className="text-center text-gray-500 py-10">투구 기록이 없습니다</div>
  }

  const homePitchers = stats.filter(s => s.team_side === 'bottom')
  const awayPitchers = stats.filter(s => s.team_side === 'top')

  return (
    <div className="flex flex-col gap-6">
      {([
        { label: game.home_team + ' (홈)', pitchers: homePitchers, color: 'text-blue-300' },
        { label: game.away_team + ' (원정)', pitchers: awayPitchers, color: 'text-red-300' },
      ] as const).map(({ label, pitchers, color }) => (
        pitchers.length > 0 && (
          <div key={label}>
            <div className={`text-xs font-bold mb-2 ${color}`}>{label}</div>
            <div className="flex flex-col gap-3">
              {pitchers.map(p => (
                <div key={p.pitcher_id} className="bg-[#242424] rounded-xl p-3 flex items-center gap-3">
                  {/* 사진 + 이름 */}
                  <div className="flex flex-col items-center gap-1 shrink-0 w-16">
                    {p.pitcher_photo ? (
                      <img src={p.pitcher_photo} alt={p.pitcher_name} className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#444]" onError={e => { e.currentTarget.style.display='none' }} />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#333] flex items-center justify-center text-2xl">⚾</div>
                    )}
                    {p.pitcher_number !== undefined && (
                      <div className="text-[10px] text-gray-400 font-bold">#{p.pitcher_number}</div>
                    )}
                    <div className="text-[11px] font-bold text-white text-center leading-tight">{p.pitcher_name}</div>
                  </div>
                  {/* 이닝별 - 가로 스크롤 */}
                  <div className="flex gap-1.5 overflow-x-auto flex-1 py-1">
                    {p.innings.map((inn, i) => (
                      <div key={i} className="bg-[#1a1a1a] rounded-lg px-2 py-1.5 text-center shrink-0">
                        <div className="text-[10px] text-gray-500 mb-0.5">{inn.inning}{inn.is_top ? '초' : '말'}</div>
                        <div className="text-sm font-black text-white leading-none">
                          {inn.pitch_count}<span className="text-[9px] font-normal text-gray-400">구</span>
                        </div>
                        <div className="text-[10px] mt-0.5 whitespace-nowrap">
                          <span className="text-green-400">B{inn.ball_count}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-yellow-400">S{inn.strike_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 합계 */}
                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    <div className="text-center">
                      <div className="text-[9px] text-gray-500">투구</div>
                      <div className="text-2xl font-black text-white leading-none">{p.total_pitch}</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-center">
                        <div className="text-[9px] text-gray-500">B</div>
                        <div className="text-lg font-black text-green-400 leading-none">{p.total_ball}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-gray-500">S</div>
                        <div className="text-lg font-black text-yellow-400 leading-none">{p.total_strike}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  )
}

function BatterTab({ stats, game }: { stats: GameBatterStats[]; game: GameInfoRow }) {
  const homeStats = stats.filter(s => s.team_side === 'home')
  const awayStats = stats.filter(s => s.team_side === 'away')

  return (
    <div className="flex flex-col gap-6">
      {([
        { label: game.home_team + ' (홈)', batters: homeStats, color: 'text-blue-300' },
        { label: game.away_team + ' (원정)', batters: awayStats, color: 'text-red-300' },
      ] as const).map(({ label, batters, color }) => (
        batters.length > 0 && (
          <div key={label}>
            <div className={`text-xs font-bold mb-2 ${color}`}>{label}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-[#333]">
                    <th className="text-left py-1.5 pr-2 font-medium">선수</th>
                    <th className="text-center py-1.5 px-1 font-medium">타수</th>
                    <th className="text-center py-1.5 px-1 font-medium">안타</th>
                    <th className="text-center py-1.5 px-1 font-medium">타율</th>
                    <th className="text-center py-1.5 px-1 font-medium">타점</th>
                    <th className="text-center py-1.5 px-1 font-medium">득점</th>
                    <th className="text-center py-1.5 px-1 font-medium">홈런</th>
                    <th className="text-center py-1.5 px-1 font-medium">볼넷</th>
                    <th className="text-center py-1.5 px-1 font-medium">삼진</th>
                  </tr>
                </thead>
                <tbody>
                  {batters.map((b, i) => (
                    <tr key={i} className="border-b border-[#222] hover:bg-[#1e1e1e]">
                      <td className="py-2 pr-2 font-medium text-white">{b.player_name}</td>
                      <td className="text-center py-2 px-1 text-gray-300">{b.at_bats}</td>
                      <td className="text-center py-2 px-1 text-white font-bold">{b.hits}</td>
                      <td className="text-center py-2 px-1 text-yellow-400">{avg(b.hits, b.at_bats)}</td>
                      <td className="text-center py-2 px-1 text-gray-300">{b.rbi}</td>
                      <td className="text-center py-2 px-1 text-gray-300">{b.runs}</td>
                      <td className="text-center py-2 px-1 text-orange-400">{b.home_runs > 0 ? b.home_runs : '-'}</td>
                      <td className="text-center py-2 px-1 text-green-400">{b.walks > 0 ? b.walks : '-'}</td>
                      <td className="text-center py-2 px-1 text-red-400">{b.strikeouts > 0 ? b.strikeouts : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-gray-600 mt-2">* 타자 기록은 더미 데이터입니다</div>
          </div>
        )
      ))}
    </div>
  )
}

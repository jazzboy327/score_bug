import { useState } from "react"
import { useParams } from "react-router-dom"
import type { ScoreRow } from "../types/scoreboard"
import { SupabaseScoreService } from "../services/SupabaseScoreService"

const scoreService = new SupabaseScoreService();

export default function AdminPanel() {
  const { gameId } = useParams<{ gameId: string }>();
  const [team, setTeam] = useState<'home' | 'away'>('home')
  const [inning, setInning] = useState(1)
  const [runs, setRuns] = useState(0)

  const updateScore = async () => {
    const score: ScoreRow = {
      id: '',
      game_id: Number(gameId),
      inning,
      is_top: true,
      h_score: team === 'home' ? runs : 0,
      a_score: team === 'away' ? runs : 0,
      s_count: 0,
      b_count: 0,
      o_count: 0,
      is_first: false,
      is_second: false,
      is_third: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await scoreService.updateLiveScore(score);
  }

  return (
    <div className="text-white bg-black p-6 w-full max-w-4xl mx-auto font-mono rounded-2xl">
      <h1 className="text-3xl text-center mb-6">⚙️ Admin Panel</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Team</label>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value as 'home' | 'away')}
            className="w-full p-2 rounded bg-gray-800"
          >
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Inning</label>
          <input
            type="number"
            min="1"
            max="9"
            value={inning}
            onChange={(e) => setInning(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-800"
          />
        </div>

        <div>
          <label className="block mb-2">Runs</label>
          <input
            type="number"
            min="0"
            value={runs}
            onChange={(e) => setRuns(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-800"
          />
        </div>

        <div className="col-span-2">
          <button
            onClick={updateScore}
            className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Update Score
          </button>
        </div>
      </div>
    </div>
  )
}

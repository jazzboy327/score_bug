import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupabaseTeamsService } from '../services/SupabaseTeamsService'
import { SupabasePlayersService } from '../services/SupabasePlayersService'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import { SupabaseScoreService } from '../services/SupabaseScoreService'
import { userAuth } from '../hooks/userAuth'
import { Appconfig } from '../config'
import type { TeamRow, PlayerRow, GameInfoRow, ScoreRow } from '../types/scoreboard'

const teamsService = new SupabaseTeamsService()
const playersService = new SupabasePlayersService()
const gameInfoService = new SupabaseGameinfoService()
const scoreService = new SupabaseScoreService()

const POSITIONS = ['투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자', '내야수','외야수']
const THROWS_BATS_OPTIONS = ['우투우타', '우투좌타', '우투양타', '좌투우타', '좌투좌타', '좌투양타']

const emptyForm = {
    number: '',
    name: '',
    position: '',
    sub_position: '',
    hand_type: '',
    is_pitcher: false,
    is_batter: false,
}

export default function PlayerManagement() {
    const navigate = useNavigate()
    userAuth()

    const [teams, setTeams] = useState<TeamRow[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
    const [players, setPlayers] = useState<PlayerRow[]>([])
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
    const [liveGame, setLiveGame] = useState<GameInfoRow | null>(null)
    const [liveScore, setLiveScore] = useState<ScoreRow | null>(null)

    const [gridCols, setGridCols] = useState(2)
    const [showModal, setShowModal] = useState(false)
    const [editingPlayer, setEditingPlayer] = useState<PlayerRow | null>(null)
    const [formData, setFormData] = useState(emptyForm)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState('')
    const [pitcherPhotoFile, setPitcherPhotoFile] = useState<File | null>(null)
    const [pitcherPhotoPreview, setPitcherPhotoPreview] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pitcherFileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        teamsService.getAllTeams().then(setTeams).catch(console.error)
    }, [])

    useEffect(() => {
        gameInfoService.getAllGames()
            .then(games => {
                const live = games.find(g => g.is_live) ?? null
                setLiveGame(live)
                if (live) {
                    scoreService.getScore(live.game_id)
                        .then(setLiveScore)
                        .catch(console.error)
                }
            })
            .catch(console.error)
    }, [])

    useEffect(() => {
        if (selectedTeamId == null) {
            setPlayers([])
            return
        }
        setIsLoadingPlayers(true)
        playersService.getAllPlayersByTeam(selectedTeamId)
            .then(setPlayers)
            .catch(console.error)
            .finally(() => setIsLoadingPlayers(false))
    }, [selectedTeamId])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const handlePitcherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPitcherPhotoFile(file)
        setPitcherPhotoPreview(URL.createObjectURL(file))
    }

    const handleOpenModal = () => {
        setEditingPlayer(null)
        setFormData(emptyForm)
        setPhotoFile(null)
        setPhotoPreview('')
        setPitcherPhotoFile(null)
        setPitcherPhotoPreview('')
        setError('')
        setShowModal(true)
    }

    const handleOpenEditModal = (player: PlayerRow) => {
        setEditingPlayer(player)
        setFormData({
            number: player.number != null ? String(player.number) : '',
            name: player.name,
            position: player.position || '',
            sub_position: player.sub_position || '',
            hand_type: player.hand_type || '',
            is_pitcher: player.is_pitcher ?? false,
            is_batter: player.is_batter ?? false,
        })
        setPhotoFile(null)
        setPhotoPreview(player.photo_url || '')
        setPitcherPhotoFile(null)
        setPitcherPhotoPreview(player.pitcher_photo_url || '')
        setError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!selectedTeamId) return
        if (!formData.name.trim()) {
            setError('선수 이름을 입력하세요.')
            return
        }
        setIsSaving(true)
        setError('')

        try {
            let photo_url: string | undefined
            if (photoFile) {
                photo_url = await playersService.uploadPhoto(selectedTeamId, photoFile)
            }
            let pitcher_photo_url: string | undefined
            if (pitcherPhotoFile) {
                pitcher_photo_url = await playersService.uploadPhoto(selectedTeamId, pitcherPhotoFile)
            }

            const fields = {
                number: formData.number ? Number(formData.number) : undefined,
                name: formData.name.trim(),
                position: formData.position || undefined,
                sub_position: formData.sub_position || undefined,
                hand_type: formData.hand_type || undefined,
                photo_url: photo_url ?? (editingPlayer?.photo_url || undefined),
                pitcher_photo_url: pitcher_photo_url ?? (editingPlayer?.pitcher_photo_url || undefined),
                is_pitcher: formData.is_pitcher,
                is_batter: formData.is_batter,
            }

            if (editingPlayer) {
                await playersService.updatePlayer(editingPlayer.id, fields)
            } else {
                await playersService.createPlayer({ team_id: selectedTeamId, ...fields })
            }

            // 목록 갱신
            const updated = await playersService.getAllPlayersByTeam(selectedTeamId)
            setPlayers(updated)
            setShowModal(false)
        } catch (err) {
            console.error(err)
            setError('선수 등록에 실패했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (playerId: number) => {
        if (!window.confirm('이 선수를 삭제하시겠습니까?')) return
        try {
            await playersService.deletePlayer(playerId)
            setPlayers(prev => prev.filter(p => p.id !== playerId))
        } catch (err) {
            console.error(err)
            alert('삭제에 실패했습니다.')
        }
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId)

    const teamSide: 'top' | 'bottom' | null = selectedTeam && liveGame
        ? selectedTeam.name === liveGame.home_team
            ? 'bottom'
            : selectedTeam.name === liveGame.away_team
                ? 'top'
                : null
        : null

    const currentPitcherId = teamSide === 'top'
        ? liveScore?.top_pitcher_id
        : teamSide === 'bottom'
            ? liveScore?.bottom_pitcher_id
            : null

    const handleSetPitcher = async (player: PlayerRow) => {
        if (!liveGame || !teamSide) return
        const isCurrentPitcher = currentPitcherId === player.id
        try {
            await scoreService.setPitcher(liveGame.game_id, teamSide, isCurrentPitcher ? null : player.id, isCurrentPitcher ? null : player.name)
            const updated = await scoreService.getScore(liveGame.game_id)
            setLiveScore(updated)
        } catch (err) {
            console.error(err)
            alert('투수 설정에 실패했습니다.')
        }
    }

    const inputClass = "w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500 transition-colors"
    const selectClass = "w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500 transition-colors"

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <div className="max-w-5xl mx-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">선수 관리</h1>
                        <p className="text-gray-400">팀별 선수 등록 및 관리</p>
                    </div>
                    <button
                        onClick={() => navigate(Appconfig.admin_panel_url)}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        ← 경기 목록
                    </button>
                </div>

                {/* 팀 선택 */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
                    <label className="block text-white font-medium mb-3">팀 선택</label>
                    {teams.length === 0 ? (
                        <p className="text-gray-400 text-sm">저장된 팀이 없습니다. 먼저 경기를 등록하고 테마를 저장하세요.</p>
                    ) : (
                        <select
                            value={selectedTeamId ?? ''}
                            onChange={e => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full max-w-xs px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                        >
                            <option value="">팀을 선택하세요</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* 선수 목록 */}
                {selectedTeamId != null && (
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {selectedTeam?.name} 선수단
                                    <span className="ml-2 text-sm text-gray-400 font-normal">({players.length}명)</span>
                                </h2>
                                {liveGame && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        {teamSide
                                            ? <span className="bg-gray-700 px-2 py-1 rounded text-green-400">
                                                {liveGame.title} — {teamSide === 'bottom' ? '홈팀(초이닝 투수)' : '원정팀(말이닝 투수)'}
                                              </span>
                                            : <span className="bg-gray-700 px-2 py-1 rounded text-yellow-400">이 팀은 현재 진행중 경기에 없습니다</span>
                                        }
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex rounded-lg overflow-hidden border border-gray-600">
                                    {[2, 3, 4].map(col => (
                                        <button
                                            key={col}
                                            onClick={() => setGridCols(col)}
                                            className={`px-3 py-1.5 text-sm font-medium transition-colors ${gridCols === col ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'}`}
                                        >
                                            {col}열
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleOpenModal}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    + 선수 등록
                                </button>
                            </div>
                        </div>

                        {isLoadingPlayers ? (
                            <p className="text-gray-400 text-center py-8">로딩 중...</p>
                        ) : players.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-3">⚾</div>
                                <p className="text-gray-400">등록된 선수가 없습니다.</p>
                            </div>
                        ) : (
                            <div className={`grid gap-3 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                {players.map(player => (
                                    <div key={player.id} className="bg-gray-700 rounded-xl p-3 flex items-center gap-3 relative group hover:bg-gray-600 transition-colors">
                                        {/* 사진 */}
                                        {player.photo_url ? (
                                            <img
                                                src={player.photo_url}
                                                alt={player.name}
                                                className="w-14 h-14 rounded-xl object-cover object-top flex-shrink-0 border border-gray-500"
                                                onError={e => { e.currentTarget.style.display = 'none' }}
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gray-600 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                                        )}
                                        {/* 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-1.5">
                                                {player.number != null && (
                                                    <span className="text-yellow-400 font-bold text-sm flex-shrink-0">#{player.number}</span>
                                                )}
                                                <span className="text-white font-semibold text-sm truncate">{player.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {player.is_pitcher && (
                                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">투수</span>
                                                )}
                                                {player.is_batter && (
                                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white">타자</span>
                                                )}
                                                <span className="text-gray-400 text-xs truncate">
                                                    {[player.position, player.sub_position].filter(Boolean).join(', ') || '—'}
                                                </span>
                                            </div>
                                            {player.hand_type && (
                                                <div className="text-gray-500 text-xs">{player.hand_type}</div>
                                            )}
                                        </div>
                                        {/* 액션 버튼 */}
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            {player.is_pitcher && teamSide && (
                                                <button
                                                    onClick={() => handleSetPitcher(player)}
                                                    className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center ${
                                                        currentPitcherId === player.id
                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                            : 'bg-blue-700 hover:bg-blue-600 text-white'
                                                    }`}
                                                    title={currentPitcherId === player.id ? '등판 해제' : '현재 투수 설정'}
                                                >
                                                    {currentPitcherId === player.id ? '🔴' : '⚾'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleOpenEditModal(player)}
                                                className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center justify-center"
                                            >✏</button>
                                            <button
                                                onClick={() => handleDelete(player.id)}
                                                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs flex items-center justify-center"
                                            >✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 선수 등록 모달 */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-5">
                            {editingPlayer ? `선수 수정 — ${editingPlayer.name}` : `선수 등록 — ${selectedTeam?.name}`}
                        </h3>

                        {error && (
                            <div className="bg-red-600 text-white px-3 py-2 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* 사진 업로드 */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">선수 사진</label>
                                <div className="flex gap-6 justify-center">
                                    {/* 타자 사진 */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-20 h-20 rounded-xl bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors overflow-hidden"
                                        >
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="타자" className="w-full h-full object-cover object-top" />
                                            ) : (
                                                <span className="text-2xl">📷</span>
                                            )}
                                        </div>
                                        <span className="text-orange-400 text-xs font-medium">타자</span>
                                    </div>
                                    {/* 투수 사진 */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div
                                            onClick={() => pitcherFileInputRef.current?.click()}
                                            className="w-20 h-20 rounded-xl bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
                                        >
                                            {pitcherPhotoPreview ? (
                                                <img src={pitcherPhotoPreview} alt="투수" className="w-full h-full object-cover object-top" />
                                            ) : (
                                                <span className="text-2xl">📷</span>
                                            )}
                                        </div>
                                        <span className="text-blue-400 text-xs font-medium">투수</span>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                                <input
                                    ref={pitcherFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePitcherPhotoChange}
                                />
                                <p className="text-gray-500 text-xs text-center mt-1">클릭하여 사진 선택</p>
                            </div>

                            {/* 번호 + 이름 */}
                            <div className="flex gap-3">
                                <div className="w-24">
                                    <label className="block text-white text-sm font-medium mb-1">등번호</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={formData.number}
                                        onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                                        className={inputClass}
                                        placeholder="00"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-white text-sm font-medium mb-1">이름 *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className={inputClass}
                                        placeholder="선수 이름"
                                    />
                                </div>
                            </div>

                            {/* 포지션 */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-white text-sm font-medium mb-1">주 포지션</label>
                                    <select
                                        value={formData.position}
                                        onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                        className={selectClass}
                                    >
                                        <option value="">선택</option>
                                        {POSITIONS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-white text-sm font-medium mb-1">부 포지션</label>
                                    <select
                                        value={formData.sub_position}
                                        onChange={e => setFormData(prev => ({ ...prev, sub_position: e.target.value }))}
                                        className={selectClass}
                                    >
                                        <option value="">선택</option>
                                        {POSITIONS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 역할 (중복 선택 가능) */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">역할 <span className="text-gray-400 font-normal text-xs">(중복 선택 가능)</span></label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_pitcher: !prev.is_pitcher }))}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${formData.is_pitcher ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                    >
                                        ⚾ 투수
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_batter: !prev.is_batter }))}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${formData.is_batter ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                                    >
                                        🏏 타자
                                    </button>
                                </div>
                            </div>

                            {/* 투타 */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-1">투타</label>
                                <select
                                    value={formData.hand_type}
                                    onChange={e => setFormData(prev => ({ ...prev, hand_type: e.target.value }))}
                                    className={selectClass}
                                >
                                    <option value="">선택</option>
                                    {THROWS_BATS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
                            >
                                {isSaving ? (editingPlayer ? '수정 중...' : '등록 중...') : (editingPlayer ? '수정' : '등록')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

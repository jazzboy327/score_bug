import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import { SupabaseScoreService } from '../services/SupabaseScoreService'
import { SupabaseTeamsService } from '../services/SupabaseTeamsService'
import type { GameInfoRow, TeamRow } from '../types/scoreboard'
import { Appconfig } from "../config"

const gameInfoService = new SupabaseGameinfoService()
const scoreService = new SupabaseScoreService()
const teamsService = new SupabaseTeamsService()

interface GameFormProps {
    mode?: 'create' | 'edit'
}

// 커스텀 Time Picker 컴포넌트
interface TimePickerProps {
    value: string
    onChange: (time: string) => void
    className?: string
}

function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
    const [selectedHour, selectedMinute] = value ? value.split(':').map(Number) : [0, 0]

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: 6 }, (_, i) => i * 10) // 10분 단위

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const hour = parseInt(e.target.value)
        const timeString = `${hour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
        onChange(timeString)
    }

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const minute = parseInt(e.target.value)
        const timeString = `${selectedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        onChange(timeString)
    }

    return (
        <div className="flex gap-2">
            <select
                value={selectedHour}
                onChange={handleHourChange}
                className={`flex-1 px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors ${className}`}
            >
                {hours.map(hour => (
                    <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}시
                    </option>
                ))}
            </select>

            <select
                value={selectedMinute}
                onChange={handleMinuteChange}
                className={`flex-1 px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors ${className}`}
            >
                {minutes.map(minute => (
                    <option key={minute} value={minute}>
                        {minute.toString().padStart(2, '0')}분
                    </option>
                ))}
            </select>
        </div>
    )
}

export default function GameForm({ mode = 'create' }: GameFormProps) {
    const navigate = useNavigate()
    const { gameId } = useParams<{ gameId: string }>()
    const [formData, setFormData] = useState({
        title: '',
        a_team: '',
        h_team: '',
        game_date: '',
        game_time: '',
        field: '경기장',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // 팀 목록 및 선택 모드
    const [teams, setTeams] = useState<TeamRow[]>([])
    const [awayMode, setAwayMode] = useState<'select' | 'manual'>('select')
    const [homeMode, setHomeMode] = useState<'select' | 'manual'>('select')

    // 선택된 팀의 색상/로고 (숨겨진 상태)
    const [awayTeamMeta, setAwayTeamMeta] = useState({ logo_url: '', bg_color: '' })
    const [homeTeamMeta, setHomeTeamMeta] = useState({ logo_url: '', bg_color: '' })

    // 수정 모드일 때 기존 데이터 로드
    useEffect(() => {
        if (mode === 'edit' && gameId) {
            loadGameData()
        }
    }, [mode, gameId])

    useEffect(() => {
        loadTeams()
    }, [])

    const loadTeams = async () => {
        try {
            const data = await teamsService.getAllTeams()
            setTeams(data)
        } catch (err) {
            console.error('Failed to load teams:', err)
        }
    }

    const loadGameData = async () => {
        try {
            const gameData = await gameInfoService.getGameInfo(Number(gameId))
            if (gameData) {
                // ISO 날짜 문자열을 날짜와 시간으로 분리
                const gameDate = new Date(gameData.date_time)
                const dateStr = gameDate.toISOString().split('T')[0]
                const timeStr = gameDate.toTimeString().slice(0, 5)

                setFormData({
                    title: gameData.title || '',
                    a_team: gameData.away_team || '',
                    h_team: gameData.home_team || '',
                    game_date: dateStr,
                    game_time: timeStr,
                    field: gameData.field || '',
                })
                // 수정 모드에서는 수기 입력 모드로
                setAwayMode('manual')
                setHomeMode('manual')
            }
        } catch (err) {
            console.error('Failed to load game data:', err)
            setError('게임 데이터를 불러오는데 실패했습니다.')
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleTimeChange = (time: string) => {
        setFormData(prev => ({
            ...prev,
            game_time: time
        }))
    }

    const handleAwayTeamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value
        setFormData(prev => ({ ...prev, a_team: selectedName }))
        const found = teams.find(t => t.name === selectedName)
        if (found) {
            setAwayTeamMeta({
                logo_url: found.logo_url || '',
                bg_color: found.bg_color || ''
            })
        } else {
            setAwayTeamMeta({ logo_url: '', bg_color: '' })
        }
    }

    const handleHomeTeamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value
        setFormData(prev => ({ ...prev, h_team: selectedName }))
        const found = teams.find(t => t.name === selectedName)
        if (found) {
            setHomeTeamMeta({
                logo_url: found.logo_url || '',
                bg_color: found.bg_color || ''
            })
        } else {
            setHomeTeamMeta({ logo_url: '', bg_color: '' })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // 날짜와 시간을 결합
            const gameDateTime = `${formData.game_date}T${formData.game_time}:00`

            if (mode === 'create') {
                // 새 게임 생성
                const newGame = await gameInfoService.createGameInfo({
                    user_id: await gameInfoService.getUserId(),
                    title: formData.title,
                    away_team: formData.a_team,
                    home_team: formData.h_team,
                    date_time: gameDateTime,
                    field: formData.field,
                    is_live: true,
                    home_bg_color: homeTeamMeta.bg_color || '#374151',
                    away_bg_color: awayTeamMeta.bg_color || '#f7f7f7',
                    home_team_logo_url: homeTeamMeta.logo_url || undefined,
                    away_team_logo_url: awayTeamMeta.logo_url || undefined,
                    title_font_size: 23,
                    team_name_font_size: 25
                })

                if (newGame) {
                    // 기본 스코어 생성
                    try {
                        await scoreService.createScore(Number(newGame.game_id))
                        alert('경기가 성공적으로 등록되었습니다!')
                        navigate(Appconfig.admin_panel_url)
                    } catch (scoreError) {
                        console.error('Failed to create default score:', scoreError)
                        // 게임은 생성되었지만 스코어 생성 실패
                        alert('경기는 등록되었지만 기본 스코어 생성에 실패했습니다.')
                        navigate(Appconfig.admin_panel_url)
                    }
                }
            } else if (mode === 'edit' && gameId) {
                // 기존 게임 수정
                const updatedGame = await gameInfoService.updateGameInfo({
                    game_id: Number(gameId),
                    title: formData.title,
                    away_team: formData.a_team,
                    home_team: formData.h_team,
                    date_time: gameDateTime,
                    field: formData.field,
                    is_live: true
                } as GameInfoRow)
                if (updatedGame.success) {
                    alert('경기 정보가 성공적으로 수정되었습니다!')
                    navigate(Appconfig.admin_panel_url)
                }else{
                    setError('경기 수정에 실패했습니다.')
                }

            }
        } catch (err) {
            console.error('Failed to save game:', err)
            setError(mode === 'create' ? '경기 등록에 실패했습니다.' : '경기 수정에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const isEditMode = mode === 'edit'
    const inputClass = "w-full px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors"

    return (
        <div className="min-h-screen bg-[#222] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-[#333] rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">
                        {isEditMode ? '경기 수정' : '경기 등록'}
                    </h2>

                    {error && (
                        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 대회명 */}
                        <div>
                            <label htmlFor="title" className="block text-white text-sm font-medium mb-2">
                                대회명 *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className={inputClass}
                                placeholder="대회명을 입력하세요"
                            />
                        </div>

                        {/* 초공격 팀명 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-white text-sm font-medium">
                                    초공격 팀명 *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAwayMode(m => m === 'select' ? 'manual' : 'select')
                                        setFormData(prev => ({ ...prev, a_team: '' }))
                                        setAwayTeamMeta({ logo_url: '', bg_color: '' })
                                    }}
                                    className="text-xs text-[#00c853] hover:text-[#00a844] transition-colors"
                                >
                                    {awayMode === 'select' ? '✏️ 직접 입력' : '📋 목록에서 선택'}
                                </button>
                            </div>
                            {awayMode === 'select' ? (
                                <select
                                    value={formData.a_team}
                                    onChange={handleAwayTeamSelect}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">팀을 선택하세요</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.name}>{team.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    id="a_team"
                                    name="a_team"
                                    value={formData.a_team}
                                    onChange={handleInputChange}
                                    required
                                    className={inputClass}
                                    placeholder="초공격 팀명을 입력하세요"
                                />
                            )}
                        </div>

                        {/* 말공격 팀명 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-white text-sm font-medium">
                                    말공격 팀명 *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHomeMode(m => m === 'select' ? 'manual' : 'select')
                                        setFormData(prev => ({ ...prev, h_team: '' }))
                                        setHomeTeamMeta({ logo_url: '', bg_color: '' })
                                    }}
                                    className="text-xs text-[#00c853] hover:text-[#00a844] transition-colors"
                                >
                                    {homeMode === 'select' ? '✏️ 직접 입력' : '📋 목록에서 선택'}
                                </button>
                            </div>
                            {homeMode === 'select' ? (
                                <select
                                    value={formData.h_team}
                                    onChange={handleHomeTeamSelect}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">팀을 선택하세요</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.name}>{team.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    id="h_team"
                                    name="h_team"
                                    value={formData.h_team}
                                    onChange={handleInputChange}
                                    required
                                    className={inputClass}
                                    placeholder="말공격 팀명을 입력하세요"
                                />
                            )}
                        </div>

                        {/* 경기 날짜 */}
                        <div>
                            <label htmlFor="game_date" className="block text-white text-sm font-medium mb-2">
                                경기 날짜 *
                            </label>
                            <input
                                type="date"
                                id="game_date"
                                name="game_date"
                                value={formData.game_date}
                                onChange={handleInputChange}
                                required
                                className={inputClass}
                            />
                        </div>

                        {/* 경기 시간 */}
                        <div>
                            <label htmlFor="game_time" className="block text-white text-sm font-medium mb-2">
                                경기 시간 * (10분 단위)
                            </label>
                            <TimePicker value={formData.game_time} onChange={handleTimeChange} />
                        </div>

                        {/* 경기장 */}
                        <div>
                            <label htmlFor="field" className="block text-white text-sm font-medium mb-2">
                                경기장 *
                            </label>
                            <input
                                type="text"
                                id="field"
                                name="field"
                                value={formData.field}
                                onChange={handleInputChange}
                                required
                                className={inputClass}
                                placeholder="경기장을 입력하세요"
                            />
                        </div>

                        {/* 버튼들 */}
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#00c853] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#00a844] disabled:bg-[#666] disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading
                                    ? (isEditMode ? '수정 중...' : '등록 중...')
                                    : (isEditMode ? '경기 수정' : '경기 등록')
                                }
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(Appconfig.admin_panel_url)}
                                className="w-full bg-[#666] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#555] transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

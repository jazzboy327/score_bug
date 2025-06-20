import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import { SupabaseScoreService } from '../services/SupabaseScoreService'
import type { GameInfoRow } from '../types/scoreboard'
import { Appconfig } from "../config"

const gameInfoService = new SupabaseGameinfoService()
const scoreService = new SupabaseScoreService()

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
        field: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // 수정 모드일 때 기존 데이터 로드
    useEffect(() => {
        if (mode === 'edit' && gameId) {
            loadGameData()
        }
    }, [mode, gameId])

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
                    field: gameData.field || ''
                })
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
                    title: formData.title,
                    away_team: formData.a_team,
                    home_team: formData.h_team,
                    date_time: gameDateTime,
                    field: formData.field,
                    is_live: false,
                    home_bg_color: '#374151',
                    away_bg_color: '#f7f7f7'
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
                                className="w-full px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors"
                                placeholder="대회명을 입력하세요"
                            />
                        </div>

                        {/* 초공격 팀명 */}
                        <div>
                            <label htmlFor="a_team" className="block text-white text-sm font-medium mb-2">
                                초공격 팀명 *
                            </label>
                            <input
                                type="text"
                                id="a_team"
                                name="a_team"
                                value={formData.a_team}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors"
                                placeholder="초공격 팀명을 입력하세요"
                            />
                        </div>

                        {/* 말공격 팀명 */}
                        <div>
                            <label htmlFor="h_team" className="block text-white text-sm font-medium mb-2">
                                말공격 팀명 *
                            </label>
                            <input
                                type="text"
                                id="h_team"
                                name="h_team"
                                value={formData.h_team}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors"
                                placeholder="말공격 팀명을 입력하세요"
                            />
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
                                className="w-full px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors"
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
                                className="w-full px-4 py-3 bg-[#444] text-white rounded-lg border border-[#555] focus:outline-none focus:border-[#00c853] transition-colors"
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
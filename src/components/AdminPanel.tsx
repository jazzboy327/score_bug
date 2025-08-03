import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import type { GameInfoWithScore } from '../types/scoreboard'
import { Appconfig } from "../config"
import { userAuth } from '../hooks/userAuth'
import { GameCard } from './GameCard'
import { getContrastYIQ } from '../utils/colorUtils'

// services
const gameInfoService = new SupabaseGameinfoService()
// default export
export default function AdminPanel() {
    const navigate = useNavigate()
    userAuth() // 인증 처리는 훅에서 자동으로 처리됨
    
    const [games, setGames] = useState<GameInfoWithScore[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [showThemeModal, setShowThemeModal] = useState(false)
    const [selectedGame, setSelectedGame] = useState<GameInfoWithScore | null>(null)
    const [themeColors, setThemeColors] = useState({
        home_bg_color: '#374151',
        away_bg_color: '#f7f7f7'
    })

    useEffect(() => {
        loadGames()
    }, [])

    const loadGames = async () => {
        try {
            setIsLoading(true)
            const gamesData = await gameInfoService.getAllGamesWithScores()
            setGames(gamesData || [])
        } catch (err) {
            console.error('Failed to load games:', err)
            setError('경기 목록을 불러오는데 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateGame = () => {
        navigate(Appconfig.register_url)
    }

    const handleEditGame = (gameId: number) => {
        navigate(`${Appconfig.edit_url.replace(":gameId", gameId.toString())}`)
    }

    const handleDeleteGame = async (gameId: number) => {
        if (window.confirm('정말로 이 경기를 삭제하시겠습니까?')) {
            try {
                await gameInfoService.deleteGame(gameId)
                alert('경기가 삭제되었습니다.')
                loadGames() // 목록 새로고침
            } catch (err) {
                console.error('Failed to delete game:', err)
                alert('경기 삭제에 실패했습니다.')
            }
        }
    }

    const handleOverlayView = (gameId: number, template: 'a' | 'b' = 'a') => {
        let url = ''
        if(template === 'a'){
            url =`${window.location.origin}${Appconfig.scoreboardA_template_url.replace(':gameId', gameId.toString())}`
        }else{
            url =`${window.location.origin}${Appconfig.scoreboardB_template_url.replace(':gameId', gameId.toString())}`
        }
        window.open(url, '_blank', 'width=1200,height=800')
    }

    const handleCopyUrl = (gameId: number, template: 'a' | 'b' = 'a') => {
        let url = ''
        if(template === 'a'){
            url =`${window.location.origin}${Appconfig.scoreboardA_template_url.replace(':gameId', gameId.toString())}`
        }else{
            url =`${window.location.origin}${Appconfig.scoreboardB_template_url.replace(':gameId', gameId.toString())}`
        }
        navigator.clipboard.writeText(url).then(() => {
            alert('URL이 클립보드에 복사되었습니다!')
        }).catch(() => {
            // 클립보드 API가 지원되지 않는 경우
            const textArea = document.createElement('textarea')
            textArea.value = url
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            alert('URL이 클립보드에 복사되었습니다!')
        })
    }

    const handleOpenController = (gameId: number) => {
        const controllerUrl = `${window.location.origin}${Appconfig.controller_url.replace(':gameId', gameId.toString())}`
        window.open(controllerUrl, '_blank', 'width=1200,height=800')
    }

    const handleThemeChange = (game: GameInfoWithScore) => {
        setSelectedGame(game)
        setThemeColors({
            home_bg_color: game.home_bg_color || '#374151',
            away_bg_color: game.away_bg_color || '#f7f7f7'
        })
        setShowThemeModal(true)
    }

    const handleSaveTheme = async () => {
        if (!selectedGame) return
        
        try {
            const updatedGame = {
                ...selectedGame,
                home_bg_color: themeColors.home_bg_color,
                away_bg_color: themeColors.away_bg_color
            }
            
            const result = await gameInfoService.updateGameInfo(updatedGame)
            if (result.success) {
                alert('테마가 성공적으로 변경되었습니다.')
                setShowThemeModal(false)
                loadGames() // 목록 새로고침
            } else {
                alert('테마 변경에 실패했습니다: ' + result.error)
            }
        } catch (err) {
            console.error('Failed to update theme:', err)
            alert('테마 변경에 실패했습니다.')
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#222] flex items-center justify-center">
                <div className="text-white text-xl">로딩 중...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">경기 목록</h1>
                        <p className="text-gray-400">경기 관리 및 스코어보드 제어</p>
                    </div>
                    <button
                        onClick={handleCreateGame}
                        className="w-30 h-10 bg-gradient-to-r from-green-500 to-green-600 text-sm text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        + New Game
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-xl mb-6 shadow-lg">
                        {error}
                    </div>
                )}

                {/* 경기 목록 */}
                <div className="mb-6">
                    {games.length === 0 ? (
                        <div className="bg-gray-800 rounded-2xl p-12 text-center shadow-lg">
                            <div className="text-6xl mb-4">⚾</div>
                            <p className="text-gray-400 text-xl">등록된 경기가 없습니다.</p>
                            <p className="text-gray-500 mt-2">새 경기를 등록해보세요!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.map((game) => (
                                // 분리된 GameCard 컴포넌트를 사용
                                <GameCard 
                                    key={game.game_id} 
                                    game={game}
                                    // 필요한 핸들러 함수들을 props로 전달
                                    onOverlayView={handleOverlayView}
                                    onOpenController={handleOpenController}
                                    onEdit={handleEditGame}
                                    onDelete={handleDeleteGame}
                                    onCopyUrl={handleCopyUrl}
                                    onThemeChange={handleThemeChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 테마 변경 모달 */}
            {showThemeModal && selectedGame && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">테마 변경 - {selectedGame.title}</h3>
                        
                        <div className="space-y-4">
                            {/* 홈팀 색상 */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    홈팀 ({selectedGame.home_team}) 배경색
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        list="bookmark-colors"
                                        value={themeColors.home_bg_color}
                                        onChange={(e) => setThemeColors(prev => ({
                                            ...prev,
                                            home_bg_color: e.target.value
                                        }))}
                                        className="w-30 h-10 rounded border-2 border-gray-600 cursor-pointer"
                                    />
                                    <datalist id="bookmark-colors"> 
                                        <option value="#f7f7f7"></option>
                                        <option value="#374151"></option>
                                        <option value="#1f2937"></option>
                                        <option value="#000000"></option>
                                        <option value="#ffffff"></option>
                                        <option value="#ff0000"></option>
                                        <option value="#00ff00"></option>
                                        <option value="#0000ff"></option>
                                        <option value="#ffff00"></option>
                                        <option value="#ffa500"></option>
                                    </datalist>
                                    <input
                                        type="text"
                                        value={themeColors.home_bg_color}
                                        onChange={(e) => setThemeColors(prev => ({
                                            ...prev,
                                            home_bg_color: e.target.value
                                        }))}
                                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                                        placeholder="#1f2937"
                                    />
                                </div>
                            </div>

                            {/* 원정팀 색상 */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    원정팀 ({selectedGame.away_team}) 배경색
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        list="bookmark-colors"
                                        value={themeColors.away_bg_color}
                                        onChange={(e) => setThemeColors(prev => ({
                                            ...prev,
                                            away_bg_color: e.target.value
                                        }))}
                                        className="w-30 h-10 rounded border-2 border-gray-600 cursor-pointer"
                                    />
                                    <datalist id="bookmark-colors"> 
                                        <option value="#ffffff"></option>
                                        <option value="#f7f7f7"></option>
                                        <option value="#e5e7eb"></option>
                                        <option value="#374151"></option>
                                        <option value="#1f2937"></option>
                                        <option value="#000000"></option>
                                        <option value="#3b82f6"></option>
                                        <option value="#ef4444"></option>
                                        <option value="#22c55e"></option>
                                        <option value="#eab308"></option>
                                        <option value="#f97316"></option>
                                        <option value="#8b5cf6"></option>
                                        <option value="#dc2626"></option>
                                        <option value="#16a34a"></option>
                                        <option value="#facc15"></option>

                                    </datalist>
                                    <input
                                        type="text"
                                        value={themeColors.away_bg_color}
                                        onChange={(e) => setThemeColors(prev => ({
                                            ...prev,
                                            away_bg_color: e.target.value
                                        }))}
                                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                                        placeholder="#1f2937"
                                    />
                                </div>
                            </div>

                            {/* 미리보기 */}
                            <div className="bg-gray-700 rounded-lg p-4">
                                <h4 className="text-white text-sm font-medium mb-2">미리보기</h4>
                                <div className="flex items-center justify-between">
                                    <div 
                                        className="text-center flex-1 p-2 rounded"
                                        style={{ backgroundColor: themeColors.away_bg_color }}
                                    >
                                        <div className={`text-lg font-semibold ${getContrastYIQ(themeColors.away_bg_color)}`}>{selectedGame.away_team}</div>
                                        <div className={`text-xs ${getContrastYIQ(themeColors.away_bg_color)}`}>원정팀</div>
                                    </div>
                                    <div className="text-white font-bold mx-2">VS</div>
                                    <div 
                                        className="text-center flex-1 p-2 rounded"
                                        style={{ backgroundColor: themeColors.home_bg_color }}
                                    >
                                        <div className={`text-lg font-semibold ${getContrastYIQ(themeColors.home_bg_color)}`}>{selectedGame.home_team}</div>
                                        <div className={`text-xs ${getContrastYIQ(themeColors.home_bg_color)}`}>홈팀</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowThemeModal(false)}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-500 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveTheme}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 
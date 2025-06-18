import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import type { GameInfoRow } from '../types/scoreboard'
import { SupabaseJwtproviderService } from '../services/SupabaeJwtproviderService'
const gameInfoService = new SupabaseGameinfoService()

const jwtPayloadService = new SupabaseJwtproviderService()

export default  function AdminPanel(){
    const navigate = useNavigate()

    const token = localStorage.getItem('sb-ansxsldpzaiqomeuwsuo-auth-token') || ''
    if (!token) {
        navigate('/')
    }else{
        const isExpired = async () => {
            const isExpired = await jwtPayloadService.isTokenExpired()
            if (isExpired) {
                await jwtPayloadService.refreshToken()
            }
        }
        isExpired()
    }
    
    const [games, setGames] = useState<GameInfoRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadGames()
    }, [])

    const loadGames = async () => {
        try {
            setIsLoading(true)
            const gamesData = await gameInfoService.getAllGames()
            setGames(gamesData || [])
        } catch (err) {
            console.error('Failed to load games:', err)
            setError('경기 목록을 불러오는데 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateGame = () => {
        navigate('/register')
    }

    const handleEditGame = (gameId: number) => {
        navigate(`/edit/${gameId}`)
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

    const handleOverlayView = (gameId: number) => {
        const url = `${window.location.origin}/overlay/${gameId}`
        window.open(url, '_blank', 'width=1200,height=800')
        // navigate(`/overlay/${gameId}`)
    }

    const handleCopyUrl = (gameId: number) => {
        const url = `${window.location.origin}/overlay/${gameId}`
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
        const controllerUrl = `${window.location.origin}/control/${gameId}`
        window.open(controllerUrl, '_blank', 'width=1200,height=800')
    }

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime)
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (isLive: boolean) => {
        return isLive ? (
            <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                진행중
            </span>
        ) : (
            <span className="px-2 py-1 text-xs font-medium bg-gray-500 text-white rounded-full">
                대기중
            </span>
        )
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
                        <h1 className="text-4xl font-bold text-white mb-2">관리자 화면</h1>
                        <p className="text-gray-400">경기 관리 및 스코어보드 제어</p>
                    </div>
                    <button
                        onClick={handleCreateGame}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        + 새 경기 등록
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-xl mb-6 shadow-lg">
                        {error}
                    </div>
                )}

                {/* 경기 목록 */}
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-6">경기 목록</h2>
                    
                    {games.length === 0 ? (
                        <div className="bg-gray-800 rounded-2xl p-12 text-center shadow-lg">
                            <div className="text-6xl mb-4">⚾</div>
                            <p className="text-gray-400 text-xl">등록된 경기가 없습니다.</p>
                            <p className="text-gray-500 mt-2">새 경기를 등록해보세요!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.map((game) => (
                                <div key={game.game_id} className="bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-700">
                                    {/* 카드 헤더 */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-1 truncate">
                                                {game.title}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                {getStatusBadge(game.is_live)}
                                                <span className="text-sm text-gray-400">
                                                    {formatDateTime(game.date_time)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 팀 정보 */}
                                    <div className="bg-gray-700 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-center flex-1">
                                                <div className="text-lg font-semibold text-white">{game.away_team}</div>
                                                <div className="text-xs text-gray-400">원정팀</div>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-400 mx-4">VS</div>
                                            <div className="text-center flex-1">
                                                <div className="text-lg font-semibold text-white">{game.home_team}</div>
                                                <div className="text-xs text-gray-400">홈팀</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 경기장 정보 */}
                                    <div className="mb-6">
                                        <div className="flex items-center text-gray-300 mb-2">
                                            <span className="text-lg mr-2">🏟️</span>
                                            <span className="font-medium">경기장</span>
                                        </div>
                                        <p className="text-white font-semibold">{game.field}</p>
                                    </div>

                                    {/* 액션 버튼들 */}
                                    <div className="space-y-3">
                                        {/* 주요 액션 */}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleOverlayView(game.game_id)}
                                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm"
                                            >
                                                📺 스코어보드
                                            </button>
                                            <button
                                                onClick={() => handleOpenController(game.game_id)}
                                                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-sm"
                                            >
                                                🎮 컨트롤러
                                            </button>
                                        </div>

                                        {/* 보조 액션 */}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditGame(game.game_id)}
                                                className="flex-1 bg-gray-700 text-white py-2 px-3 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                                            >
                                                ✏️ 수정
                                            </button>
                                            <button
                                                onClick={() => handleCopyUrl(game.game_id)}
                                                className="flex-1 bg-gray-700 text-white py-2 px-3 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                                            >
                                                🔗 URL복사
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGame(game.game_id)}
                                                className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                                            >
                                                🗑️ 삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 
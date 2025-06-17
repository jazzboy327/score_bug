import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import type { GameInfoRow } from '../types/scoreboard'

const gameInfoService = new SupabaseGameinfoService()

export default function AdminPanel() {
    const navigate = useNavigate()
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
        <div className="min-h-screen bg-[#222] p-6">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">관리자 화면</h1>
                    <button
                        onClick={handleCreateGame}
                        className="bg-[#00c853] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#00a844] transition-colors"
                    >
                        New Game
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* 경기 목록 */}
                <div className="bg-[#333] rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#555]">
                        <h2 className="text-xl font-semibold text-white">경기 목록</h2>
                    </div>
                    
                    {games.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-400 text-lg">등록된 경기가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#444]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            대회명
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            팀
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            경기장
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            날짜/시간
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            상태
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            관리
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#333] divide-y divide-[#555]">
                                    {games.map((game) => (
                                        <tr key={game.game_id} className="hover:bg-[#444] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">
                                                    {game.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">
                                                    {game.away_team} vs {game.home_team}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">
                                                    {game.field}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">
                                                    {formatDateTime(game.date_time)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(game.is_live)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditGame(game.game_id)}
                                                        className="text-[#00c853] hover:text-[#00a844] transition-colors"
                                                    >
                                                        Edit⚙️ ┃
                                                    </button>
                                                    <button
                                                        onClick={() => handleOverlayView(game.game_id)}
                                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        Score↗ ┃
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyUrl(game.game_id)}
                                                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                                    >
                                                        URL🔗 ┃
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenController(game.game_id)}
                                                        className="text-purple-400 hover:text-purple-300 transition-colors"
                                                    >
                                                        Control↗ ┃
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGame(game.game_id)}
                                                        className="text-red-500 hover:text-red-400 transition-colors"
                                                    >
                                                        Delete🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 
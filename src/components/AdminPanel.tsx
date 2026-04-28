import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupabaseGameinfoService } from '../services/SupabaseGameinfoService'
import { SupabaseTeamsService } from '../services/SupabaseTeamsService'
import { SupabaseProfileService } from '../services/SupabaseProfileService'
import type { GameInfoWithScore } from '../types/scoreboard'
import { Appconfig } from "../config"
import { userAuth } from '../hooks/userAuth'
import { GameCard } from './GameCard'
import { getContrastYIQ } from '../utils/colorUtils'

// services
const gameInfoService = new SupabaseGameinfoService()
const teamsService = new SupabaseTeamsService()
const profileService = new SupabaseProfileService()
// default export
export default function AdminPanel() {
    const navigate = useNavigate()
    userAuth() // 인증 처리는 훅에서 자동으로 처리됨
    
    const [games, setGames] = useState<GameInfoWithScore[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [userCode, setUserCode] = useState<string | null>(null)
    const [showThemeModal, setShowThemeModal] = useState(false)
    const [selectedGame, setSelectedGame] = useState<GameInfoWithScore | null>(null)
    const [themeColors, setThemeColors] = useState({
        home_bg_color: '#374151',
        away_bg_color: '#f7f7f7'
    })
    const [fontSizes, setFontSizes] = useState({
        title_font_size: 30,
        team_name_font_size: 30
    })
    const [logoUrls, setLogoUrls] = useState({
        home_team_logo_url: '',
        away_team_logo_url: ''
    })

    useEffect(() => {
        loadGames()
        profileService.getMyCode().then(code => setUserCode(code))
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

    const handleSetLive = async (gameId: number) => {
        try {
            const game = games.find(g => g.game_id === gameId)
            const isCurrentlyLive = game?.is_live ?? false
            const result = await gameInfoService.setLiveGame(gameId, isCurrentlyLive)
            if (result.success) {
                loadGames()
            } else {
                alert('활성화에 실패했습니다: ' + result.error)
            }
        } catch (err) {
            console.error('Failed to set live game:', err)
            alert('활성화에 실패했습니다.')
        }
    }

    const handleSwapTeams = async (game: GameInfoWithScore) => {
        if (!window.confirm(`홈(${game.home_team})과 원정(${game.away_team})을 서로 바꾸시겠습니까?`)) return
        try {
            const swapped = {
                ...game,
                home_team: game.away_team,
                away_team: game.home_team,
                home_bg_color: game.away_bg_color,
                away_bg_color: game.home_bg_color,
                home_team_logo_url: game.away_team_logo_url,
                away_team_logo_url: game.home_team_logo_url,
            }
            const result = await gameInfoService.updateGameInfo(swapped)
            if (result.success) {
                loadGames()
            } else {
                alert('팀 전환에 실패했습니다: ' + result.error)
            }
        } catch (err) {
            console.error('Failed to swap teams:', err)
            alert('팀 전환에 실패했습니다.')
        }
    }

    const handleThemeChange = (game: GameInfoWithScore) => {
        setSelectedGame(game)
        setThemeColors({
            home_bg_color: game.home_bg_color || '#374151',
            away_bg_color: game.away_bg_color || '#f7f7f7'
        })
        setFontSizes({
            title_font_size: game.title_font_size || 30,
            team_name_font_size: game.team_name_font_size || 30
        })
        setLogoUrls({
            home_team_logo_url: game.home_team_logo_url || '',
            away_team_logo_url: game.away_team_logo_url || ''
        })
        setShowThemeModal(true)
    }

    const handleSaveTheme = async () => {
        if (!selectedGame) return
        
        try {
            const updatedGame = {
                ...selectedGame,
                home_bg_color: themeColors.home_bg_color,
                away_bg_color: themeColors.away_bg_color,
                title_font_size: fontSizes.title_font_size,
                team_name_font_size: fontSizes.team_name_font_size,
                home_team_logo_url: logoUrls.home_team_logo_url,
                away_team_logo_url: logoUrls.away_team_logo_url
            }
            
            const result = await gameInfoService.updateGameInfo(updatedGame)
            if (result.success) {
                // teams 테이블에 upsert (non-blocking)
                Promise.all([
                    teamsService.upsertTeam({
                        name: selectedGame.home_team,
                        logo_url: logoUrls.home_team_logo_url || undefined,
                        bg_color: themeColors.home_bg_color
                    }),
                    teamsService.upsertTeam({
                        name: selectedGame.away_team,
                        logo_url: logoUrls.away_team_logo_url || undefined,
                        bg_color: themeColors.away_bg_color
                    })
                ]).catch(err => console.error('Failed to upsert teams:', err))

                alert('설정이 성공적으로 변경되었습니다.')
                setShowThemeModal(false)
                loadGames() // 목록 새로고침
            } else {
                alert('설정 변경에 실패했습니다: ' + result.error)
            }
        } catch (err) {
            console.error('Failed to update settings:', err)
            alert('설정 변경에 실패했습니다.')
        }
    }

    const theme = {
        name: '프리미엄 다크',
        background: 'bg-gradient-to-br from-gray-900 to-gray-800',
        card: 'bg-gray-800',
        cardInner: 'bg-gray-700',
        scoreBox: 'bg-gray-900/70',
        cardHover: 'hover:shadow-2xl',
        buttonPrimary: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        buttonSecondary: 'bg-gray-600 hover:bg-gray-500',
        buttonTheme: 'bg-indigo-600 hover:bg-indigo-700',
        accent: 'text-yellow-400',
        border: 'border-gray-700',
        statusLive: 'bg-red-500',
        statusWait: 'bg-gray-500'
    }

    if (isLoading) {
        return (
            <div className={`min-h-screen ${theme.background} flex items-center justify-center`}>
                <div className="text-white text-xl">로딩 중...</div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${theme.background} p-6 transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="flex flex-col gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">경기 목록</h1>
                        <p className="text-gray-400">경기 관리 및 스코어보드 제어</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <button
                            onClick={() => navigate(Appconfig.dashboard_url)}
                            className="w-30 h-10 bg-yellow-600 hover:bg-yellow-500 text-sm text-white rounded-lg transition-all duration-200 shadow-lg font-bold"
                        >
                            📊 대시보드
                        </button>
                        <button
                            onClick={() => navigate(Appconfig.player_management_url)}
                            className="w-30 h-10 bg-indigo-600 hover:bg-indigo-700 text-sm text-white rounded-lg transition-all duration-200 shadow-lg font-bold"
                        >
                            👤 선수 관리
                        </button>
                        <button
                            onClick={handleCreateGame}
                            className={`w-30 h-10 bg-gradient-to-r ${theme.buttonPrimary} text-sm text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-bold`}
                        >
                            + New Game
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-xl mb-6 shadow-lg">
                        {error}
                    </div>
                )}

                {/* 고정 URL 안내 */}
                {userCode && (
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-yellow-400 font-bold text-sm">내 스코어보드 고정 URL</span>
                            <span className="text-gray-400 text-xs">— Live 상태로 설정한 게임이 자동으로 표시됩니다</span>
                            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded font-mono">{userCode}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: 'Type A', path: `/oa/${userCode}` },
                                { label: 'Type B', path: `/ob/${userCode}` },
                                { label: 'Controller', path: `/c/${userCode}` }
                            ].map(({ label, path }) => {
                                const fullUrl = `${window.location.origin}${path}`
                                return (
                                    <div key={path} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                                        <span className="text-gray-400 text-xs">{label}</span>
                                        <span className="text-green-400 text-xs font-mono">{fullUrl}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(fullUrl).then(() => alert(`${label} URL 복사됨!`))}
                                            className="text-gray-400 hover:text-white text-xs transition-colors"
                                            title="복사"
                                        >
                                            📋
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* 경기 목록 */}
                <div className="mb-6">
                    {games.length === 0 ? (
                        <div className={`${theme.card} rounded-2xl p-12 text-center shadow-lg border ${theme.border}`}>
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
                                    theme={theme}
                                    onOverlayView={handleOverlayView}
                                    onOpenController={handleOpenController}
                                    onEdit={handleEditGame}
                                    onDelete={handleDeleteGame}
                                    onCopyUrl={handleCopyUrl}
                                    onThemeChange={handleThemeChange}
                                    onSwapTeams={handleSwapTeams}
                                    onSetLive={handleSetLive}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 테마 변경 모달 */}
            {showThemeModal && selectedGame && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 my-8">
                        <h3 className="text-xl font-bold text-white mb-4">스코어보드 설정 - {selectedGame.title}</h3>
                        
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            {/* 로고 설정 섹션 */}
                            <div className="border-b border-gray-700 pb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-white">🏫 팀 로고</h4>
                                    <a 
                                        href="http://www.korea-baseball.com/info/team/team_list" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                                    >
                                        📋 팀 로고 참조 사이트
                                    </a>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    팀 로고 이미지 URL을 입력하세요. 대한야구소프트볼협회 팀 정보에서 로고를 확인할 수 있습니다.
                                </p>
                                
                                {/* 홈팀 로고 */}
                                <div className="mb-4">
                                    <label className="block text-white text-sm font-medium mb-2">
                                        홈팀 ({selectedGame.home_team}) 로고 URL
                                    </label>
                                    <input
                                        type="url"
                                        value={logoUrls.home_team_logo_url}
                                        onChange={(e) => setLogoUrls(prev => ({
                                            ...prev,
                                            home_team_logo_url: e.target.value
                                        }))}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                                        placeholder="https://example.com/logo.png"
                                    />
                                    {logoUrls.home_team_logo_url && (
                                        <img 
                                            src={logoUrls.home_team_logo_url} 
                                            alt="홈팀 로고 미리보기"
                                            className="mt-2 h-12 object-contain bg-white rounded p-1"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>

                                {/* 원정팀 로고 */}
                                <div>
                                    <label className="block text-white text-sm font-medium mb-2">
                                        원정팀 ({selectedGame.away_team}) 로고 URL
                                    </label>
                                    <input
                                        type="url"
                                        value={logoUrls.away_team_logo_url}
                                        onChange={(e) => setLogoUrls(prev => ({
                                            ...prev,
                                            away_team_logo_url: e.target.value
                                        }))}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                                        placeholder="https://example.com/logo.png"
                                    />
                                    {logoUrls.away_team_logo_url && (
                                        <img 
                                            src={logoUrls.away_team_logo_url} 
                                            alt="원정팀 로고 미리보기"
                                            className="mt-2 h-12 object-contain bg-white rounded p-1"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 폰트 크기 설정 섹션 */}
                            <div className="border-b border-gray-700 pb-4">
                                <h4 className="text-lg font-semibold text-white mb-3">📏 폰트 크기</h4>
                                
                                {/* 타이틀 폰트 크기 */}
                                <div className="mb-4">
                                    <label className="block text-white text-sm font-medium mb-2">
                                        시합 타이틀 폰트 크기 (px)
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="range"
                                            min="16"
                                            max="50"
                                            value={fontSizes.title_font_size}
                                            onChange={(e) => setFontSizes(prev => ({
                                                ...prev,
                                                title_font_size: Number(e.target.value)
                                            }))}
                                            className="flex-1"
                                        />
                                        <input
                                            type="number"
                                            min="16"
                                            max="50"
                                            value={fontSizes.title_font_size}
                                            onChange={(e) => setFontSizes(prev => ({
                                                ...prev,
                                                title_font_size: Number(e.target.value)
                                            }))}
                                            className="w-20 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-center"
                                        />
                                    </div>
                                </div>

                                {/* 팀명 폰트 크기 */}
                                <div>
                                    <label className="block text-white text-sm font-medium mb-2">
                                        팀명 폰트 크기 (px)
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="range"
                                            min="20"
                                            max="60"
                                            value={fontSizes.team_name_font_size}
                                            onChange={(e) => setFontSizes(prev => ({
                                                ...prev,
                                                team_name_font_size: Number(e.target.value)
                                            }))}
                                            className="flex-1"
                                        />
                                        <input
                                            type="number"
                                            min="20"
                                            max="60"
                                            value={fontSizes.team_name_font_size}
                                            onChange={(e) => setFontSizes(prev => ({
                                                ...prev,
                                                team_name_font_size: Number(e.target.value)
                                            }))}
                                            className="w-20 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 배경색 설정 섹션 */}
                            <div className="pb-4">
                                <h4 className="text-lg font-semibold text-white mb-3">🎨 배경색</h4>
                                
                            {/* 홈팀 색상 */}
                            <div className="mb-4">
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
                                    <option value="#374151"></option>
                                        <option value="#1f2937"></option>
                                        <option value="#000000"></option>
                                        <option value="#cd3131"></option>
                                        <option value="#f97316"></option>
                                        <option value="#2a388f"></option>
                                        <option value="#00844a"></option>
                                        <option value="#f5ec00"></option>
                                        <option value="#e87e04"></option>
                                        <option value="#efb716"></option>
                                        <option value="#8b5cf6"></option>
                                        <option value="#ffffff"></option>
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
                            <div className="mb-4">
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
                                    <option value="#f7f7f7"></option>
                                        <option value="#374151"></option>
                                        <option value="#1f2937"></option>
                                        <option value="#000000"></option>
                                        <option value="#cd3131"></option>
                                        <option value="#f97316"></option>
                                        <option value="#2a388f"></option>
                                        <option value="#00844a"></option>
                                        <option value="#f5ec00"></option>
                                        <option value="#e87e04"></option>
                                        <option value="#efb716"></option>
                                        <option value="#8b5cf6"></option>
                                        <option value="#ffffff"></option>
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
                                
                                {/* 타이틀 미리보기 */}
                                <div 
                                    className="bg-gray-300 text-black font-bold text-center py-2 rounded mb-2"
                                    style={{ fontSize: `${fontSizes.title_font_size * 0.6}px` }}
                                >
                                    {selectedGame.title}
                                </div>
                                
                                {/* 팀 정보 미리보기 */}
                                <div className="flex items-center justify-between">
                                    <div 
                                        className="text-center flex-1 p-3 rounded flex flex-col items-center"
                                        style={{ backgroundColor: themeColors.away_bg_color }}
                                    >
                                        {logoUrls.away_team_logo_url && (
                                            <img 
                                                src={logoUrls.away_team_logo_url} 
                                                alt="원정팀 로고"
                                                className="h-8 mb-1 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <div 
                                            className={`font-semibold ${getContrastYIQ(themeColors.away_bg_color)}`}
                                            style={{ fontSize: `${fontSizes.team_name_font_size * 0.5}px` }}
                                        >
                                            {selectedGame.away_team}
                                        </div>
                                        <div className={`text-xs ${getContrastYIQ(themeColors.away_bg_color)}`}>원정팀</div>
                                    </div>
                                    <div className="text-white font-bold mx-2">VS</div>
                                    <div 
                                        className="text-center flex-1 p-3 rounded flex flex-col items-center"
                                        style={{ backgroundColor: themeColors.home_bg_color }}
                                    >
                                        {logoUrls.home_team_logo_url && (
                                            <img 
                                                src={logoUrls.home_team_logo_url} 
                                                alt="홈팀 로고"
                                                className="h-8 mb-1 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <div 
                                            className={`font-semibold ${getContrastYIQ(themeColors.home_bg_color)}`}
                                            style={{ fontSize: `${fontSizes.team_name_font_size * 0.5}px` }}
                                        >
                                            {selectedGame.home_team}
                                        </div>
                                        <div className={`text-xs ${getContrastYIQ(themeColors.home_bg_color)}`}>홈팀</div>
                                    </div>
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
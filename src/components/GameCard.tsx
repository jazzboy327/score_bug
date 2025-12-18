import { useState, useRef, useEffect } from 'react';
import { getisLive } from '../utils/dateUtils';
import type { GameInfoWithScore } from '../types/scoreboard';

// '...' 아이콘 (SVG)
const MoreVerticalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-white">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
    </svg>
);


// 드롭다운 메뉴 컴포넌트
const DropdownMenu = ({ game, onEdit, onDelete, onCopyUrl, closeMenu }: { game: GameInfoWithScore, onEdit: (gameId: number) => void, onDelete: (gameId: number) => void, onCopyUrl: (gameId: number, template: 'a' | 'b') => void, closeMenu: () => void }) => {
    const handleEdit = () => {
        onEdit(game.game_id);
        closeMenu();
    };

    const handleCopyUrlA = () => {
        onCopyUrl(game.game_id, 'a');
        closeMenu();
    };

    const handleCopyUrlB = () => {
        onCopyUrl(game.game_id, 'b');
        closeMenu();
    };

    const handleDelete = () => {
        onDelete(game.game_id);
        closeMenu();
    };

    return (
        <div className="absolute top-12 right-0 bg-gray-700 rounded-lg shadow-xl w-48 z-10 border border-gray-600">
            <ul className="text-sm text-gray-200">
                <li onClick={handleEdit} className="p-3 hover:bg-gray-600 rounded-t-lg cursor-pointer flex items-center">✏️ <span className="ml-2">경기 수정</span></li>
                <li onClick={handleCopyUrlA} className="p-3 hover:bg-gray-600 cursor-pointer flex items-center">🔗 <span className="ml-2">A(700x345)URL 복사</span></li>
                <li onClick={handleCopyUrlB} className="p-3 hover:bg-gray-600 cursor-pointer flex items-center">🔗 <span className="ml-2">B(1200x60)URL 복사</span></li>
                <li onClick={handleDelete} className="p-3 text-red-400 hover:bg-red-900/50 rounded-b-lg cursor-pointer flex items-center">🗑️ <span className="ml-2">삭제</span></li>
            </ul>
        </div>
    );
};

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

const getStatusBadge = (isLive: boolean, date_time: string) => {
    const _isLive = isLive 
    const live_check = getisLive(date_time)
    return live_check === "ing" && _isLive ? (
        <span className="px-3 py-1 ml-2 text-xs font-medium bg-red-500 text-white rounded-full">
            진행중
        </span>
    ) : live_check === "wait" ? (
        <span className="px-3 py-1 ml-2 text-xs font-medium bg-gray-500 text-white rounded-full">
            대기중
        </span>
    ) : !_isLive || live_check === "end" ? (
        <span className="px-3 py-1 ml-2 text-xs font-medium bg-gray-500 text-white rounded-full">
            종료
        </span>
    ) : (
        <span className="px-3 py-1 ml-2 text-xs font-medium bg-gray-500 text-white rounded-full">
            오류
        </span>
    )
}

interface ThemeType {
    name: string;
    background: string;
    card: string;
    cardInner: string;
    scoreBox: string;
    cardHover: string;
    buttonPrimary: string;
    buttonSecondary: string;
    buttonTheme: string;
    accent: string;
    border: string;
    statusLive: string;
    statusWait: string;
}

// 메인 카드 컴포넌트
export const GameCard = ({ game, theme, onOverlayView, onOpenController, onEdit, onDelete, onCopyUrl, onThemeChange }: { game: GameInfoWithScore, theme?: ThemeType, onOverlayView: (gameId: number, template: 'a' | 'b') => void, onOpenController: (gameId: number) => void, onEdit: (gameId: number) => void, onDelete: (gameId: number) => void, onCopyUrl: (gameId: number, template: 'a' | 'b') => void, onThemeChange: (game: GameInfoWithScore) => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // 메뉴 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !(menuRef.current as any).contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    const cardClass = theme?.card || 'bg-gray-800';
    const cardInnerClass = theme?.cardInner || 'bg-gray-900/60';
    const scoreBoxClass = theme?.scoreBox || 'bg-slate-900/80';
    const borderClass = theme?.border || 'border-gray-700';
    const hoverClass = theme?.cardHover || 'hover:shadow-2xl';
    const accentClass = theme?.accent || 'text-yellow-400';
    const buttonPrimaryClass = theme?.buttonPrimary || 'from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700';
    const buttonSecondaryClass = theme?.buttonSecondary || 'bg-slate-700 hover:bg-slate-600';
    const buttonThemeClass = theme?.buttonTheme || 'bg-gray-700 hover:bg-gray-600';

    return (
        <div className={`${cardClass} rounded-2xl p-6 shadow-lg ${hoverClass} transition-all duration-500 transform hover:-translate-y-2 border ${borderClass} flex flex-col`}>
            
            {/* 카드 헤더 */}
            <div className="flex justify-between items-start mb-4 relative">
                <div className="flex-1 min-w-0 pr-8">
                    <div className="text-sm font-bold text-white mb-1 truncate flex items-center">
                        {game.title}
                        {getStatusBadge(game.is_live, game.date_time)}
                    </div>
                </div>
                {/* 더보기 메뉴 버튼 */}
                <div ref={menuRef} className="absolute top-0 right-0">
                    <button 
                        onClick={() => {
                            setIsMenuOpen(!isMenuOpen);
                        }} 
                        className="p-1 rounded-full hover:bg-gray-700"
                    >
                        <MoreVerticalIcon />
                    </button>
                    {isMenuOpen && (
                         <DropdownMenu 
                            game={game} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onCopyUrl={onCopyUrl}
                            closeMenu={() => {
                                setIsMenuOpen(false);
                            }}
                         />
                    )}
                </div>
            </div>

            {/* 팀 정보 및 스코어 (flex-grow로 남는 공간 채우기) */}
            <div className="flex-grow">
                <div className={`${cardInnerClass} rounded-xl p-4 mb-4 border ${borderClass}`}>
                    <div className="flex items-center justify-between mb-3">
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
                    
                    {/* 경기 시간 표시 */}
                    <div className="text-center mb-3">
                        <div className="text-sm text-gray-300 font-medium">
                            {formatDateTime(game.date_time)}
                        </div>
                    </div>
                    
                    {/* 경기장 정보 */}
                    <div className="flex items-center justify-center text-gray-300 mb-3">
                        <span className="text-lg mr-2">🏟️</span>
                        <span className="font-medium">경기장: </span>
                        <span className="text-gray-400 ml-2">{game.field}</span>
                    </div>
                    
                     {/* 스코어 정보 - 기존과 동일. 위치만 조정 */}
                     {game.current_score ? (
                        <div className={`${scoreBoxClass} rounded-lg p-3 border ${borderClass}`}>
                            <div className="flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <div className="text-2xl font-bold text-white">{game.current_score.a_score}</div>
                                </div>
                                <div className="text-center w-1/3">
                                    <div className={`text-sm ${accentClass} font-semibold`}>{game.current_score.inning}{game.current_score.is_top ? '초' : '말'}</div>
                                </div>
                                <div className="text-center flex-1">
                                    <div className="text-2xl font-bold text-white">{game.current_score.h_score}</div>
                                </div>
                            </div>
                        </div>
                     ) : (
                        <div className="text-center py-3">
                            <span className="text-gray-400 text-sm">
                                경기 시작 전
                            </span>
                        </div>
                     )}
                </div>
            </div>

            {/* 주요 액션 버튼들 */}
            <div className="space-y-3">
                 <button
                    onClick={() => onOpenController(game.game_id)}
                    className={`w-full bg-gradient-to-r ${buttonPrimaryClass} text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 text-sm shadow-lg hover:shadow-xl`}
                >
                    🎮 스코어보드 컨트롤러
                </button>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onOverlayView(game.game_id, 'a')}
                        className={`flex-1 ${buttonSecondaryClass} text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm`}
                    >
                        📺 A타입 보기(700x345)
                    </button>
                    <button
                        onClick={() => onOverlayView(game.game_id, 'b')}
                        className={`flex-1 ${buttonSecondaryClass} text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm`}
                    >
                        📺 B타입 보기(1200x60)
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onThemeChange(game)}
                        className={`flex-1 ${buttonThemeClass} text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm`}
                    >
                        🎨 테마 변경
                    </button>

                </div>
            </div>
        </div>
    );
};
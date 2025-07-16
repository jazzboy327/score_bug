import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { ScoreRow } from "../types/scoreboard"
// import { SupabaseGameinfoService } from "../services/SupabaseGameinfoService"
import { SupabaseScoreService } from "../services/SupabaseScoreService"

// const gameInfoService = new SupabaseGameinfoService();
const scoreService = new SupabaseScoreService();
 

export default function ScoreControl() {
    const { gameId } = useParams<{ gameId: string }>()
    const [score, setScore] = useState<ScoreRow | null>(null)
    // const [ setGameInfo] = useState<GameInfoRow | null>(null)

    // 이닝 조작
    const handleInningChange = async (increment: boolean) => {
        if (!score) return;
        const updatedScore = { ...score };
        
        if (increment) {
            // 현재 초(상)이면 말(하)로 변경
            if (score.is_top) {
                updatedScore.is_top = false;
            } else {
                // 현재 말(하)이면 다음 이닝 초(상)로 변경
                if (score.inning < 9) {
                    updatedScore.inning = score.inning + 1;
                    updatedScore.is_top = true;
                }
            }
        } else {
            // 현재 말(하)이면 초(상)로 변경
            if (!score.is_top) {
                updatedScore.is_top = true;
            } else {
                // 현재 초(상)이면 이전 이닝 말(하)로 변경
                if (score.inning > 1) {
                    updatedScore.inning = score.inning - 1;
                    updatedScore.is_top = false;
                }
            }
        }
        
        // 이닝이 변경되거나 초/말이 바뀔 때 카운트와 베이스 초기화
        if (updatedScore.inning !== score.inning || updatedScore.is_top !== score.is_top) {
            updatedScore.b_count = 0;
            updatedScore.s_count = 0;
            updatedScore.o_count = 0;
            updatedScore.is_first = false;
            updatedScore.is_second = false;
            updatedScore.is_third = false;
        }
        
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update inning:', error);
            console.log(updatedScore);
        }
    };

    // 점수 조작
    const handleScoreChange = async (team: 'a_score' | 'h_score', increment: boolean) => {
        if (!score) return;
        const updatedScore = { ...score };
        if (team === 'a_score') {
            updatedScore.a_score = increment ? score.a_score + 1 : Math.max(0, score.a_score - 1);
        } else {
            updatedScore.h_score = increment ? score.h_score + 1 : Math.max(0, score.h_score - 1);
        }
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update score:', error);
        }
    };

    // 베이스 토글
    const handleBaseToggle = async (base: 'first' | 'second' | 'third') => {
        if (!score) return;
        const updatedScore = { ...score };
        switch (base) {
            case 'first':
                updatedScore.is_first = !score.is_first;
                break;
            case 'second':
                updatedScore.is_second = !score.is_second;
                break;
            case 'third':
                updatedScore.is_third = !score.is_third;
                break;
        }
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update base:', error);
        }
    };

    // 볼/스트라이크/아웃 카운트 조작
    const handleCountChange = async (type: 'ball' | 'strike' | 'out') => {
        if (!score) return;
        const updatedScore = { ...score };
        
        switch (type) {
            case 'ball':
                updatedScore.b_count = (score.b_count + 1) % 4;
                break;
            case 'strike':
                updatedScore.s_count = (score.s_count + 1) % 3;
                break;
            case 'out':
                updatedScore.o_count = (score.o_count + 1) % 3;
                break;
        }
        
        try {
            await scoreService.updateLiveScore(updatedScore);
            setScore(updatedScore);
        } catch (error) {
            console.error('Failed to update count:', error);
        }
    };

    useEffect(() => {
        const fetchScore = async () => {
            const data = await scoreService.getScore(Number(gameId));
            if (data) {
                setScore(data);
            }
        }
        // const fetchGameInfo = async () => {
        //     const data = await gameInfoService.getGameInfo(Number(gameId));
        //     if (data) {
        //         setGameInfo(data);
        //     }
        // }

        const unsubscribeScore = scoreService.subscribeToScoreUpdates((newScore) => {
            if (newScore.game_id === Number(gameId)) {
                setScore(newScore);
            }
        });

        // const unsubscribeGameInfo = gameInfoService.subscribeToGameInfoUpdates((newGameInfo) => {
        //     if (newGameInfo.game_id === Number(gameId)) {
        //         setGameInfo(newGameInfo);
        //     }
        // });

        fetchScore();
        // fetchGameInfo();

        return () => {
            unsubscribeScore();
            // unsubscribeGameInfo();
        }
    }, [gameId]);

    const inning = score?.inning ?? 1
    const h_score = score?.h_score ?? 0
    const a_score = score?.a_score ?? 0
    const isTop = score?.is_top ?? true
    const bCount = score?.b_count ?? 0
    const sCount = score?.s_count ?? 0
    const oCount = score?.o_count ?? 0
    const isFirst = score?.is_first ?? false
    const isSecond = score?.is_second ?? false
    const isThird = score?.is_third ?? false
    
    return (
        <div className="bg-[#222] w-screen h-screen flex flex-col items-top  ">
          {/* 현황판 */}
          <div className="flex flex-row items-start justify-center mb-1 mt-3">
            {/* 이닝 */}
            <div className="flex flex-col items-center justify-center mr-10">
              <div className="text-white text-xl font-semibold mb-3">스코어</div>
              <div className="flex flex-row">
                <div className="text-white text-3xl font-semibold mb-2">{a_score} : {h_score}</div>
              </div>
              <div className="flex flex-row">
                <div className="text-white text-3xl font-semibold mb-2">{inning}{isTop ? ' ▲' : ' ▼'}</div>

              </div>
            </div>
            {/* 볼카운트 */}
            <div className="flex flex-col items-start justify-center mr-6">
              <div className="text-white text-xl font-semibold ml-1 mb-3">볼카운트</div>
              {/* B */}
              <div className="flex flex-row items-center ml-1 mb-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#00c853] text-[#00c853] flex items-center justify-center text-lg font-semibold mr-2">B</div>
                <div className="flex flex-row">
                  <div className={`w-4 h-4 rounded-full ${bCount > 0 ? 'bg-[#00c853]' : 'bg-[#888]'} mr-2`} />
                  <div className={`w-4 h-4 rounded-full ${bCount > 1 ? 'bg-[#00c853]' : 'bg-[#888]'} mr-2`} />
                  <div className={`w-4 h-4 rounded-full ${bCount > 2 ? 'bg-[#00c853]' : 'bg-[#888]'}`} />
                </div>
              </div>
              {/* S */}
              <div className="flex flex-row items-center ml-1 mb-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#ffd600] text-[#ffd600] flex items-center justify-center text-lg font-semibold mr-2">S</div>
                <div className="flex flex-row">
                  <div className={`w-4 h-4 rounded-full ${sCount > 0 ? 'bg-[#ffd600]' : 'bg-[#888]'} mr-2`} />
                  <div className={`w-4 h-4 rounded-full ${sCount > 1 ? 'bg-[#ffd600]' : 'bg-[#888]'}`} />
                </div>
              </div>
              {/* O */}
              <div className="flex flex-row items-center ml-1">
                <div className="w-6 h-6 rounded-full border-2 border-[#ff1744] text-[#ff1744] flex items-center justify-center text-lg font-semibold mr-2">O</div>
                <div className="flex flex-row">
                  <div className={`w-4 h-4 rounded-full ${oCount > 0 ? 'bg-[#ff1744]' : 'bg-[#888]'} mr-2`} />
                  <div className={`w-4 h-4 rounded-full ${oCount > 1 ? 'bg-[#ff1744]' : 'bg-[#888]'}`} />
                </div>
              </div>
            </div>
            {/* 베이스 */}
            <div className="flex flex-col items-center">
              <div className="text-white text-xl font-semibold">출루</div>
              <div className="relative w-32 h-32 mt-3">
                {/* 2루 */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 ${isSecond  ? 'bg-[#ffd600]' : 'bg-[#888]'} -rotate-45`} />
                {/* 1루 */}
                <div className={`absolute bottom-1/2 right-5 w-7 h-7 ${isFirst ? 'bg-[#ffd600]' : 'bg-[#888]'} -rotate-45`} />
                {/* 3루 */}
                <div className={`absolute bottom-1/2 left-5 w-7 h-7 ${isThird ? 'bg-[#ffd600]' : 'bg-[#888]'} -rotate-45`} />
              </div>
            </div>
          </div>
          {/* 구분선 */}
          <div className="w-full border-3 border-gray-600 my-2"></div>

          {/* 컨트롤 패널: 이닝수정, 점수수정, 베이스수정 */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6 px-4">
              {/* 이닝 */}
              <div className="flex flex-col items-center justify-center w-full">
                  <div className="text-white text-lg font-semibold mb-2">이닝</div>
                  <div className="flex flex-row justify-center w-full">
                      <button 
                          onClick={() => handleInningChange(true)}
                          className="w-[35%] h-12 bg-[#444] text-white text-2xl rounded-lg mx-2"
                      >
                          +
                      </button>
                      <button 
                          onClick={() => handleInningChange(false)}
                          className="w-[35%] h-12 bg-[#444] text-white text-2xl rounded-lg mx-2"
                      >
                          -
                      </button>
                  </div>
              </div>

              {/* 점수 컨트롤 */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
                  {/* A팀 점수 */}
                  <div className="flex flex-col items-center justify-center w-full">
                      <div className="text-white text-lg font-medium mb-2">A팀(선공) 점수</div>
                      <div className="flex flex-row  items-center justify-center w-full">
                          <button 
                              onClick={() => handleScoreChange('a_score', true)}
                              className="w-[35%] h-12 bg-[#444] text-white text-2xl rounded-lg mx-2"
                          >
                              +
                          </button>
                          <button 
                              onClick={() => handleScoreChange('a_score', false)}
                              className="w-[35%] h-12 bg-[#444] text-white text-2xl rounded-lg mx-2"
                          >
                              -
                          </button>
                      </div>
                  </div>
                </div>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
                  {/* B팀 점수 */}
                  <div className="flex flex-col items-center justify-center w-full">
                      <div className="text-white text-lg font-medium mb-2">B팀(후공) 점수</div>
                      <div className="flex flex-row justify-center w-full">
                          <button 
                              onClick={() => handleScoreChange('h_score', true)}
                              className="w-[35%] h-12 bg-[#444] text-white text-2xl rounded-lg mx-2"
                          >
                              +
                          </button>
                          <button 
                              onClick={() => handleScoreChange('h_score', false)}
                              className="w-[35%] h-12 bg-[#444] text-white text-2xl rounded-lg mx-2"
                          >
                              -
                          </button>
                      </div>
                  </div>
              </div>
          </div>
            {/* 출루 베이스 수정 */}
            <div className="flex flex-col items-center justify-center w-full mb-4">
                <div className="text-white text-lg font-medium mr-4">출루</div>
                    <div className="flex flex-row justify-center gap-4 px-4 w-full">
                        <button 
                            onClick={() => handleBaseToggle('first')}
                            className={`w-[30%] md:w-[150px] h-12 rounded-lg text-white text-base md:text-lg font-medium ${isFirst ? 'bg-[#ffd600] text-black' : 'bg-[#444]'}`}
                        >1루</button>
                        <button 
                            onClick={() => handleBaseToggle('second')}
                            className={`w-[30%] md:w-[150px] h-12 rounded-lg text-white text-base md:text-lg font-medium ${isSecond ? 'bg-[#ffd600] text-black' : 'bg-[#444]'}`}
                        >2루</button>
                        <button 
                            onClick={() => handleBaseToggle('third')}
                            className={`w-[30%] md:w-[150px] h-12 rounded-lg text-white text-base md:text-lg font-medium ${isThird ? 'bg-[#ffd600] text-black' : 'bg-[#444]'}`}
                        >3루</button>
                </div>
            </div>
          {/* 버튼 3개 */}
          <div className="flex flex-row items-center justify-center gap-4 px-4">
              <button 
                  onClick={() => handleCountChange('ball')}
                  className="w-[30%] md:w-[200px] h-12 bg-[#00c853] text-white text-xl md:text-2xl font-semibold rounded-lg"
              >
                  볼
              </button>
              <button 
                  onClick={() => handleCountChange('strike')}
                  className="w-[30%] md:w-[200px] h-12 bg-[#ffd600] text-white text-xl md:text-2xl font-semibold rounded-lg"
              >
                  스트라이크
              </button>
              <button 
                  onClick={() => handleCountChange('out')}
                  className="w-[30%] md:w-[200px] h-12 bg-[#ff1744] text-white text-xl md:text-2xl font-semibold rounded-lg"
              >
                  아웃
              </button>
          </div>
        </div>
      )
}
  




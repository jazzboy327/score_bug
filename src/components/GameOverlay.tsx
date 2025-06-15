import React from 'react'

export default function GameOverlay() {
  return (
    <div className="bg-gray-100 w-[450px] p-2 font-sans text-sm rounded shadow-md">
      {/* 시합 타이틀틀 */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-1 mb-1">
        <span className="text-gray-800 font-semibold">baseball game title</span>
      </div>

      {/* 중간: 점수판 + 베이스 상황 */}
      <div className="flex items-center space-x-2">
        {/* 팀명 + 점수판 */}
        <div className="flex-grow bg-white rounded overflow-hidden border border-gray-300">
          <div className="flex justify-between px-2 py-1 bg-gray-700 text-white">
            <span>AWAY</span>
            <span className="font-bold">4</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-blue-600 text-white">
            <span>HOME</span>
            <span className="font-bold">4</span>
          </div>
        </div>
        {/* 베이스 상황 + 이닝 */}
        <div className="relative w-20 h-10 flex flex-col items-center justify-center">
          {/* 다이아몬드 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10">
            {/* 2루 */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-5 h-5 rotate-45 bg-red-500" />
            {/* 1루 */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-red-500" />
            {/* 3루 */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-red-500" />
          </div>
          {/* 이닝 표시 */}
          <div className="relative z-10 flex flex-col items-center mt-1">
            <div className="text-red-600 font-bold text-xl leading-none">5</div>
            <div className="text-red-600 text-xs">▼</div>
          </div>
        </div>
      </div>

      {/* 카운트 B/S/O */}
      <div className="flex justify-around mt-2 px-2 text-xs font-semibold text-gray-800">
        <div className="flex items-center space-x-1">
          <span>B</span>
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-300" />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span>S</span>
          <div className="flex space-x-1">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-300" />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span>O</span>
          <div className="flex space-x-1">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-300" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

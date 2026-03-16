
export function getisLive(date: string): string {
    const now = new Date()
    const gameDate = new Date(date)

    // 시간 제외하고 날짜(년월일)만 비교
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const game  = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate())

    if(game < today){
        return "end"   // 지난 날짜
    }else if(game.getTime() === today.getTime()){
        return "wait"  // 당일
    }else{
        return "ing"   // 미래 날짜
    }
}

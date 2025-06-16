
export function getisLive(date: string): string {
    const now = new Date()
    const gameDate = new Date(date)
    if(gameDate > now){
        return "wait"
    }else if(gameDate < now){
        return "end"
    }else{
        return "ing"
    }
}

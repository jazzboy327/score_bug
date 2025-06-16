import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Scoreboard from "./components/Scoreboard"
import AdminPanel from "./components/AdminPanel"
import ScoreControl from "./components/ScoreControl"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/overlay/:gameId" element={<Scoreboard />} />
        <Route path="/admin/:gameId" element={<AdminPanel />} />
        <Route path="/control/:gameId" element={<ScoreControl />} />
        <Route path="/overlay2/:gameId" element={<Scoreboard />} />
      </Routes>
    </BrowserRouter>
  )
  
}


export default App

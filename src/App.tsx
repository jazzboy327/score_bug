import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Scoreboard from "./components/Scoreboard"
import AdminPanel from "./components/AdminPanel"
import ScoreControl from "./components/ScoreControl"
import GameForm from "./components/GameForm"
import Login from "./components/Login"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/a" element={<AdminPanel />} />
        <Route path="/r" element={<GameForm mode="create" />} />
        <Route path="/e/:gameId" element={<GameForm mode="edit" />} />
        <Route path="/o/:gameId" element={<Scoreboard />} />
        <Route path="/o/:gameId/:template" element={<Scoreboard />} />
        <Route path="/c/:gameId" element={<ScoreControl />} />
      </Routes>
    </BrowserRouter>
  )
  
}


export default App

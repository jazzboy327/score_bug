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
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/register" element={<GameForm mode="create" />} />
        <Route path="/edit/:gameId" element={<GameForm mode="edit" />} />
        <Route path="/overlay/:gameId" element={<Scoreboard />} />
        <Route path="/control/:gameId" element={<ScoreControl />} />
        <Route path="/overlay2/:gameId" element={<Scoreboard />} />
      </Routes>
    </BrowserRouter>
  )
  
}


export default App

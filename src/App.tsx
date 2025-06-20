import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Scoreboard from "./components/Scoreboard"
import AdminPanel from "./components/AdminPanel"
import ScoreControl from "./components/ScoreControl"
import GameForm from "./components/GameForm"
import Login from "./components/Login"
import { Appconfig } from "./config"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={Appconfig.login_url} element={<Login />} />
        <Route path={Appconfig.admin_panel_url} element={<AdminPanel />} />
        <Route path={Appconfig.register_url} element={<GameForm mode="create" />} />
        <Route path={Appconfig.edit_url} element={<GameForm mode="edit" />} />
        <Route path={Appconfig.scoreboard_url} element={<Scoreboard />} />
        <Route path={Appconfig.scoreboard_template_url} element={<Scoreboard />} />
        <Route path={Appconfig.controller_url} element={<ScoreControl />} />
      </Routes>
    </BrowserRouter>
  )
  
}


export default App

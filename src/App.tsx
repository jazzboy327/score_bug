import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import AdminPanel from "./components/AdminPanel"
import ScoreControl from "./components/ScoreControl"
import GameForm from "./components/GameForm"
import Login from "./components/Login"
import { Appconfig } from "./config"
import ScoreboardAV1 from "./components/ScoreboardA_v1"
import ScoreboardBV1 from "./components/ScoreboardB_v1"

import ScoreboardA from "./components/ScoreboardA"
import ScoreboardB from "./components/ScoreboardB"
import PlayerManagement from "./components/PlayerManagement"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={Appconfig.login_url} element={<Login />} />
        <Route path={Appconfig.admin_panel_url} element={<AdminPanel />} />
        <Route path={Appconfig.register_url} element={<GameForm mode="create" />} />
        <Route path={Appconfig.edit_url} element={<GameForm mode="edit" />} />
        <Route path={Appconfig.controller_url} element={<ScoreControl />} />
        <Route path={Appconfig.scoreboardA_v1_template_url} element={<ScoreboardAV1 />} />
        <Route path={Appconfig.scoreboardB_v1_template_url} element={<ScoreboardBV1 />} />
        <Route path={Appconfig.scoreboardA_template_url} element={<ScoreboardA />} />
        <Route path={Appconfig.scoreboardB_template_url} element={<ScoreboardB />} />
        <Route path={Appconfig.player_management_url} element={<PlayerManagement />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

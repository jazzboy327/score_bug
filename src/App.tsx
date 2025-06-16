import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import AdminPanel from "./components/AdminPanel"
import ScoreControl from "./components/ScoreControl"
import GameForm from "./components/GameForm"
import Login from "./components/Login"
import { Appconfig } from "./config"
import ScoreboardA from "./components/ScoreboardA"
import ScoreboardB from "./components/ScoreboardB"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={Appconfig.login_url} element={<Login />} />
        <Route path={Appconfig.admin_panel_url} element={<AdminPanel />} />
        <Route path={Appconfig.register_url} element={<GameForm mode="create" />} />
        <Route path={Appconfig.edit_url} element={<GameForm mode="edit" />} />
        <Route path={Appconfig.controller_url} element={<ScoreControl />} />
        <Route path={Appconfig.scoreboardA_template_url} element={<ScoreboardA />} />
        <Route path={Appconfig.scoreboardB_template_url} element={<ScoreboardB />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

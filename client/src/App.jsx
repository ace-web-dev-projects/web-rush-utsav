import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import SetTeamName from './pages/SetTeamName.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminHome from './pages/AdminHome.jsx'
import AdminControl from './pages/AdminControl.jsx'
import AdminTeams from './pages/AdminTeams.jsx'
import AdminTeamManagement from './pages/AdminTeamManagement.jsx'
import AdminRound3Submissions from './pages/AdminRound3Submissions.jsx'
import Leaderboard from './pages/Leaderboard.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/team-name" element={<SetTeamName />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminHome />}>
          <Route index element={<AdminControl />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="manage-teams" element={<AdminTeamManagement />} />
          <Route path="round3-submissions" element={<AdminRound3Submissions />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

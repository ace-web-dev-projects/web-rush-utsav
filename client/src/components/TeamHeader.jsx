import { NavLink, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'
import { AUTH_TOKEN_KEY } from '../api.js'

function TeamHeader() {
  const navigate = useNavigate()

  function handleSignOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    navigate('/login', { replace: true })
  }

  return (
    <header className="home-header">
      <BrandMark compact />
      <nav className="team-nav" aria-label="Team pages">
        <NavLink to="/" end className={({ isActive }) => `team-nav__link${isActive ? ' is-active' : ''}`}>
          Event
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `team-nav__link${isActive ? ' is-active' : ''}`}>
          Leaderboard
        </NavLink>
      </nav>
      <button className="home-header__signout" type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </header>
  )
}

export default TeamHeader

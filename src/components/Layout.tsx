import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Discover' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/watchlog', label: 'Diary' },
];

export default function Layout() {
  const [search, setSearch] = useState('');
  const { auth, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    navigate(`/?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <NavLink to="/" className="brand-mark">
            CineLog
          </NavLink>
          <span className="brand-tag">Track the films that stay with you.</span>
        </div>

        <nav className="main-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form className="searchbar" onSubmit={onSearchSubmit}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search movies, cast, directors..."
          />
          <button type="submit">Search</button>
        </form>

        <div className="auth-actions">
          {isAuthenticated ? (
            <>
              {auth?.role === 'ADMIN' && (
                <NavLink className="admin-nav-badge" to="/admin">
                  ⚙ Admin
                </NavLink>
              )}
              <NavLink className="ghost-button" to={`/profile/${auth?.username}`}>
                {auth?.username}
              </NavLink>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  logout();
                  if (location.pathname !== '/') navigate('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink className="ghost-button" to="/login">
                Log in
              </NavLink>
              <NavLink className="solid-button" to="/register">
                Join CineLog
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className="page-frame">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorBanner, SuccessBanner } from '../components/Feedback';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { UserProfile, UserStats } from '../types/models';

export default function ProfilePage() {
  const { username } = useParams();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!username) return;
      setLoading(true);
      try {
        const [profileResponse, statsResponse] = await Promise.all([
          api.getProfile(username),
          api.getProfileStats(username),
        ]);
        if (!cancelled) {
          setProfile(profileResponse);
          setStats(statsResponse);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  async function onDeleteAccount() {
    const confirmed = window.confirm('This permanently deletes your account and all associated data.');
    if (!confirmed) return;

    try {
      const response = await api.deleteAccount();
      setSuccess(response.message);
      logout();
      window.setTimeout(() => navigate('/'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
    }
  }

  if (loading) return <div className="empty-state">Loading profile...</div>;
  if (error && !profile) return <ErrorBanner message={error} />;
  if (!profile) return <EmptyState title="Profile missing" description="The requested user could not be found." />;

  const yearlyStats = Object.entries(stats?.moviesWatchedPerYear ?? {}).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <section className="stack-xl">
      <section className="profile-hero">
        <div className="avatar-orb">
          {profile.profilePictureUrl ? (
            <img src={profile.profilePictureUrl} alt={profile.username} />
          ) : (
            <span>{profile.username.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div>
          <span className="eyebrow">Public profile</span>
          <h1>{profile.username}</h1>
          <p>{profile.bio || 'No bio yet. Their taste is doing the talking.'}</p>
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <div className="stats-grid">
        <StatCard label="Movies watched" value={profile.totalMoviesWatched} />
        <StatCard label="Most watched genre" value={stats?.mostWatchedGenre} />
        <StatCard label="Most watched director" value={stats?.mostWatchedDirector} />
      </div>

      <section className="glass-panel stack-lg">
        <div className="section-header">
          <div>
            <span className="eyebrow">Viewing arc</span>
            <h2>Movies watched per year</h2>
          </div>
        </div>

        {yearlyStats.length ? (
          <div className="bar-chart">
            {yearlyStats.map(([year, count]) => (
              <div key={year} className="bar-row">
                <span>{year}</span>
                <div>
                  <strong style={{ width: `${Math.max(16, count * 18)}px` }}>{count}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No yearly stats yet" description="Once diary entries exist, yearly stats will show up here." />
        )}
      </section>

      {auth?.username === profile.username ? (
        <section className="glass-panel danger-panel">
          <h2>Danger zone</h2>
          <p>Deleting your account removes ratings, reviews, watchlist items, and watch history permanently.</p>
          <button className="danger-button" type="button" onClick={onDeleteAccount}>
            Delete my account
          </button>
        </section>
      ) : null}
    </section>
  );
}

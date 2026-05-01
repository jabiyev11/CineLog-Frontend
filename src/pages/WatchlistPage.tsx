import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorBanner } from '../components/Feedback';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import type { WatchlistItem } from '../types/models';

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await api.getWatchlist();
        if (!cancelled) setItems(response);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load watchlist.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(movieId: number) {
    setError('');
    try {
      await api.removeFromWatchlist(movieId);
      setItems((current) => current.filter((item) => item.movieId !== movieId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove movie.');
    }
  }

  if (loading) return <div className="empty-state">Loading watchlist...</div>;

  return (
    <section className="stack-xl">
      <div className="section-header">
        <div>
          <span className="eyebrow">Saved for later</span>
          <h1>Your watchlist</h1>
        </div>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {items.length ? (
        <div className="list-grid">
          {items.map((item) => (
            <article key={item.id} className="list-card">
              <Link to={`/movies/${item.movieId}`}>
                <img src={item.posterImageUrl} alt={item.title} />
              </Link>
              <div className="stack-md">
                <Link to={`/movies/${item.movieId}`}>
                  <strong>{item.title}</strong>
                </Link>
                <span>{item.releaseYear}</span>
                <small>Added {formatDate(item.addedAt)}</small>
                <button className="ghost-button small" type="button" onClick={() => handleRemove(item.movieId)}>
                  Remove from watchlist
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing in watchlist" description="Save movies from the detail page and they’ll show up here." />
      )}
    </section>
  );
}

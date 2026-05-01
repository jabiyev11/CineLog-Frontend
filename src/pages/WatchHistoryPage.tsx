import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorBanner } from '../components/Feedback';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import type { WatchLogItem } from '../types/models';

export default function WatchHistoryPage() {
  const [items, setItems] = useState<WatchLogItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await api.getWatchlog();
        if (!cancelled) setItems(response);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load diary.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="empty-state">Loading diary...</div>;

  return (
    <section className="stack-xl">
      <div className="section-header">
        <div>
          <span className="eyebrow">Your diary</span>
          <h1>Watched history</h1>
        </div>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {items.length ? (
        <div className="timeline">
          {items.map((item) => (
            <Link key={item.id} className="timeline-card" to={`/movies/${item.movieId}`}>
              <img src={item.posterImageUrl} alt={item.title} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.releaseYear}</span>
                <small>Watched {formatDate(item.watchedDate)}</small>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No diary entries yet" description="Log a watched date from any movie page to start your history." />
      )}
    </section>
  );
}

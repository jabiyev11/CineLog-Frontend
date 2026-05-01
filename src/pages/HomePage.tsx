import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { EmptyState, ErrorBanner } from '../components/Feedback';
import { api } from '../lib/api';
import type { MovieSummary, SearchResponse } from '../types/models';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q')?.trim() ?? '';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (query) {
          const response = await api.searchMovies(query);
          if (!cancelled) setSearch(response);
        } else {
          const response = await api.getMovies(0, 24);
          if (!cancelled) {
            setMovies(response.content);
            setSearch(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load movies.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="stack-xl">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Movie journal, watch diary, and review home</span>
          <h1>Make every movie night feel worth remembering.</h1>
          <p>
            CineLog helps you collect the films you love, rate what you watched, keep a living
            diary, and build a profile that feels like your personal cinema.
          </p>
          <div className="hero-actions">
            <button className="solid-button" onClick={() => setSearchParams({ q: 'Nolan' })}>
              Explore directors
            </button>
            <button className="ghost-button" onClick={() => setSearchParams({})}>
              Browse popular picks
            </button>
          </div>
        </div>
        <div className="hero-card-grid">
          {movies.slice(0, 4).map((movie) => (
            <article key={movie.id} className="hero-mini-card">
              <img src={movie.posterImageUrl} alt={movie.title} />
              <div>
                <strong>{movie.title}</strong>
                <span>{movie.releaseYear}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      <section className="section-header">
        <div>
          <span className="eyebrow">{query ? 'Search results' : 'Popular right now'}</span>
          <h2>{query ? `Results for “${query}”` : 'Curated from your backend catalog'}</h2>
        </div>
      </section>

      {loading ? (
        <div className="empty-state">Loading movies...</div>
      ) : query ? (
        search?.results.length ? (
          <div className="movie-grid">
            {search.results.map((movie) => (
              <MovieCard key={movie.id} movie={{ ...movie, averageRating: null }} />
            ))}
          </div>
        ) : (
          <EmptyState title="No matches" description={search?.message ?? 'Try another search term.'} />
        )
      ) : movies.length ? (
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <EmptyState title="No movies yet" description="Seed your backend and they’ll appear here." />
      )}
    </div>
  );
}

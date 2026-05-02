import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { EmptyState, ErrorBanner } from '../components/Feedback';
import { api } from '../lib/api';
import type { MovieSummary, PageResponse, SearchResponse } from '../types/models';

const MOVIES_PAGE_SIZE = 24;

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [moviePage, setMoviePage] = useState<PageResponse<MovieSummary> | null>(null);
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q')?.trim() ?? '';
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const backendPage = currentPage - 1;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (query) {
          const response = await api.searchMovies(query);
          const results = await Promise.all(
            response.results.map(async (movie) => {
              if (movie.averageRating !== undefined) return movie;
              try {
                const details = await api.getMovie(movie.id);
                return { ...movie, averageRating: details.averageRating };
              } catch {
                return movie;
              }
            }),
          );
          if (!cancelled) setSearch({ ...response, results });
        } else {
          const response = await api.getMovies(backendPage, MOVIES_PAGE_SIZE);
          if (!cancelled) {
            setMovies(response.content);
            setMoviePage(response);
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
  }, [backendPage, query]);

  useEffect(() => {
    if (query) return;
    if (!moviePage || moviePage.totalPages === 0) return;
    if (currentPage <= moviePage.totalPages) return;
    updateCatalogPage(moviePage.totalPages);
  }, [currentPage, moviePage, query]);

  function updateCatalogPage(page: number) {
    const nextParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(page));
    }
    setSearchParams(nextParams);
  }

  function renderPageNumbers() {
    if (!moviePage || moviePage.totalPages <= 1) return null;

    const totalPages = moviePage.totalPages;
    const pages = Array.from(
      { length: Math.min(5, totalPages) },
      (_, index) => Math.min(Math.max(currentPage - 2, 1), Math.max(totalPages - 4, 1)) + index,
    );

    return pages.map((page) => (
      <button
        key={page}
        className={`page-button${page === currentPage ? ' active' : ''}`}
        type="button"
        aria-current={page === currentPage ? 'page' : undefined}
        onClick={() => updateCatalogPage(page)}
      >
        {page}
      </button>
    ));
  }

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
              <MovieCard key={movie.id} movie={{ ...movie, averageRating: movie.averageRating ?? null }} />
            ))}
          </div>
        ) : (
          <EmptyState title="No matches" description={search?.message ?? 'Try another search term.'} />
        )
      ) : movies.length ? (
        <>
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {moviePage && moviePage.totalPages > 1 ? (
            <nav className="pagination-bar" aria-label="Movie catalog pages">
              <button
                className="ghost-button small"
                type="button"
                disabled={currentPage <= 1}
                onClick={() => updateCatalogPage(currentPage - 1)}
              >
                Previous
              </button>
              <div className="pagination-pages">{renderPageNumbers()}</div>
              <button
                className="ghost-button small"
                type="button"
                disabled={currentPage >= moviePage.totalPages}
                onClick={() => updateCatalogPage(currentPage + 1)}
              >
                Next
              </button>
              <span className="pagination-summary">
                Page {currentPage} of {moviePage.totalPages}
              </span>
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyState title="No movies yet" description="Seed your backend and they’ll appear here." />
      )}
    </div>
  );
}

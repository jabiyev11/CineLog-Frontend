import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { ErrorBanner, SuccessBanner } from '../components/Feedback';
import type { MovieDetail, MovieRequest, MovieSummary } from '../types/models';

type FormData = {
  title: string;
  releaseYear: string;
  directors: string;
  cast: string;
  genres: string;
  durationMinutes: string;
  country: string;
  language: string;
  synopsis: string;
  posterImageUrl: string;
  backdropImageUrl: string;
  imageUrls: string;
};

const EMPTY_FORM: FormData = {
  title: '',
  releaseYear: '',
  directors: '',
  cast: '',
  genres: '',
  durationMinutes: '',
  country: '',
  language: '',
  synopsis: '',
  posterImageUrl: '',
  backdropImageUrl: '',
  imageUrls: '',
};

function movieDetailToForm(m: MovieDetail): FormData {
  return {
    title: m.title,
    releaseYear: String(m.releaseYear),
    directors: m.directors.join(', '),
    cast: m.cast.join(', '),
    genres: m.genres.join(', '),
    durationMinutes: String(m.durationMinutes),
    country: m.country,
    language: m.language,
    synopsis: m.synopsis,
    posterImageUrl: m.posterImageUrl,
    backdropImageUrl: m.backdropImageUrl ?? '',
    imageUrls: m.imageUrls.join(', '),
  };
}

function formToRequest(f: FormData): MovieRequest {
  return {
    title: f.title.trim(),
    releaseYear: Number(f.releaseYear),
    directors: f.directors.split(',').map((s) => s.trim()).filter(Boolean),
    cast: f.cast.split(',').map((s) => s.trim()).filter(Boolean),
    genres: f.genres.split(',').map((s) => s.trim()).filter(Boolean),
    durationMinutes: Number(f.durationMinutes),
    country: f.country.trim(),
    language: f.language.trim(),
    synopsis: f.synopsis.trim(),
    posterImageUrl: f.posterImageUrl.trim(),
    backdropImageUrl: f.backdropImageUrl.trim() || null,
    imageUrls: f.imageUrls.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export default function AdminPage() {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const PAGE_SIZE = 15;

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMovies(page, PAGE_SIZE);
      setMovies(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  function openCreate() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  }

  async function openEdit(id: number) {
    setFormError(null);
    setFormSuccess(null);
    try {
      const movie = await api.getMovie(id);
      setEditingId(id);
      setFormData(movieDetailToForm(movie));
      setModalOpen(true);
    } catch {
      // silently ignore — movie list still visible
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
    setFormSuccess(null);
  }

  function updateField(key: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      const payload = formToRequest(formData);
      if (editingId !== null) {
        await api.adminUpdateMovie(editingId, payload);
        setFormSuccess('Movie updated successfully.');
      } else {
        await api.adminCreateMovie(payload);
        setFormSuccess('Movie created successfully.');
        setFormData(EMPTY_FORM);
      }
      fetchMovies();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.adminDeleteMovie(deleteTarget.id);
      setDeleteTarget(null);
      fetchMovies();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="stack-xl">
      <div className="section-header">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>Movie Library</h2>
          {!loading && (
            <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
              {totalElements} {totalElements === 1 ? 'movie' : 'movies'} total
            </p>
          )}
        </div>
        <button className="solid-button" onClick={openCreate}>
          + Add Movie
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p className="admin-loading">Loading movies...</p>
        ) : movies.length === 0 ? (
          <div className="admin-loading">
            <p style={{ color: 'var(--muted)' }}>No movies yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Movie</span>
              <span>Year</span>
              <span>Rating</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {movies.map((movie) => (
              <div key={movie.id} className="admin-row">
                <div className="admin-movie-info">
                  <img
                    src={movie.posterImageUrl}
                    alt={movie.title}
                    className="admin-poster"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <span className="admin-movie-title">{movie.title}</span>
                    <span className="admin-movie-id">ID #{movie.id}</span>
                  </div>
                </div>
                <span className="admin-cell">{movie.releaseYear}</span>
                <span className="admin-cell">
                  {movie.averageRating != null ? (
                    <span className="admin-rating">★ {movie.averageRating.toFixed(1)}</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </span>
                <div className="admin-actions">
                  <button
                    className="admin-edit-btn"
                    onClick={() => openEdit(movie.id)}
                    title="Edit movie"
                  >
                    Edit
                  </button>
                  <button
                    className="admin-delete-btn"
                    onClick={() => setDeleteTarget({ id: movie.id, title: movie.title })}
                    title="Delete movie"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="page-button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum =
                totalPages <= 7
                  ? i
                  : page < 4
                    ? i
                    : page > totalPages - 5
                      ? totalPages - 7 + i
                      : page - 3 + i;
              return (
                <button
                  key={pageNum}
                  className={`page-button${page === pageNum ? ' active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          <button
            className="page-button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
          <span className="pagination-summary">
            Page {page + 1} of {totalPages}
          </span>
        </div>
      )}

      {/* Movie Form Modal */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingId !== null ? 'Edit Movie' : 'Add Movie'}</h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            {formError && <ErrorBanner message={formError} />}
            {formSuccess && <SuccessBanner message={formSuccess} />}

            <form className="movie-form" onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <label>
                  Title
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Blade Runner"
                  />
                </label>
                <label>
                  Release Year
                  <input
                    required
                    type="number"
                    min="1888"
                    max="2100"
                    value={formData.releaseYear}
                    onChange={(e) => updateField('releaseYear', e.target.value)}
                    placeholder="e.g. 1982"
                  />
                </label>
              </div>

              <div className="form-grid-2">
                <label>
                  Duration (minutes)
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) => updateField('durationMinutes', e.target.value)}
                    placeholder="e.g. 117"
                  />
                </label>
                <label>
                  Country
                  <input
                    required
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="e.g. USA"
                  />
                </label>
              </div>

              <div className="form-grid-2">
                <label>
                  Language
                  <input
                    required
                    value={formData.language}
                    onChange={(e) => updateField('language', e.target.value)}
                    placeholder="e.g. English"
                  />
                </label>
                <label>
                  Genres
                  <span className="field-hint"> — comma-separated</span>
                  <input
                    required
                    value={formData.genres}
                    onChange={(e) => updateField('genres', e.target.value)}
                    placeholder="Sci-Fi, Drama, Thriller"
                  />
                </label>
              </div>

              <label>
                Directors
                <span className="field-hint"> — comma-separated</span>
                <input
                  required
                  value={formData.directors}
                  onChange={(e) => updateField('directors', e.target.value)}
                  placeholder="Ridley Scott"
                />
              </label>

              <label>
                Cast
                <span className="field-hint"> — comma-separated</span>
                <input
                  required
                  value={formData.cast}
                  onChange={(e) => updateField('cast', e.target.value)}
                  placeholder="Harrison Ford, Rutger Hauer, Sean Young"
                />
              </label>

              <label>
                Synopsis
                <textarea
                  required
                  value={formData.synopsis}
                  onChange={(e) => updateField('synopsis', e.target.value)}
                  placeholder="Brief plot summary..."
                />
              </label>

              <label>
                Poster Image URL
                <input
                  required
                  type="url"
                  value={formData.posterImageUrl}
                  onChange={(e) => updateField('posterImageUrl', e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label>
                Backdrop Image URL
                <span className="field-hint"> — optional</span>
                <input
                  type="url"
                  value={formData.backdropImageUrl}
                  onChange={(e) => updateField('backdropImageUrl', e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label>
                Additional Image URLs
                <span className="field-hint"> — comma-separated, optional</span>
                <input
                  value={formData.imageUrls}
                  onChange={(e) => updateField('imageUrls', e.target.value)}
                  placeholder="https://..., https://..."
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="solid-button" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Create Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="modal-card modal-card--sm">
            <div className="delete-confirm-icon">🗑</div>
            <h2>Delete Movie</h2>
            <p className="delete-confirm-text">
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--text)' }}>{deleteTarget.title}</strong>? This action
              cannot be undone.
            </p>
            {deleteError && <ErrorBanner message={deleteError} />}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="danger-button" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

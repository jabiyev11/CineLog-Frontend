import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorBanner, SuccessBanner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatDate, formatRating, minutesToRuntime } from '../lib/format';
import type { MovieDetail, Review } from '../types/models';

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const { auth, isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState('0');
  const [reviewText, setReviewText] = useState('');
  const [watchedDate, setWatchedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!movieId) return;
      setLoading(true);
      setError('');
      try {
        const [movieResponse, reviewResponse] = await Promise.all([
          api.getMovie(movieId),
          api.getReviews(movieId),
        ]);
        if (!cancelled) {
          setMovie(movieResponse);
          setReviews(reviewResponse);
          const ownReview = auth?.username
            ? reviewResponse.find((review) => review.username === auth.username)
            : undefined;
          setReviewText(ownReview?.text ?? '');
          if (ownReview?.rating != null) setRating(String(ownReview.rating));
          else setRating('0');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load movie.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [movieId, auth?.username]);

  async function refreshReviews() {
    if (!movieId) return;
    const nextReviews = await api.getReviews(movieId);
    setReviews(nextReviews);
  }

  async function handleRatingSubmit(event: FormEvent) {
    event.preventDefault();
    if (!movieId) return;
    setError('');
    setFeedback('');
    try {
      await api.rateMovie(movieId, Number(rating));
      setFeedback('Rating saved.');
      setMovie(await api.getMovie(movieId));
      await refreshReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save rating.');
    }
  }

  async function handleReviewSubmit(event: FormEvent) {
    event.preventDefault();
    if (!movieId) return;
    setError('');
    setFeedback('');
    try {
      const ownReview = auth?.username ? reviews.find((review) => review.username === auth.username) : undefined;
      if (ownReview) {
        await api.updateReview(movieId, ownReview.id, { text: reviewText });
        setFeedback('Review updated.');
      } else {
        await api.createReview(movieId, { text: reviewText, score: Number(rating) });
        setFeedback('Review published.');
      }
      setMovie(await api.getMovie(movieId));
      await refreshReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save review.');
    }
  }

  async function handleAddWatchlist() {
    if (!movieId) return;
    setError('');
    setFeedback('');
    try {
      const response = await api.addToWatchlist(movieId);
      setFeedback(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to watchlist.');
    }
  }

  async function handleLogWatch() {
    if (!movieId) return;
    setError('');
    setFeedback('');
    try {
      const response = await api.addToWatchlog(movieId, watchedDate);
      setFeedback(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log watch.');
    }
  }

  async function handleToggleLike(reviewId: number) {
    setError('');
    try {
      await api.toggleReviewLike(reviewId);
      await refreshReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not like review.');
    }
  }

  async function handleDeleteRating() {
    if (!movieId) return;
    setError('');
    setFeedback('');
    try {
      const response = await api.deleteRating(movieId);
      setFeedback(response.message);
      setRating('0');
      setMovie(await api.getMovie(movieId));
      await refreshReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete rating.');
    }
  }

  async function handleDeleteReview(reviewId: number) {
    if (!movieId) return;
    setError('');
    setFeedback('');
    try {
      const response = await api.deleteReview(movieId, reviewId);
      setFeedback(response.message);
      setReviewText('');
      setMovie(await api.getMovie(movieId));
      await refreshReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete review.');
    }
  }

  if (loading) return <div className="empty-state">Loading movie...</div>;
  if (error && !movie) return <ErrorBanner message={error} />;
  if (!movie) return <EmptyState title="Movie missing" description="This entry could not be found." />;

  const ownReview = auth?.username ? reviews.find((review) => review.username === auth.username) : undefined;
  const ratingNumber = Number(rating) || 0;
  const activeStars = Math.round(ratingNumber);
  const galleryImages = [movie.backdropImageUrl, ...movie.imageUrls]
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
    .slice(0, 4);

  return (
    <div className="stack-xl">
      <section
        className="movie-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(7, 10, 20, 0.4), rgba(7, 10, 20, 0.95)), url(${movie.backdropImageUrl || movie.posterImageUrl})`,
        }}
      >
        <img className="detail-poster" src={movie.posterImageUrl} alt={movie.title} />
        <div className="detail-copy">
          <span className="eyebrow">{movie.genres.join(' • ')}</span>
          <h1>
            {movie.title} <span>{movie.releaseYear}</span>
          </h1>
          <div className="detail-chips">
            <span>{formatRating(movie.averageRating)} avg</span>
            <span>{minutesToRuntime(movie.durationMinutes)}</span>
            <span>{movie.country}</span>
            <span>{movie.language}</span>
          </div>
          <p>{movie.synopsis}</p>
          <div className="detail-metadata">
            <div>
              <span>Directed by</span>
              <strong>{movie.directors.join(', ')}</strong>
            </div>
            <div>
              <span>Cast</span>
              <strong>{movie.cast.slice(0, 5).join(', ')}</strong>
            </div>
          </div>
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}
      {feedback ? <SuccessBanner message={feedback} /> : null}

      <section className="content-grid">
        <div className="glass-panel stack-lg">
          <div className="section-header">
            <div>
              <span className="eyebrow">Your take</span>
              <h2>Rate, review, and remember it.</h2>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="your-take-layout">
              <form className="rating-strip" onSubmit={handleRatingSubmit}>
                <label className="rating-field">
                  <span>Rating</span>
                  <div className="star-picker" role="radiogroup" aria-label="Select rating">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        className={`star-button ${score <= activeStars ? 'active' : ''}`}
                        type="button"
                        onClick={() => setRating(String(score))}
                        aria-label={`Set rating to ${score} stars`}
                        aria-pressed={score === activeStars}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <strong className="rating-value">{ratingNumber.toFixed(1)} / 5</strong>
                </label>
                <div className="rating-actions">
                  <button className="solid-button" type="submit">
                    Save rating
                  </button>
                  <button className="ghost-button" type="button" onClick={handleDeleteRating}>
                    Remove rating
                  </button>
                </div>
              </form>

              <form className="review-form stack-md" onSubmit={handleReviewSubmit}>
                <div className="review-form-header">
                  <label htmlFor="review-textarea">Review</label>
                  <span>{reviewText.length}/500</span>
                </div>
                <textarea
                  id="review-textarea"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  rows={6}
                  minLength={1}
                  maxLength={500}
                  placeholder="What hit you about this movie?"
                />
                <div className="review-actions">
                  <button className="solid-button" type="submit">
                    {ownReview ? 'Update review' : 'Publish review'}
                  </button>
                  {ownReview ? (
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => handleDeleteReview(ownReview.id)}
                    >
                      Delete review
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="watch-actions-row">
                <button className="ghost-button" type="button" onClick={handleAddWatchlist}>
                  Add to watchlist
                </button>
                <label className="watch-date-field" htmlFor="watched-date-input">
                  <span>Watched date</span>
                  <input
                    id="watched-date-input"
                    type="date"
                    value={watchedDate}
                    onChange={(event) => setWatchedDate(event.target.value)}
                  />
                </label>
                <button className="ghost-button" type="button" onClick={handleLogWatch}>
                  Log watch
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Sign in to interact"
              description="You can browse everything, but rating, reviews, and lists unlock after login."
            />
          )}
        </div>

        <aside className="glass-panel stack-lg gallery-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Visuals</span>
              <h2>Gallery stills</h2>
            </div>
          </div>
          <div className="gallery-grid">
            {galleryImages.map((imageUrl) => (
              <figure key={imageUrl} className="gallery-item">
                <img src={imageUrl} alt={`${movie.title} still`} />
              </figure>
            ))}
          </div>
        </aside>
      </section>

      <section className="glass-panel stack-lg">
        <div className="section-header">
          <div>
            <span className="eyebrow">Community notes</span>
            <h2>Reviews</h2>
          </div>
        </div>
        {reviews.length ? (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <header>
                  <Link to={`/profile/${review.username}`}>{review.username}</Link>
                  <div>
                    <span>{review.rating != null ? `${review.rating}/5` : 'No rating'}</span>
                    <span>{formatDate(review.date)}</span>
                  </div>
                </header>
                <p>{review.text}</p>
                <button className="ghost-button small" onClick={() => handleToggleLike(review.id)}>
                  Appreciate review · {review.likeCount}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No reviews yet" description="Be the first person to leave a note for this movie." />
        )}
      </section>
    </div>
  );
}

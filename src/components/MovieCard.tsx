import { Link } from 'react-router-dom';
import { formatRating } from '../lib/format';
import type { MovieSummary } from '../types/models';

export default function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-poster-wrap">
        <img src={movie.posterImageUrl} alt={movie.title} className="movie-poster" />
        <div className="movie-rating-chip">{formatRating(movie.averageRating)}</div>
      </div>
      <div className="movie-meta">
        <h3>{movie.title}</h3>
        <p>{movie.releaseYear}</p>
      </div>
    </Link>
  );
}

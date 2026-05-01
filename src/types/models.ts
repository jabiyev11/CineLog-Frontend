export type AuthResponse = {
  token: string;
  username: string;
  email: string;
  role: string;
};

export type MessageResponse = {
  message: string;
};

export type ErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type MovieSummary = {
  id: number;
  title: string;
  releaseYear: number;
  posterImageUrl: string;
  averageRating: number | null;
};

export type MovieDetail = {
  id: number;
  title: string;
  releaseYear: number;
  directors: string[];
  cast: string[];
  genres: string[];
  durationMinutes: number;
  country: string;
  language: string;
  synopsis: string;
  posterImageUrl: string;
  backdropImageUrl: string | null;
  imageUrls: string[];
  averageRating: number | null;
};

export type SearchResult = {
  id: number;
  title: string;
  releaseYear: number;
  posterImageUrl: string;
};

export type SearchResponse = {
  message: string | null;
  results: SearchResult[];
};

export type Review = {
  id: number;
  username: string;
  rating: number | null;
  text: string;
  date: string;
  likeCount: number;
};

export type WatchlistItem = {
  id: number;
  movieId: number;
  title: string;
  releaseYear: number;
  posterImageUrl: string;
  addedAt: string;
};

export type WatchLogItem = {
  id: number;
  movieId: number;
  title: string;
  releaseYear: number;
  posterImageUrl: string;
  watchedDate: string;
  createdAt: string;
};

export type UserProfile = {
  username: string;
  profilePictureUrl: string | null;
  bio: string | null;
  totalMoviesWatched: number;
};

export type UserStats = {
  mostWatchedGenre: string | null;
  mostWatchedDirector: string | null;
  moviesWatchedPerYear: Record<string, number>;
};

export type ToggleLikeResponse = {
  liked: boolean;
  likeCount: number;
};

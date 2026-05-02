import { API_BASE_URL } from './config';
import { getStoredAuth } from './storage';
import type {
  AuthResponse,
  ErrorResponse,
  MessageResponse,
  MovieDetail,
  MovieSummary,
  PageResponse,
  Review,
  SearchResponse,
  ToggleLikeResponse,
  UserProfile,
  UserStats,
  WatchLogItem,
  WatchlistItem,
} from '../types/models';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: { method?: HttpMethod; body?: unknown; auth?: boolean } = {}) {
  const auth = getStoredAuth();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.auth && auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = 'Something went wrong.';
    try {
      const payload = (await response.json()) as ErrorResponse;
      message = payload.message || payload.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  register: (payload: { username: string; email: string; password: string }) =>
    request<MessageResponse>('/auth/register', { method: 'POST', body: payload }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: payload }),
  verifyOtp: (payload: { email: string; otp: string }) =>
    request<MessageResponse>('/auth/verify-otp', { method: 'POST', body: payload }),
  resendOtp: (payload: { email: string }) =>
    request<MessageResponse>('/auth/resend-otp', { method: 'POST', body: payload }),
  googleAuth: (idToken: string) =>
    request<AuthResponse>('/auth/google', { method: 'POST', body: { idToken } }),
  getMovies: (page = 0, size = 20) =>
    request<PageResponse<MovieSummary>>(`/movies?page=${page}&size=${size}`),
  searchMovies: (query: string) => request<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
  getMovie: (movieId: string | number) => request<MovieDetail>(`/movies/${movieId}`, { auth: true }),
  getReviews: (movieId: string | number) => request<Review[]>(`/movies/${movieId}/reviews`),
  rateMovie: (movieId: string | number, score: number) =>
    request<MessageResponse>(`/movies/${movieId}/rating`, { method: 'POST', body: { score }, auth: true }),
  deleteRating: (movieId: string | number) =>
    request<MessageResponse>(`/movies/${movieId}/rating`, { method: 'DELETE', auth: true }),
  createReview: (movieId: string | number, payload: { text: string; score?: number }) =>
    request<Review>(`/movies/${movieId}/reviews`, { method: 'POST', body: payload, auth: true }),
  updateReview: (movieId: string | number, reviewId: number, payload: { text: string }) =>
    request<Review>(`/movies/${movieId}/reviews/${reviewId}`, { method: 'PUT', body: payload, auth: true }),
  deleteReview: (movieId: string | number, reviewId: number) =>
    request<MessageResponse>(`/movies/${movieId}/reviews/${reviewId}`, { method: 'DELETE', auth: true }),
  toggleReviewLike: (reviewId: number) =>
    request<ToggleLikeResponse>(`/reviews/${reviewId}/like`, { method: 'POST', auth: true }),
  getWatchlist: () => request<WatchlistItem[]>('/watchlist', { auth: true }),
  addToWatchlist: (movieId: string | number) =>
    request<MessageResponse>(`/watchlist/${movieId}`, { method: 'POST', auth: true }),
  removeFromWatchlist: (movieId: string | number) =>
    request<MessageResponse>(`/watchlist/${movieId}`, { method: 'DELETE', auth: true }),
  getWatchlog: () => request<WatchLogItem[]>('/watchlog', { auth: true }),
  addToWatchlog: (movieId: string | number, watchedDate: string) =>
    request<MessageResponse>(`/watchlog/${movieId}`, {
      method: 'POST',
      body: { watchedDate },
      auth: true,
    }),
  getProfile: (username: string) => request<UserProfile>(`/users/${encodeURIComponent(username)}`),
  getProfileStats: (username: string) =>
    request<UserStats>(`/users/${encodeURIComponent(username)}/stats`),
  deleteAccount: () => request<MessageResponse>('/users/me', { method: 'DELETE', auth: true }),
};

export { ApiError };

import type { AuthResponse } from '../types/models';

const STORAGE_KEY = 'cinelog-auth';
const USER_RATINGS_KEY = 'cinelog-user-ratings';

export function getStoredAuth(): AuthResponse | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setStoredAuth(auth: AuthResponse | null) {
  if (!auth) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function getStoredRatings(): Record<string, number> {
  const raw = window.localStorage.getItem(USER_RATINGS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    window.localStorage.removeItem(USER_RATINGS_KEY);
    return {};
  }
}

function ratingKey(username: string, movieId: string | number) {
  return `${username}:${movieId}`;
}

export function getStoredUserRating(username: string, movieId: string | number) {
  return getStoredRatings()[ratingKey(username, movieId)] ?? null;
}

export function setStoredUserRating(username: string, movieId: string | number, score: number) {
  const ratings = getStoredRatings();
  ratings[ratingKey(username, movieId)] = score;
  window.localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(ratings));
}

export function removeStoredUserRating(username: string, movieId: string | number) {
  const ratings = getStoredRatings();
  delete ratings[ratingKey(username, movieId)];
  window.localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(ratings));
}

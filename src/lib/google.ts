import { GOOGLE_CLIENT_ID } from './config';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }): void;
          prompt(): void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

export function loadGoogleScript() {
  if (!GOOGLE_CLIENT_ID) {
    return Promise.reject(new Error('VITE_GOOGLE_CLIENT_ID is not configured.'));
  }

  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function requestGoogleCredential() {
  await loadGoogleScript();

  return new Promise<string>((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services is unavailable.'));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response.credential) {
          reject(new Error('Google did not return a credential.'));
          return;
        }
        resolve(response.credential);
      },
    });

    window.google.accounts.id.prompt();
  });
}

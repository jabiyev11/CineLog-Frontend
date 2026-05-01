import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorBanner, SuccessBanner } from '../components/Feedback';
import { api } from '../lib/api';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('email')) {
      setEmail(searchParams.get('email') ?? '');
    }
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.verifyOtp({ email, otp });
      setSuccess(response.message);
      window.setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.resendOtp({ email });
      setSuccess(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <span className="eyebrow">Email verification</span>
        <h1>Enter your 6-digit code.</h1>
        <p>We sent an OTP to the email you used when signing up.</p>

        {error ? <ErrorBanner message={error} /> : null}
        {success ? <SuccessBanner message={success} /> : null}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            OTP
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
            />
          </label>
          <button className="solid-button wide" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <button className="ghost-button wide" type="button" onClick={onResend} disabled={resendLoading}>
          {resendLoading ? 'Resending...' : 'Resend OTP'}
        </button>

        <p className="auth-footer">
          Back to <Link to="/login">login</Link>
        </p>
      </div>
    </section>
  );
}

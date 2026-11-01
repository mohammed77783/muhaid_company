import { useState, type FormEvent, type JSX } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { TextField } from '../../components/TextField';
import { useT } from '../../hooks/useI18n';
import { useLogin } from '../../hooks/useLogin';
import { fieldErrors, type ApiError } from '../../lib/apiError';
import { getToken } from '../../lib/authToken';
import type { Messages } from '../../lib/i18n/messages';
import { returnPath } from '../../lib/routes';
import styles from './Login.module.css';

interface LoginLocationState {
  from?: string;
  /** Set when the server ended the session, as opposed to the person logging out. */
  sessionEnded?: boolean;
}

const EMAIL = /^\S+@\S+\.\S+$/;

interface FieldProblems {
  email?: string;
  password?: string;
}

function validate(email: string, password: string, t: Messages): FieldProblems {
  const problems: FieldProblems = {};
  if (!EMAIL.test(email)) problems.email = t.login.emailInvalid;
  if (password.length < 1) problems.password = t.login.passwordRequired;
  else if (password.length > 200) problems.password = t.login.passwordTooLong;
  return problems;
}

/** One message for any bad login: the server deliberately doesn't say which part was wrong. */
function formError(error: ApiError, t: Messages): string | null {
  if (error.status === 401) return t.login.invalidCredentials;
  if (error.isNetworkError) return t.errors.network;
  if (error.status >= 500) return t.errors.server;
  return error.status === 400 ? null : t.errors.unexpected;
}

export function Login(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginLocationState;
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [problems, setProblems] = useState<FieldProblems>({});

  // Already signed in: "/" sends them to their own home.
  if (getToken() && !login.isSuccess) return <Navigate to="/" replace />;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const trimmed = email.trim();
    const found = validate(trimmed, password, t);
    setProblems(found);
    if (found.email || found.password) return;
    login.mutate(
      { email: trimmed, password },
      {
        onSuccess: ({ user }) =>
          void navigate(returnPath(user.role, state.from), { replace: true }),
      },
    );
  }

  const serverFields =
    login.error?.status === 400 ? fieldErrors(login.error) : {};
  const message = login.error ? formError(login.error, t) : null;

  return (
    <main className={styles.page}>
      <div className={styles.language}>
        <LanguageSwitch />
      </div>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <Icon name="hardhat" size={32} className={styles.brandIcon} />
          <h1 className={styles.tagline}>{t.app.tagline}</h1>
        </div>

        {state.sessionEnded && !login.error && (
          <Alert variant="info">{t.login.sessionEnded}</Alert>
        )}

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <h2 className={styles.title}>{t.login.title}</h2>
          <TextField
            label={t.login.email}
            type="email"
            inputMode="email"
            inputDir="ltr"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={problems.email ?? serverFields.email?.[0]}
          />
          <TextField
            label={t.login.password}
            type="password"
            inputDir="ltr"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={problems.password ?? serverFields.password?.[0]}
          />
          {message && <Alert variant="error">{message}</Alert>}
          <Button
            type="submit"
            fullWidth
            loading={login.isPending}
            loadingLabel={t.login.submitting}
          >
            {t.login.submit}
          </Button>
        </form>
      </div>
    </main>
  );
}

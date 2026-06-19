import { useState } from 'react'
import Brand from './Brand'
import AppIcon from './AppIcons'
import InstallApp from './InstallApp'
import { useAuth } from '../auth/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showInstall, setShowInstall] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (isRegister && !name.trim()) return setError('Please enter your name.')
    if (!email.trim()) return setError('Please enter your email.')
    if (password.length < 4) return setError('Password must be at least 4 characters.')

    setBusy(true)
    const res = isRegister
      ? await register({ name, email, password })
      : await login({ email, password })
    setBusy(false)
    if (!res.ok) setError(res.error)
  }

  function swap(next) {
    setMode(next)
    setError('')
    setPassword('')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand"><Brand size={44} /></div>

        <h1 className="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-sub">
          {isRegister
            ? 'Start turning big goals into a journey you can watch yourself finish.'
            : 'Sign in to pick up your journey where you left off.'}
        </p>

        <div className="auth-tabs">
          <button className={!isRegister ? 'active' : ''} onClick={() => swap('login')}>Sign in</button>
          <button className={isRegister ? 'active' : ''} onClick={() => swap('register')}>Sign up</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {isRegister && (
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button className="link-btn" onClick={() => swap(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        <div className="auth-download">
          <button type="button" className="install-link" onClick={() => setShowInstall(true)}>
            <AppIcon name="download" size={16} />
            Download the app for Android, iPhone &amp; desktop
          </button>
        </div>
      </div>

      {showInstall && <InstallApp onClose={() => setShowInstall(false)} />}
    </div>
  )
}

import { useState } from 'react'
import { useStore } from '../lib/store'
import { Arrow } from '../components/Icons'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function AuthView({ onDone }: { onDone: () => void }) {
  const store = useStore()
  const [mode, setMode] = useState<'signup' | 'signin'>(store.account ? 'signin' : 'signup')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const oauthStub = (which: string) =>
    store.toast(`${which} sign-in needs a backend — email works today`)

  const submit = async () => {
    setErr('')
    if (mode === 'signup') {
      if (!first.trim()) return setErr('First name, at least.')
      if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('That email doesn’t look right.')
      if (pw.length < 8) return setErr('Password needs 8+ characters.')
      setBusy(true)
      store.createAccount({
        firstName: first.trim(),
        lastName: last.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await sha256(pw),
        createdAt: Date.now(),
      })
      store.setProfile({ name: first.trim() })
      store.toast(`Welcome, ${first.trim()}`)
      setBusy(false)
      onDone()
    } else {
      const a = store.account
      if (!a) return setErr('No account on this device yet — create one.')
      setBusy(true)
      const ok = a.email === email.trim().toLowerCase() && a.passwordHash === (await sha256(pw))
      setBusy(false)
      if (!ok) return setErr('Email or password doesn’t match.')
      store.signIn()
      store.toast(`Welcome back, ${a.firstName}`)
      onDone()
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h2 className="auth__title">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="auth__sub">
          {mode === 'signup'
            ? 'Two fields you’ll actually use. Stored on this device.'
            : 'Sign back in to your local account.'}
        </p>

        <div className="auth__oauth">
          <button className="btn btn--ghost" onClick={() => oauthStub('Apple')}>
             Apple
          </button>
          <button className="btn btn--ghost" onClick={() => oauthStub('Google')}>
            <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.9 6.2C12.3 13.4 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6C44.2 38 46.5 31.8 46.5 24.5z" />
              <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l7.9-6.2z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.7-6c-2.1 1.4-4.8 2.3-7.5 2.3-6.3 0-11.7-3.9-13.6-9.4l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Google
          </button>
        </div>

        <div className="ordiv">
          <span>or</span>
        </div>

        {mode === 'signup' && (
          <div className="auth__names">
            <div className="field">
              <div className="field__label">
                <span>First name</span>
              </div>
              <input
                className="text-input"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>
            <div className="field">
              <div className="field__label">
                <span>Last name</span>
              </div>
              <input
                className="text-input"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>
          </div>
        )}

        <div className="field">
          <div className="field__label">
            <span>Email address</span>
          </div>
          <input
            className="text-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <div className="field__label">
            <span>Password</span>
          </div>
          <div className="pwwrap">
            <input
              className="text-input"
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={mode === 'signup' ? '8+ characters' : 'Enter your password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
            <button
              className="pweye"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '◡' : '◉'}
            </button>
          </div>
        </div>

        {err && (
          <p className="tiny" style={{ color: 'var(--red)', marginBottom: 12 }}>
            {err}
          </p>
        )}

        <button className="btn btn--primary btn--lg btn--block" disabled={busy} onClick={() => void submit()}>
          Continue <Arrow />
        </button>

        <div className="auth__foot">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')}>Sign in</button>
            </>
          ) : (
            <>
              New here? <button onClick={() => setMode('signup')}>Create an account</button>
            </>
          )}
        </div>
        <p className="auth__secure">Local account — nothing leaves this device.</p>
      </div>
    </div>
  )
}

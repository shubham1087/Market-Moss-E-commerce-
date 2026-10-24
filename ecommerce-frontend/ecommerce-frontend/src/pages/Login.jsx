import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import api from '../services/api.js'

function Login() {
  const { signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const validate = () => {
    const nextErrors = {}
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSuccessMessage('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await api.post('/users/login', {
        email: email.trim(),
        password,
      })

      if (
        !data
        || !Number.isInteger(data.userId)
        || typeof data.name !== 'string'
        || typeof data.email !== 'string'
        || typeof data.role !== 'string'
        || typeof data.token !== 'string'
        || !data.token
        || data.tokenType !== 'Bearer'
      ) {
        throw new Error('The login service returned an unexpected response.')
      }

      signIn({
        user: {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
        },
        token: data.token,
      })
      setPassword('')
      setSuccessMessage(`Welcome back, ${data.name}. You are signed in.`)
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message
          || error.message
          || 'Unable to sign in. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const destination = location.state?.from?.pathname
    && location.state.from.pathname.startsWith('/')
    && !location.state.from.pathname.startsWith('//')
    ? location.state.from.pathname
    : '/orders'

  return (
    <section className="page">
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in</h1>
      <p className="page-intro">Sign in to view your orders and continue to checkout.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <input
            autoComplete="email"
            id="login-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && <span className="field-error" id="login-email-error">{errors.email}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input
            autoComplete="current-password"
            id="login-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
          {errors.password && <span className="field-error" id="login-password-error">{errors.password}</span>}
        </div>

        <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        {submitError && <p className="form-feedback error-state" role="alert">{submitError}</p>}
        {successMessage && (
          <div className="form-feedback auth-success" role="status">
            <p>{successMessage}</p>
            <Link to={destination}>Continue to your account</Link>
          </div>
        )}
        <p className="auth-form-note">
          New to Market & Moss? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  )
}

export default Login
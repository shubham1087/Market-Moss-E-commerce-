import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api.js'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const validate = () => {
    const nextErrors = {}
    const normalizedEmail = email.trim()

    if (!name.trim()) {
      nextErrors.name = 'Name is required.'
    }

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
      const { data } = await api.post('/users/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      })

      if (
        !data
        || !Number.isInteger(data.id)
        || typeof data.name !== 'string'
        || typeof data.email !== 'string'
        || typeof data.role !== 'string'
      ) {
        throw new Error('The registration service returned an unexpected response.')
      }

      setName('')
      setEmail('')
      setPassword('')
      setErrors({})
      setSuccessMessage(`Your account was created, ${data.name}. Please sign in.`)
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message
          || error.message
          || 'Unable to create your account. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">Your account</p>
      <h1>Create an account</h1>
      <p className="page-intro">Join Market & Moss to keep your orders in one place.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="register-name">Name</label>
          <input
            autoComplete="name"
            id="register-name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            type="text"
            value={name}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
          />
          {errors.name && <span className="field-error" id="register-name-error">{errors.name}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input
            autoComplete="email"
            id="register-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && <span className="field-error" id="register-email-error">{errors.email}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <input
            autoComplete="new-password"
            id="register-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
          />
          {errors.password && <span className="field-error" id="register-password-error">{errors.password}</span>}
        </div>

        <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        {submitError && <p className="form-feedback error-state" role="alert">{submitError}</p>}
        {successMessage && (
          <p className="form-feedback auth-success" role="status">
            {successMessage} <Link to="/login">Sign in</Link>
          </p>
        )}
        <p className="auth-form-note">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  )
}

export default Register
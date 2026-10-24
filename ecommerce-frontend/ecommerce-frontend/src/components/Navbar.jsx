import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import useCart from '../hooks/useCart.js'

const links = [
  { to: '/products', label: 'Shop' },
  { to: '/orders', label: 'Orders' },
]

function Navbar() {
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const itemLabel = itemCount === 1 ? 'item' : 'items'

  useEffect(() => {
    if (!profileOpen) return undefined

    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  const handleSignOut = () => {
    setProfileOpen(false)
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink className="brand" to="/" end>
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>Market & Moss</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              {link.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin/products"
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Add Product
            </NavLink>
          )}
          {user ? (
            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-trigger"
                type="button"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label={`Profile menu for ${user.name}`}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="profile-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                  </svg>
                </span>
                <span className="profile-trigger-name">{user.name}</span>
                <svg className="profile-chevron" viewBox="0 0 12 8" aria-hidden="true">
                  <path d="m1 1 5 5 5-5" />
                </svg>
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <p className="profile-dropdown-name">{user.name}</p>
                  <button
                    className="profile-signout"
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Sign in
            </NavLink>
          )}
          <NavLink className="cart-link" to="/cart" aria-label={`Shopping bag, ${itemCount} ${itemLabel}`}>
            Bag <span className="cart-count" aria-label={`${itemCount} ${itemLabel}`}>{itemCount}</span>
            <span aria-hidden="true">↗</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
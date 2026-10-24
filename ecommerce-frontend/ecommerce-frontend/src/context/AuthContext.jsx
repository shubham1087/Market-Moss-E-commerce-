import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { setBearerToken } from '../services/api.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const signIn = useCallback(({ user: authenticatedUser, token }) => {
    setBearerToken(token)
    setUser(authenticatedUser)
  }, [])

  const signOut = useCallback(() => {
    setBearerToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: user !== null,
    signIn,
    signOut,
  }), [user, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

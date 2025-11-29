import { Link, useNavigate } from 'react-router-dom'
import  useAuthStore  from "../stores/authStore"


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
 
export function Navbar() {
  const user = useAuthStore((state) => state.user)
  const logoutZustand = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  
  console.log("Navbar user:", user)

  const logoutUser = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      logoutZustand()   
      navigate('/')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  const login = () => {
    window.location.href = `${API_BASE_URL}/auth/login`
  }

  return (
    <div className="sticky top-0 mb-4 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Airtable Form Builder
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-700">
          {user ? (
            <>
              <nav className="flex items-center gap-3 text-slate-600">
                <Link to="/dashboard" className="hover:text-slate-900">
                  Dashboard
                </Link>
                <Link to="/form/new" className="hover:text-slate-900">
                  New Form
                </Link>
              </nav>
              <span>{user.name}</span>
              <button className="rounded bg-slate-900 px-4 py-2 text-white hover:cursor-pointer" onClick={logoutUser}>
                Log out
              </button>
            </>
          ) : (
            <button className="rounded bg-slate-900 px-4 py-2 text-white hover:cursor-pointer " onClick={login} >
              Log in with Airtable
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

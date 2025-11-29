
import React, { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { Navbar } from './Navbar';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AuthWrapper = ({ children }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      try {
        console.log("Calling for me")
        const response = await fetch(`${API_BASE_URL}/auth/me`, { 
          credentials: 'include' 
        });

        console.log("Response from /auth/me:", response);

        if (response.ok) {
          const userData = await response.json();
          console.log("User data fetched:", userData);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("auth failed:", error);
        setUser(null);
      } finally {
        setLoading(false); 
      }
    };

    verifySession();
    if(!isAuthenticated)  navigate('/');
  }, [setUser, setLoading]);

  if (isLoading) {
    return <div>Checking authentication status...</div>;
  }

  return <>
  <Navbar/>
  {children}
  </>;
};

export default AuthWrapper;

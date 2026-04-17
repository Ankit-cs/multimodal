// frontend/src/context/AuthContext.jsx
// Provides authentication state (token + user) to the entire app.
// Any component can call useAuth() to read the state or trigger login/logout.
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Pull whatever was saved last time the user visited (survives page refreshes)
function loadFromStorage() {
    try {
        const token = localStorage.getItem('auth_token');
        const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
        return { token, user };
    } catch {
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }) {
    const { token: savedToken, user: savedUser } = loadFromStorage();
    const [token, setToken] = useState(savedToken);
    const [user, setUser] = useState(savedUser);
    const navigate = useNavigate();

    // Called right after a successful login or signup
    const login = useCallback((tokenData) => {
        // tokenData = { access_token, token_type, user: { id, name, email, created_at } }
        localStorage.setItem('auth_token', tokenData.access_token);
        localStorage.setItem('auth_user', JSON.stringify(tokenData.user));
        setToken(tokenData.access_token);
        setUser(tokenData.user);
        navigate('/dashboard');
    }, [navigate]);

    // Called when the user clicks "Log out" anywhere in the app
    const logout = useCallback(async () => {
        // Tell the server (fire-and-forget — we don't block on this)
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch { /* server being down shouldn't block a local logout */ }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const value = {
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook so components don't need to import AuthContext directly
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
    return ctx;
}

// frontend/src/components/ProtectedRoute.jsx
// Wrap any route you want to restrict to logged-in users.
// If there's no token, we silently redirect to /login instead of showing
// a blank page or an error.
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    // `replace` avoids adding /login to the browser history so the back button
    // doesn't send the user back to a page they shouldn't be on
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

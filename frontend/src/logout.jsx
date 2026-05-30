import { useEffect } from "react";

// Written by Puvan, 2026 - Logout page to clear session and invalidate cookie
function Logout({ setIsAuthenticated, API_BASE_URL }) {
    // Reset authenticated boolean on app
    useEffect(() => {
        setIsAuthenticated(false);
        logout();
    }, []);

    //Invalidate cookie and remove from local storage
    const logout = async () => {
        const response = await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    
        localStorage.removeItem('token');
        sessionStorage.clear();
        window.location.href = '/login';
    };
} export default Logout;
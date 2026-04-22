import { useEffect } from "react";

function Logout({ setIsAuthenticated, API_BASE_URL }) {
    useEffect(() => {
        setIsAuthenticated(false);
        logout();
    }, []);

    //Invalidate cookie and remove from local storage
    const logout = async () => {
        const response = await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' }); //CHANGE ID AND WEEK TO DYNAMIC VAR
    
        localStorage.removeItem('token');
        sessionStorage.clear();
        window.location.href = '/login';
    };
} export default Logout;
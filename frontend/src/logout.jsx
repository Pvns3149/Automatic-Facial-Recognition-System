import { useEffect } from "react";

function Logout({ setIsAuthenticated, API_BASE_URL }) {
    useEffect(() => {
        setIsAuthenticated(false);
        logout();
    }, []);


    const logout = async () => {
    // Clear the authentication token from local storage and return to login
    const response = await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' }); //CHANGE ID AND WEEK TO DYNAMIC VAR
    window.location.href = '/login';
    };
} export default Logout;
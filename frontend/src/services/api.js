
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//API service for communicating with the Flask backend

//The functions below are examples to be referred to on how to structure API calls. You can modify or expand them as needed for your functions.

export const api = {
  
  // Connection test endpoint
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  },

  // Database connection test endpoint
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  /**
   * Get a specific user by ID
   */
  async getUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  /**
   * Create a new user
   */
  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  /**
   * Update an existing user
   */
  async updateUser(id, userData) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  /**
   * Delete a user
   */
  async deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    return response.json();
  },
};

export default api;

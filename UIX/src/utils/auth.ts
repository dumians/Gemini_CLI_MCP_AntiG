export const auth = {
    setToken: (token: string) => localStorage.setItem('mesh_auth_token', token),
    getToken: () => localStorage.getItem('mesh_auth_token'),
    clearToken: () => localStorage.removeItem('mesh_auth_token'),
    setUser: (user: any) => localStorage.setItem('mesh_user', JSON.stringify(user)),
    getUser: () => {
        const user = localStorage.getItem('mesh_user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated: () => !!localStorage.getItem('mesh_auth_token')
};

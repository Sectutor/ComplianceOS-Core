export const useAuth = () => {
    // Mock authentication hook
    return {
        loading: false,
        user: { name: "Test User", email: "test@example.com" },
        logout: () => { window.location.href = "/login" }
    };
};

import { createContext, useContext, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    const { user, token } = response.data;

    localStorage.setItem("token", token);

    setToken(token);
    setUser(user);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
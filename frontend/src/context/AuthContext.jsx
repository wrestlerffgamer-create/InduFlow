import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./authStore";

const readToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 <= Date.now()) throw new Error("expired");
    return decoded;
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readToken);

  const login = (token) => {
    localStorage.setItem("token", token);

    setUser(readToken());
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

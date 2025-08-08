import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  deleteTokens,
  apiGet,
  apiPost,
  refreshAccessToken,
} from "../lib/api";

export type User = {
  id: number;
  email: string;
  nickname?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("No access token");

        const res = await apiGet("/api/v1/auth/me/", accessToken);
        setUser(res.data.result);
      } catch (err) {
        try {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) throw new Error("로그인 세션이 만료되었습니다.");

          const newAccessToken = await refreshAccessToken(refreshToken);
          await saveTokens(newAccessToken, refreshToken);

          const res = await apiGet("/api/v1/auth/me/", newAccessToken);
          setUser(res.data.result);
        } catch (e) {
          await deleteTokens();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    await deleteTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

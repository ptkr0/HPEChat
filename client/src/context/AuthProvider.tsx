import { axiosPrivate } from "@/api/axios";
import { User } from "@/types/user.type";
import { createContext, useState, ReactNode, useEffect } from "react"

interface AuthContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({ id: '', username: '', role: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching user data...");
    axiosPrivate.get('/User/auth-test', {
      withCredentials: true,
    })
    .then((response) => {
      setUser({
        id: response.data.id,
        username: response.data.username,
        role: response.data.role,
      });
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      setUser({ id: '', username: '', role: '' });
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
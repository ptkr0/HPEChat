import { userService } from "@/services/userService"
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
    userService.getMe()
    .then((response) => {
      setUser({
        id: response.id,
        username: response.username,
        role: response.role,
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
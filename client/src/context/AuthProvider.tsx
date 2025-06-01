import { userService } from "@/services/userService";
import { User } from "@/types/user.type";
import { createContext, useState, ReactNode, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useSignalR } from "@/hooks/useSignalR";
import { fileService } from "@/services/fileService";

interface AuthContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({ id: '', username: '', role: '', image: '', blobImage: '' });
  const [loading, setLoading] = useState(true);
  const { initializeSignalR, closeSignalRConnection } = useSignalR();
  const clearStore = useAppStore((state) => state.clearStore);
  const fetchServers = useAppStore((state) => state.fetchServers);

  useEffect(() => {
    setLoading(true);
    userService.getMe()
      .then(async (response) => {
        setUser({
          id: response.id,
          username: response.username,
          role: response.role,
          image: response.image || '',
        });

        if (user.image) {
        const avatarBlob = await fileService.getAvatar(user.image);
        const objectUrl = URL.createObjectURL(avatarBlob);
        setUser(prevUser => ({
          ...prevUser,
          blobImage: objectUrl,
        }));
      } else {
        setUser(prevUser => ({
          ...prevUser,
          blobImage: '',
        }));
      }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setUser({ id: '', username: '', role: '', image: '', blobImage: '' }); // Reset user on error
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user.image]);

  useEffect(() => {
    if (user.id && !loading) {
      // fetch servers -> then initialize SignalR
      fetchServers().then(() => {
        initializeSignalR();
      }).catch(error => {
        console.error("AuthProvider: Error fetching servers before SignalR init:", error);
      });
    } else if (!user.id && !loading) {
      clearStore();
      closeSignalRConnection();
    }
  }, [user.id, loading, fetchServers, initializeSignalR, closeSignalRConnection, clearStore]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

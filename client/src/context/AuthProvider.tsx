import { userService } from "@/services/userService";
import { User } from "@/types/user.type";
import { createContext, useState, ReactNode, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useSignalR } from "@/hooks/useSignalR";

interface AuthContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({ id: '', username: '', role: '', image: '' });
  const [loading, setLoading] = useState(true);
  const { initializeServerHub, initializeUserHub, closeUserHub, closeServerHub } = useSignalR();
  const fetchAndCacheAvatar = useAppStore((state) => state.fetchAndCacheAvatar);
  const clearServerSlice = useAppStore((state) => state.clearServerSlice);
  const clearChannelSlice = useAppStore((state) => state.clearChannelSlice);
  const clearBlobSlice = useAppStore((state) => state.clearBlobs);
  const fetchServers = useAppStore((state) => state.fetchServers);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await userService.getMe();
        if (!isMounted) return;

        const basicUser = {
          id: userData.id,
          username: userData.username,
          role: userData.role,
          image: userData.image || '',
        };
        setUser(basicUser);

        // if user has an avatar, fetch it and convert to object URL
        if (userData.image) {
          fetchAndCacheAvatar(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setUser({ id: '', username: '', role: '', image: '' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
      setUser(() => {
        return { id: '', username: '', role: '', image: '' };
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {

    if (!loading && user.id === '') {
      setUser(prev => ({ ...prev }));
    }

    if (user.id && !loading) {
      fetchServers().then(() => {
        initializeServerHub();
        initializeUserHub();
      }).catch(error => {
        console.error("AuthProvider: Error fetching servers before SignalR init:", error);
      });
    } else if (!user.id && !loading) {
      clearServerSlice();
      clearChannelSlice();
      clearBlobSlice();
      closeServerHub();
      closeUserHub();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, loading]);


  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

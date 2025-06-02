import { userService } from "@/services/userService";
import { User } from "@/types/user.type";
import { createContext, useState, ReactNode, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useSignalR } from "@/hooks/useSignalR";
import { fileService } from "@/services/fileService";

export type UserWithBlobImage = User & { blobImage: string };

interface AuthContextType {
  user: UserWithBlobImage;
  setUser: React.Dispatch<React.SetStateAction<UserWithBlobImage>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithBlobImage>({ id: '', username: '', role: '', image: '', blobImage: '' });
  const [loading, setLoading] = useState(true);
  const { initializeSignalR, closeSignalRConnection } = useSignalR();
  const clearStore = useAppStore((state) => state.clearStore);
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
          blobImage: '',
        };
        setUser(basicUser);

        // if user has an avatar, fetch it and convert to object URL
        if (userData.image) {
          const avatarBlob = await fileService.getAvatar(userData.image);
          if (!isMounted) return;

          const objectUrl = URL.createObjectURL(avatarBlob);
          setUser(prevUser => ({
            ...prevUser,
            blobImage: objectUrl,
          }));

        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setUser({ id: '', username: '', role: '', image: '', blobImage: '' });
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
      setUser(currentUser => {
        if (currentUser.blobImage) {
          URL.revokeObjectURL(currentUser.blobImage);
        }
        return { id: '', username: '', role: '', image: '', blobImage: '' };
      });
    };
  }, []);

  useEffect(() => {

    if (!loading && user.blobImage && user.id === '') {
      URL.revokeObjectURL(user.blobImage);
      setUser(prev => ({ ...prev, blobImage: '' }));
    }

    if (user.id && !loading) {
      fetchServers().then(() => {
        initializeSignalR();
      }).catch(error => {
        console.error("AuthProvider: Error fetching servers before SignalR init:", error);
      });
    } else if (!user.id && !loading) {
      clearStore();
      closeSignalRConnection();
      if (user.blobImage) {
        URL.revokeObjectURL(user.blobImage);
        setUser(prev => ({ ...prev, blobImage: '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.blobImage, loading]);


  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

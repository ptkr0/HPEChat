import { create } from 'zustand';
import { Server, ServerDetails } from '@/types/server.types';
import { Channel } from '@/types/channel.types';
import { serverService } from '@/services/serverService';
import { User } from '@/types/user.type';
import { toast } from 'sonner';


interface AppState {
  servers: Server[];
  serversLoading: boolean;
  serversError: string | null;
  fetchServers: () => Promise<void>;

  selectedServerId: string | null;
  channels: Channel[];
  members: User[];
  serverDetailsLoading: boolean;
  serverDetailsError: string | null;
  selectServer: (serverId: string | null) => void;

  selectedChannelId: string | null;
  selectChannel: (channelId: string | null) => void;

  createServer: (newServerData: Omit<Server, 'id' | 'owner' | 'description'> & { description?: string }) => Promise<Server | null>;
  joinServer: (inviteCode: string) => Promise<Server | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  servers: [],
  serversLoading: false,
  serversError: null,

  selectedServerId: null,
  channels: [],
  members: [],
  serverDetailsLoading: false,
  serverDetailsError: null,

  selectedChannelId: null,

  fetchServers: async () => {
    set({ serversLoading: true, serversError: null });
    try {
      const fetchedServers = await serverService.getAll();
      set({ servers: fetchedServers, serversLoading: false });

    } catch (error) {
      console.error("Error fetching servers:", error);
      set({ serversError: 'Nie udało się pobrać listy serwerów.', serversLoading: false });
    }
  },

  selectServer: (serverId: string | null) => {

    if (get().selectedServerId === serverId) {
        return;
    }

    set({
      selectedServerId: serverId,
      channels: [],
      members: [],
      selectedChannelId: null,
      serverDetailsLoading: serverId !== null,
      serverDetailsError: null,
    });

    if (serverId) {
      const fetchServerDetails = async () => {
        try {

          const serverDetails: ServerDetails = await serverService.getById(serverId);

          if (get().selectedServerId === serverId) {
            set({
              channels: serverDetails.channels,
              members: serverDetails.members,
              serverDetailsLoading: false,
            });
          }
        } catch (error) {
          console.error(`Error fetching details for server ${serverId}:`, error);
          toast.error('Nie udało się pobrać szczegółów serwera.');
          if (get().selectedServerId === serverId) {
            set({ serverDetailsError: 'Nie udało się pobrać szczegółów serwera.', serverDetailsLoading: false });
          }
        }
      };
      fetchServerDetails();
    }
  },

  selectChannel: (channelId: string | null) => {
    set({ selectedChannelId: channelId });
  },

  createServer: async (newServerData) => {
    try {
      const newServer = await serverService.createServer({ ...newServerData, description: newServerData.description || '' });
      if (newServer) {
        set((state) => ({ servers: [...state.servers, newServer] }));
        return newServer;
      }
      return null;
    } catch (error) {
      toast.error('Serwer o takiej nazwie już istnieje.');
      console.error("Error creating server:", error);
      return null;
    }
  },

  joinServer: async (inviteCode) => {
    try {
      const joinedServer = await serverService.joinServer(inviteCode);
      if (joinedServer) {
        set((state) => ({ servers: [...state.servers, joinedServer] }));
        return joinedServer;
      }
       return null;
    } catch (error) {
      toast.error('Nie udało się dołączyć do serwera. Sprawdź nazwę serwera.');
      console.error("Error joining server:", error);
      return null;
    }
  },
}));
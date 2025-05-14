import { create } from 'zustand';
import { Server, ServerDetails } from '@/types/server.types';
import { Channel } from '@/types/channel.types';
import { serverService } from '@/services/serverService';
import { User } from '@/types/user.type';
import { toast } from 'sonner';
import { channelService } from '@/services/channelService';


interface AppState {
  servers: Server[]; // list of all servers that user is a member of (basic info)
  serversLoading: boolean;
  serversError: string | null;
  fetchServers: () => Promise<void>;

  selectedServerId: string | null; // ID of the currently selected server
  selectedServer: ServerDetails | null; // details of the currently selected server (STORES SERVER DEATILS, CHANNELS, MEMBERS AND SHOULD BE USED AS A SINGLE SOURCE OF TRUTH)
  selectedServerName: string | null; // name of the currently selected server (DEPRECATED AND WILL BE REMOVED)
  selectedServerDescription: string | null; // description of the currently selected server (DEPRECATED AND WILL BE REMOVED)
  channels: Channel[]; // list of channels in the currently selected server (DEPRECATED AND WILL BE REMOVED)
  members: User[]; // list of members in the currently selected server (DEPRECATED AND WILL BE REMOVED)

  serverDetailsLoading: boolean;
  serverDetailsError: string | null;

  cachedServers: Map<string, ServerDetails>; // cache for server details that user has already fetched
  selectServer: (serverId: string | null) => void;

  selectedChannelId: string | null; // ID of the currently selected channel
  selectedChannel: Channel | null; // details of the currently selected channel

  selectChannel: (channelId: string | null) => void;

  createServer: (newServerData: Omit<Server, 'id' | 'owner' | 'description'> & { description?: string }) => Promise<Server | null>;
  joinServer: (inviteCode: string) => Promise<Server | null>;

  createChannel: (newChannelData: Omit<Channel, 'id'>) => Promise<Channel | null>;

  deleteChannel: (channelId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  servers: [],
  serversLoading: false,
  serversError: null,

  selectedServerId: null,
  selectedServer: null,
  selectedServerName: null,
  selectedServerDescription: null,
  channels: [],
  members: [],
  serverDetailsLoading: false,
  serverDetailsError: null,

  selectedChannelId: null,
  selectedChannel: null,

  cachedServers: new Map(),

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

    if (serverId) {
      const cachedDetails = get().cachedServers.get(serverId);

      if (cachedDetails) {
        // cache hit
        set({
          selectedServerId: serverId,
          selectedServer: cachedDetails,
          selectedServerName: cachedDetails.name,
          selectedServerDescription: cachedDetails.description,
          channels: cachedDetails.channels,
          members: cachedDetails.members,
          selectedChannelId: null, // reset selected channel when server changes
          serverDetailsLoading: false,
          serverDetailsError: null,
        });
      } else {
        // cache miss
        set({
          selectedServerId: serverId,
          selectedServer: null,
          selectedServerName: null,
          selectedServerDescription: null,
          channels: [],
          members: [],
          selectedChannelId: null, // reset selected channel
          serverDetailsLoading: true, // set loading true before async fetch
          serverDetailsError: null,
        });

        const fetchServerDetails = async () => {
          try {
            const serverDetails: ServerDetails = await serverService.getById(serverId);
            
            if (get().selectedServerId === serverId) {
              set((state) => ({
                selectedServer: serverDetails,
                selectedServerName: serverDetails.name,
                selectedServerDescription: serverDetails.description,
                channels: serverDetails.channels,
                members: serverDetails.members,
                serverDetailsLoading: false,
                cachedServers: new Map(state.cachedServers).set(serverId, serverDetails), // add to cache
              }));
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
    } else {
      // serverId is null (deselecting server)
      set({
        selectedServerId: null,
        selectedServer: null,
        selectedServerName: null,
        selectedServerDescription: null,
        channels: [],
        members: [],
        selectedChannelId: null,
        serverDetailsLoading: false,
        serverDetailsError: null,
      });
    }
  },

  selectChannel: (channelId: string | null) => {
    set({ selectedChannelId: channelId });

    if (channelId) {
      const selectedChannel = get().selectedServer?.channels.find((channel) => channel.id === channelId);
      set({ selectedChannel: selectedChannel || null });
    } else {
      set({ selectedChannel: null });
    }
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

  createChannel: async (name) => {
    const selectedServerId = get().selectedServerId;

    if (!selectedServerId) {
      toast.error('Nie wybrano serwera.');
      return null;
    }

    try {
      const newChannel = await channelService.createChannel({ serverId: selectedServerId, ...name });

      if (newChannel) {
        set((state) => ({ channels: [...state.channels, newChannel] }));
        set((state) => ({
          selectedServer: state.selectedServer ? {
            ...state.selectedServer,
            channels: [...(state.selectedServer.channels || []), newChannel]
          } : null
        }));

        // update cached server details
        if (selectedServerId) {
          set((state) => {
            const cachedServers = new Map(state.cachedServers);
            const cachedServer = cachedServers.get(selectedServerId);
            if (cachedServer) {
              cachedServers.set(selectedServerId, {
                ...cachedServer,
                channels: [...cachedServer.channels, newChannel]
              });
            }
            return { cachedServers };
          });
        }
        return newChannel;
      }
      return null;
    } catch (error) {
        toast.error('Nie udało się utworzyć kanału.');
        console.error("Error creating channel:", error);
      return null;
    }
  },

  deleteChannel: async (channelId: string) => {
    try {
      await channelService.deleteChannel(channelId);
      
      // remove the channel from the selected server's channels
      if (get().selectedChannelId === channelId) {
        const remainingChannels = get().channels.filter(channel => channel.id !== channelId);
        
        if (remainingChannels.length > 0) {
          get().selectChannel(remainingChannels[0].id);
        } else {
          get().selectChannel(null);
        }
      }
      
      // remove the channel from the cached server details
      const serverId = get().selectedServerId;

      if (serverId) {
        set((state) => {
          const cachedServers = new Map(state.cachedServers);
          const cachedServer = cachedServers.get(serverId);
          if (cachedServer) {
          cachedServers.set(serverId, {
          ...cachedServer,
          channels: cachedServer.channels.filter((channel) => channel.id !== channelId)
        });
          }
          return { cachedServers };
        });
      }

      set((state) => ({
        channels: state.channels.filter((channel) => channel.id !== channelId),
      }));

      set((state) => ({
          selectedServer: state.selectedServer ? {
          ...state.selectedServer,
          channels: state.selectedServer.channels.filter((channel) => channel.id !== channelId)
        } : null
      }));

      toast.success('Kanał został usunięty.');
    } catch (error) {
      toast.error('Nie udało się usunąć kanału.');
      console.error("Error deleting channel:", error);
    }
  },


}));
import { create } from 'zustand';
import { Server, ServerDetails } from '@/types/server.types';
import { Channel } from '@/types/channel.types';
import { serverService } from '@/services/serverService';
import { toast } from 'sonner';
import { channelService } from '@/services/channelService';
import { ServerMessage } from '@/types/server-message.type';
import { serverMessageService } from '@/services/serverMessageService';
import { User } from '@/types/user.type';
import { userService } from '@/services/userService';
import { joinServerGroup, leaveServerGroup } from '@/services/signalrService';

interface AppState {
  servers: Server[];
  serversLoading: boolean;
  serversError: string | null;
  fetchServers: () => Promise<void>;

  selectedServerId: string | null;
  selectedServer: ServerDetails | null;

  serverDetailsLoading: boolean;
  serverDetailsError: string | null;

  cachedServers: Map<string, ServerDetails>;
  selectServer: (serverId: string | null) => Promise<void>;

  selectedChannelId: string | null;
  selectedChannel: Channel | null;
  selectedChannelMessages: ServerMessage[];
  channelMessagesLoading: boolean;
  channelMessagesError: string | null;
  cachedChannelMessages: Map<string, ServerMessage[]>;

  selectChannel: (channelId: string | null) => void;

  createServer: (newServerData: Omit<Server, 'id' | 'ownerId' | 'description'> & { description?: string }) => Promise<Server | null>;
  joinServer: (inviteCode: string) => Promise<ServerDetails | null>;
  leaveServer: (serverId: string) => Promise<void>;
  leaveServerAction: (serverId: string) => Promise<void>;
  kickUser: (serverId: string, userId: string) => Promise<void>;
  addUserToServer: (serverId: string, user: User) => void;
  removeUserFromServer: (serverId: string, userId: string) => void;

  addChannel: (serverId: string, channel: Channel) => Promise<void>;
  createChannel: (newChannelData: Omit<Channel, 'id'>) => Promise<Channel | null>;
  updateChannel: (serverId: string, channel: Channel) => void;
  removeChannel: (serverId: string, channelId: string) => void;

  addMessageToChannel: (serverId: string, message: ServerMessage) => void;
  sendMessage: (channelId: string, message: string) => Promise<ServerMessage | null>;
  removeMessageFromChannel: (serverId: string, channelId: string, messageId: string) => void;
  editMessageInChannel: (serverId: string, message: ServerMessage) => void;

  getMeInfo: () => Promise<User | null>;
  clearStore: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  servers: [],
  serversLoading: false,
  serversError: null,

  selectedServerId: null,
  selectedServer: null,

  serverDetailsLoading: false,
  serverDetailsError: null,

  selectedChannelId: null,
  selectedChannel: null,
  selectedChannelMessages: [],
  channelMessagesLoading: false,
  channelMessagesError: null,
  cachedChannelMessages: new Map(),

  cachedServers: new Map(),

  fetchServers: async () => {
    set({ serversLoading: true, serversError: null });
    try {
      const fetchedServers = await serverService.getAll();
      console.log("[initSR] servers in state:", get().servers.length);
      set({ servers: fetchedServers, serversLoading: false });
    } catch (error) {
      console.error("Error fetching servers:", error);
      set({ serversError: 'Nie udało się pobrać listy serwerów.', serversLoading: false });
    }
  },

  selectServer: async (serverId: string | null) => {
    const currentSelectedServerId = get().selectedServerId;

    if (currentSelectedServerId === serverId) {
      return;
    }

    const commonStateChanges = {
      selectedChannelId: null,
      selectedChannel: null,
      selectedChannelMessages: [],
      channelMessagesLoading: false,
      channelMessagesError: null,
    };

    if (serverId) {
      const cachedDetails = get().cachedServers.get(serverId);

      // cache hit
      if (cachedDetails) {
        set({
          selectedServerId: serverId,
          selectedServer: cachedDetails,
          serverDetailsLoading: false,
          serverDetailsError: null,
          ...commonStateChanges
        });

        // cache miss
      } else {
        set({
          selectedServerId: serverId,
          selectedServer: null,
          serverDetailsLoading: true,
          serverDetailsError: null,
          ...commonStateChanges
        });

        serverService.getById(serverId).then(details => { // fetch server details
          set(state => {
            const newCachedServers = new Map(state.cachedServers).set(serverId, details);
            if (state.selectedServerId === serverId) {
              return {
                selectedServer: details,
                serverDetailsLoading: false,
                serverDetailsError: null,
                cachedServers: newCachedServers
              };
            }

            return { cachedServers: newCachedServers };
          });

        }).catch(error => {
          console.error("Error fetching server details:", error);
          if (get().selectedServerId === serverId) {
            set({ serverDetailsError: 'Nie udało się załadować szczegółów serwera.', serverDetailsLoading: false });
            set({
              selectedServerId: null,
              selectedServer: null,
              ...commonStateChanges
            });
          }
        });
      }
    } else {
      set({
        selectedServerId: null,
        selectedServer: null,
        serverDetailsLoading: false,
        serverDetailsError: null,
        ...commonStateChanges
      });
    }
  },

  selectChannel: (channelId: string | null) => {

    // if the channelId is the same as the current one, do nothing
    if (get().selectedChannelId === channelId && channelId !== null) {
      return;
    }

    if (channelId && get().selectedServerId) {
      const basicChannelInfo = get().selectedServer?.channels.find(c => c.id === channelId);
      set({
        selectedChannelId: channelId,
        selectedChannel: basicChannelInfo || null,
        channelMessagesLoading: true,
        selectedChannelMessages: [],
        channelMessagesError: null,
      });

      const cachedMessages = get().cachedChannelMessages.get(channelId);
      if (cachedMessages) {
        set({
          selectedChannelMessages: cachedMessages,
          channelMessagesLoading: false,
        });
      } else {
        serverMessageService.getAll(channelId).then(fetchedMessages => {
          if (get().selectedChannelId === channelId) {
            set((state) => ({
              selectedChannelMessages: fetchedMessages,
              channelMessagesLoading: false,
              cachedChannelMessages: new Map(state.cachedChannelMessages).set(channelId, fetchedMessages),
            }));
          }
        }).catch(error => {
          console.error(`Error fetching messages for channel ${channelId}:`, error);
          toast.error('Nie udało się pobrać wiadomości kanału.');
          if (get().selectedChannelId === channelId) {
            set({ channelMessagesError: 'Nie udało się pobrać wiadomości.', channelMessagesLoading: false });
          }
        });
      }
    } else {
      set({
        selectedChannelId: null,
        selectedChannel: null,
        selectedChannelMessages: [],
        channelMessagesLoading: false,
        channelMessagesError: null,
      });
    }
  },

  createServer: async (newServerData) => {
    try {
      // creates server
      const newServer = await serverService.createServer({ ...newServerData, description: newServerData.description || '' });

      if (newServer) {
        set((state) => ({ servers: [...state.servers, newServer] }));
        get().selectServer(newServer.id);
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
      // joins server and creates a new server in the store
      const joinedServer = await serverService.joinServer(inviteCode);

      if (joinedServer) {
        const { id, name, description, ownerId } = joinedServer;
        set((state) => ({ servers: [...state.servers, { id, name, description, ownerId }] }));
        // cache the server details
        set((state) => {
          const newCachedServers = new Map(state.cachedServers);
          newCachedServers.set(joinedServer.id, joinedServer);
          return { cachedServers: newCachedServers };
        });
        joinServerGroup(joinedServer.id); // join the SignalR group for the server
        return joinedServer;
      }
      return null;

    } catch (error) {
      toast.error('Nie udało się dołączyć do serwera. Sprawdź nazwę serwera.');
      console.error("Error joining server:", error);
      return null;
    }
  },

  createChannel: async (newChannelData) => {
    try {
      const selectedServerId = get().selectedServerId;

      if (!selectedServerId) {
        toast.error('Nie wybrano serwera.');
        return null;
      }
      const newChannel = await channelService.createChannel({ serverId: selectedServerId, ...newChannelData });

      if (newChannel) {
        toast.success('Kanał został utworzony.');
        return newChannel;
      }
      return null;

    } catch (error) {
      toast.error('Nie udało się utworzyć kanału.');
      console.error("Error creating channel:", error);
      return null;
    }
  },

  removeChannel: async (serverId: string, channelId: string) => {

    // only update if the server is selected or cached
    if (get().selectedServerId === serverId || get().cachedServers.has(serverId)) {
      const wasSelectedChannel = get().selectedChannelId === channelId;

      set((state) => {
        const newCachedServers = new Map(state.cachedServers);
        const cachedServer = newCachedServers.get(serverId);

        if (cachedServer) {
          newCachedServers.set(serverId, {
            ...cachedServer,
            channels: cachedServer.channels.filter(c => c.id !== channelId)
          });
        }

        let newSelectedServer = state.selectedServer;
        if (state.selectedServerId === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            channels: state.selectedServer.channels.filter(c => c.id !== channelId)
          };
        }

        const newCachedChannelMessages = new Map(state.cachedChannelMessages);
        newCachedChannelMessages.delete(channelId);

        return {
          selectedServer: newSelectedServer,
          cachedServers: newCachedServers,
          cachedChannelMessages: newCachedChannelMessages,
        };
      });

      if (wasSelectedChannel && get().selectedServerId === serverId) {
        const currentSelectedServer = get().selectedServer;
        if (currentSelectedServer && currentSelectedServer.channels.length > 0) {
          get().selectChannel(currentSelectedServer.channels[0].id);
        } else {
          get().selectChannel(null);
        }
      }
    }
  },

  sendMessage: async (channelId, messageContent) => {
    try {
      const sentMessage = await serverMessageService.send(channelId, messageContent);

      return sentMessage;

    } catch (error) {
      toast.error('Nie udało się wysłać wiadomości.');
      console.error("Error sending message:", error);
      return null;
    }
  },

  removeMessageFromChannel: (serverId: string, channelId: string, messageId: string) => {
    set((state) => {

      // always update the cache for the channel
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const messages = newCachedChannelMessages.get(channelId) || [];
      const filteredMessages = messages.filter(m => m.id !== messageId);
      newCachedChannelMessages.set(channelId, filteredMessages);

      let newSelectedChannelMessages = state.selectedChannelMessages;

      // update selectedChannelMessages only if the message was in the currently selected channel AND server
      if (state.selectedChannelId === channelId && state.selectedServerId === serverId) {
        newSelectedChannelMessages = state.selectedChannelMessages.filter(m => m.id !== messageId);
      }

      return {
        selectedChannelMessages: newSelectedChannelMessages,
        cachedChannelMessages: newCachedChannelMessages,
      };
    });
  },

  editMessageInChannel: (serverId: string, message: ServerMessage) => {
    set((state) => {

      // update the cache for the message's channel, but only if the message is already cached
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const channelMessages = newCachedChannelMessages.get(message.channelId) || [];
      if (channelMessages.some(m => m.id === message.id)) {
        newCachedChannelMessages.set(message.channelId, channelMessages.map(m =>
          m.id === message.id ? message : m
        ));
      }

      let newSelectedChannelMessages = state.selectedChannelMessages;

      // update selectedChannelMessages only if the message is for the currently selected channel AND server
      if (state.selectedChannelId === message.channelId && state.selectedServerId === serverId) {
        newSelectedChannelMessages = state.selectedChannelMessages.map(m => m.id === message.id ? message : m);
      }

      return {
        selectedChannelMessages: newSelectedChannelMessages,
        cachedChannelMessages: newCachedChannelMessages
      };
    });
  },

  // this function is used when the user leaves the server by himself
  leaveServerAction: async (serverId) => {
    try {
      await serverService.leaveServer(serverId);
      get().leaveServer(serverId);
    }
    catch (error) {
      toast.error('Nie udało się opuścić serwera.');
      console.error("Error leaving server:", error);
    }
  },

  // this function should work both when the user leaves the server or is kicked
  leaveServer: async (serverId) => {
    try {

      leaveServerGroup(serverId); // leave the SignalR group for the server

      // remove server from state, cache, clear server channel messages
      // if the server was selected, select the first remaining server or null
      const wasSelectedServer = get().selectedServerId === serverId;
      const channelIdsToClear = get().cachedServers.get(serverId)?.channels.map(channel => channel.id) || [];

      set((state) => {
        const newServers = state.servers.filter(server => server.id !== serverId);
        const newCachedServers = new Map(state.cachedServers);
        newCachedServers.delete(serverId);

        const newCachedChannelMessages = new Map(state.cachedChannelMessages);
        if (channelIdsToClear.length > 0) {
          channelIdsToClear.forEach(chId => newCachedChannelMessages.delete(chId));
        }

        return {
          servers: newServers,
          cachedServers: newCachedServers,
          cachedChannelMessages: newCachedChannelMessages,
        };
      });

      if (wasSelectedServer) {
        const remainingServers = get().servers;
        if (remainingServers.length > 0) {
          get().selectServer(remainingServers[0].id);
        } else {
          get().selectServer(null);
        }
      }
      toast.success('Opuszczono serwer.');
    } catch (error) {
      toast.error('Nie udało się opuścić serwera.');
      console.error("Error leaving server:", error);
    }
  },

  kickUser: async (serverId: string, userId: string) => {
    try {
      await serverService.kickUser(serverId, userId);
      toast.success('Żądanie usunięcia użytkownika wysłane.');

    } catch (error) {
      toast.error('Nie udało się usunąć użytkownika z serwera.');
      console.error("Error kicking user:", error);
    }
  },

  clearStore: () => {
    set({
      servers: [],
      serversLoading: false,
      serversError: null,
      selectedServerId: null,
      selectedServer: null,
      serverDetailsLoading: false,
      serverDetailsError: null,
      cachedServers: new Map(),
      selectedChannelId: null,
      selectedChannel: null,
      selectedChannelMessages: [],
      channelMessagesLoading: false,
      channelMessagesError: null,
      cachedChannelMessages: new Map(),
    });
  },

  getMeInfo: async () => {
    try {
      const user = await userService.getMe();
      return user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  },

  addChannel: async (serverId: string, channel: Channel) => {

    // only update if the server is selected or cached
    if (get().selectedServerId === serverId || get().cachedServers.has(serverId)) {
      set((state) => {
        const newCachedServers = new Map(state.cachedServers);
        const cachedServer = newCachedServers.get(serverId);

        if (cachedServer) {
          newCachedServers.set(serverId, {
            ...cachedServer,
            channels: [...cachedServer.channels.filter(c => c.id !== channel.id), channel]
          });
        }

        let newSelectedServer = state.selectedServer;
        if (state.selectedServerId === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            channels: [...state.selectedServer.channels.filter(c => c.id !== channel.id), channel]
          };
        }
        return { selectedServer: newSelectedServer, cachedServers: newCachedServers };
      });
    }
  },

  addMessageToChannel: (serverId: string, message: ServerMessage) => {
    set((state) => {

      // always update the cache for the message's channel
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const channelMessages = newCachedChannelMessages.get(message.channelId) || [];

      // check if the message already exists in the cache
      // if it doesn't, add it to the cache
      const exists = channelMessages.some(m => m.id === message.id);
      if (!exists) {
        newCachedChannelMessages.set(message.channelId, [...channelMessages, message]);
      }

      let newSelectedChannelMessages = state.selectedChannelMessages;

      // update selectedChannelMessages only if the message is for the currently selected channel AND server
      if (state.selectedChannelId === message.channelId && state.selectedServerId === serverId) {
        newSelectedChannelMessages = [...state.selectedChannelMessages, message];
      }

      return {
        selectedChannelMessages: newSelectedChannelMessages,
        cachedChannelMessages: newCachedChannelMessages
      };
    });
  },

  updateChannel: (serverId: string, channel: Channel) => {

    // only update if the server is selected or cached
    if (get().selectedServerId === serverId || get().cachedServers.has(serverId)) {
      set((state) => {
        const newCachedServers = new Map(state.cachedServers);
        const cachedServer = newCachedServers.get(serverId);

        if (cachedServer) {
          newCachedServers.set(serverId, {
            ...cachedServer,
            channels: cachedServer.channels.map(c => c.id === channel.id ? channel : c)
          });
        }

        let newSelectedServer = state.selectedServer;
        if (state.selectedServerId === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            channels: state.selectedServer.channels.map(c => c.id === channel.id ? channel : c)
          };
        }

        let newSelectedChannel = state.selectedChannel;
        if (state.selectedChannelId === channel.id) {
          newSelectedChannel = channel;
        }

        return { selectedServer: newSelectedServer, cachedServers: newCachedServers, selectedChannel: newSelectedChannel };
      });
    }
  },

  addUserToServer: (serverId: string, user: User) => {

    // only update if the server is selected or cached (if server is not cached full info will be fetched)
    if (get().selectedServerId === serverId || get().cachedServers.has(serverId)) {
      set((state) => {
        const newCachedServers = new Map(state.cachedServers);
        const cachedServer = newCachedServers.get(serverId);

        if (cachedServer) {
          newCachedServers.set(serverId, {
            ...cachedServer,
            members: [...cachedServer.members.filter(m => m.id !== user.id), user]
          });
        }

        let newSelectedServer = state.selectedServer;
        if (state.selectedServerId === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            members: [...state.selectedServer.members.filter(m => m.id !== user.id), user]
          };
        }
        return { selectedServer: newSelectedServer, cachedServers: newCachedServers };
      });
    }
  },

  removeUserFromServer: async (serverId: string, userId: string) => {

    // if the user that left is the current user, leave the server (this is the case when the user is kicked)
    const currentUser = await get().getMeInfo();
    if (currentUser && currentUser.id === userId) {
      get().leaveServer(serverId);
      return;
    }

    // only update if the server is selected or cached
    if (get().selectedServerId === serverId || get().cachedServers.has(serverId)) {
      set((state) => {
        const newCachedServers = new Map(state.cachedServers);
        const cachedServer = newCachedServers.get(serverId);

        if (cachedServer) {
          newCachedServers.set(serverId, {
            ...cachedServer,
            members: cachedServer.members.filter(member => member.id !== userId)
          });
        }

        let newSelectedServer = state.selectedServer;
        if (state.selectedServerId === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            members: state.selectedServer.members.filter(member => member.id !== userId)
          };
        }
        return { selectedServer: newSelectedServer, cachedServers: newCachedServers };
      });
    }
  },
}));

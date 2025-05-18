import { create } from 'zustand';
import { Server, ServerDetails } from '@/types/server.types';
import { Channel } from '@/types/channel.types';
import { serverService } from '@/services/serverService';
import { toast } from 'sonner';
import { channelService } from '@/services/channelService';
import { ServerMessage } from '@/types/server-message.type';
import { serverMessageService } from '@/services/serverMessageService';

interface AppState {
  servers: Server[]; // list of all servers that user is a member of (basic info)
  serversLoading: boolean;
  serversError: string | null;
  fetchServers: () => Promise<void>;

  selectedServerId: string | null; // ID of the currently selected server
  selectedServer: ServerDetails | null; // details of the currently selected server (STORES SERVER DEATILS, CHANNELS, MEMBERS AND SHOULD BE USED AS A SINGLE SOURCE OF TRUTH)

  serverDetailsLoading: boolean;
  serverDetailsError: string | null;

  cachedServers: Map<string, ServerDetails>; // cache for server details that user has already fetched
  selectServer: (serverId: string | null) => void;

  selectedChannelId: string | null; // ID of the currently selected channel
  selectedChannel: Channel | null; // details of the currently selected channel
  selectedChannelMessages: ServerMessage[]; // messages of the currently selected channel
  channelMessagesLoading: boolean; // loading state for channel messages
  channelMessagesError: string | null; // error state for channel messages
  cachedChannelMessages: Map<string, ServerMessage[]>; // cache for channel messages

  selectChannel: (channelId: string | null) => void;

  createServer: (newServerData: Omit<Server, 'id' | 'ownerId' | 'description'> & { description?: string }) => Promise<Server | null>;
  joinServer: (inviteCode: string) => Promise<Server | null>;
  leaveServer: (serverId: string) => Promise<void>;
  kickUser: (serverId: string, userId: string) => Promise<void>;

  createChannel: (newChannelData: Omit<Channel, 'id'>) => Promise<Channel | null>;
  deleteChannel: (channelId: string) => Promise<void>;

  sendMessage: (channelId: string, message: string) => Promise<ServerMessage | null>;

  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, message: string) => Promise<ServerMessage | null>;

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

    // reset channel-related state whenever the server changes or is deselected.
    const commonStateChanges = {
      selectedChannelId: null,
      selectedChannel: null,
      selectedChannelMessages: [],
      channelMessagesLoading: false,
      channelMessagesError: null,
    };

    if (serverId) {
      const cachedDetails = get().cachedServers.get(serverId);

      if (cachedDetails) {
        // cache hit for server details
        set({
          selectedServerId: serverId,
          selectedServer: cachedDetails,
          serverDetailsLoading: false,
          serverDetailsError: null,
          ...commonStateChanges
        });
      } else {
        // cache miss for server details, fetch them
        set({
          selectedServerId: serverId,
          selectedServer: null,
          serverDetailsLoading: true,
          serverDetailsError: null,
          ...commonStateChanges
        });
        serverService.getById(serverId).then(details => {
          get().cachedServers.set(serverId, details);

          if (get().selectedServerId === serverId) {
            set({ selectedServer: details, serverDetailsLoading: false });
          }
        }).catch(error => {
          console.error("Error fetching server details:", error);
          if (get().selectedServerId === serverId) {
            set({ serverDetailsError: 'Nie udało się załadować szczegółów serwera.', serverDetailsLoading: false });
          }
        });
      }
    } else {
      // serverId is null (deselecting server)
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
    if (get().selectedChannelId === channelId && channelId !== null) {
      return;
    }

    if (channelId && get().selectedServerId) {
      const basicChannelInfo = get().selectedServer?.channels.find(c => c.id === channelId);
      set({
        selectedChannelId: channelId,
        selectedChannel: basicChannelInfo || null,
        channelMessagesLoading: true,
        selectedChannelMessages: [], // clear previous messages
        channelMessagesError: null,
      });

      const cachedMessages = get().cachedChannelMessages.get(channelId);

      if (cachedMessages) {
        // cache hit for messages
        set({
          selectedChannelMessages: cachedMessages,
          channelMessagesLoading: false,
        });
      } else {
        // cache miss for messages, fetch them
        const fetchMessages = async () => {
          try {
            const fetchedMessages = await serverMessageService.getAll(channelId);

            if (get().selectedChannelId === channelId) {
              set((state) => ({
                selectedChannelMessages: fetchedMessages,
                channelMessagesLoading: false,
                cachedChannelMessages: new Map(state.cachedChannelMessages).set(channelId, fetchedMessages),
              }));
            }
          } catch (error) {
            console.error(`Error fetching messages for channel ${channelId}:`, error);
            toast.error('Nie udało się pobrać wiadomości kanału.');

            if (get().selectedChannelId === channelId) {
              set({ channelMessagesError: 'Nie udało się pobrać wiadomości.', channelMessagesLoading: false });
            }
          }
        };
        fetchMessages();
      }
    } else {
      // deselecting channel
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
      if (get().selectedChannelId === channelId && get().selectedServer) {
        const remainingChannels = get().selectedServer!.channels.filter(channel => channel.id !== channelId);

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

      // remove the channel from the selected server's channels
      set((state) => ({
        selectedServer: state.selectedServer ? {
          ...state.selectedServer,
          channels: state.selectedServer.channels.filter((channel) => channel.id !== channelId)
        } : null
      }));

      // filter out the messages from the cached messages
      set((state) => {
        const cachedChannelMessages = new Map(state.cachedChannelMessages);
        cachedChannelMessages.delete(channelId);
        return { cachedChannelMessages };
      }
      );

      toast.success('Kanał został usunięty.');
    } catch (error) {
      toast.error('Nie udało się usunąć kanału.');
      console.error("Error deleting channel:", error);
    }
  },

  sendMessage: async (channelId, message) => {
    try {
      const sentMessage = await serverMessageService.send(channelId, message);

      if (sentMessage) {
        set((state) => ({
          selectedChannelMessages: [...state.selectedChannelMessages, sentMessage]
        }));

        console.log("Sent message:", sentMessage);

        // update cached messages
        set((state) => {
          const cachedChannelMessages = new Map(state.cachedChannelMessages);
          const cachedMessages = cachedChannelMessages.get(channelId) || [];
          cachedMessages.push(sentMessage);
          cachedChannelMessages.set(channelId, cachedMessages);
          return { cachedChannelMessages };
        });
        
        return sentMessage;
      }
      return null;
    } catch (error) {
      toast.error('Nie udało się wysłać wiadomości.');
      console.error("Error sending message:", error);
      return null;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await serverMessageService.delete(messageId);

      // remove the message from the selected channel's messages
      set((state) => ({
        selectedChannelMessages: state.selectedChannelMessages.filter(message => message.id !== messageId)
      }));

      // update cached messages
      const channelId = get().selectedChannelId;
      if (channelId) {
        set((state) => {
          const cachedChannelMessages = new Map(state.cachedChannelMessages);
          const cachedMessages = cachedChannelMessages.get(channelId) || [];
          cachedChannelMessages.set(channelId, cachedMessages.filter(message => message.id !== messageId));
          return { cachedChannelMessages };
        });
      }

      toast.success('Wiadomość została usunięta.');
    } catch (error) {
      toast.error('Nie udało się usunąć wiadomości.');
      console.error("Error deleting message:", error);
    }
  },

  editMessage: async (messageId, message) => {
    try {
      const editedMessage = await serverMessageService.edit(messageId, message);

      if (editedMessage) {
        set((state) => ({
          selectedChannelMessages: state.selectedChannelMessages.map(msg =>
            msg.id === messageId ? { ...msg, message: editedMessage.message, isEdited: true } : msg
          )
        }));

        // update cached messages
        const channelId = get().selectedChannelId;
        if (channelId) {
          set((state) => {
            const cachedChannelMessages = new Map(state.cachedChannelMessages);
            const cachedMessages = cachedChannelMessages.get(channelId) || [];
            cachedChannelMessages.set(channelId, cachedMessages.map(msg =>
              msg.id === messageId ? { ...msg, message: editedMessage.message, isEdited: true } : msg
            ));
            return { cachedChannelMessages };
          });
        }

        return editedMessage;
      }
      return null;
    } catch (error) {
      toast.error('Nie udało się edytować wiadomości.');
      console.error("Error editing message:", error);
      return null;
    }
  },

  clearStore: () => set({
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
  }),

  leaveServer: async (serverId) => {
    try {
      await serverService.leaveServer(serverId);

      const wasSelectedServer = get().selectedServerId === serverId;

      // get channel IDs from the cache for the server being left.
      const channelIdsToClear = get().cachedServers.get(serverId)?.channels.map(channel => channel.id) || [];

      // remove the server from the main servers list
      set((state) => ({
        servers: state.servers.filter(server => server.id !== serverId)
      }));

      // remove server from cached servers
      set((state) => {
        const cachedServers = new Map(state.cachedServers);
        cachedServers.delete(serverId);
        return { cachedServers };
      });

      // remove messages from the cache that were associated with the server being left
      if (channelIdsToClear.length > 0) {
        set((state) => {
          const cachedChannelMessages = new Map(state.cachedChannelMessages);
          channelIdsToClear.forEach(channelId => {
            cachedChannelMessages.delete(channelId);
          });
          return { cachedChannelMessages };
        });
      }

      // if the server being left was the currently selected one, select a new server.
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

  kickUser: async (serverId, userId) => {
    try {
      await serverService.kickUser(serverId, userId);
      
      // remove the user from the server's members list
      if(get().selectedServerId === serverId) {
        set((state) => ({
          selectedServer: {
            ...state.selectedServer!,
            members: state.selectedServer!.members.filter(member => member.id !== userId)
          }
        }));
      }

      // remove the user from the cached server details
      set((state) => {
        const cachedServers = new Map(state.cachedServers);
        const cachedServer = cachedServers.get(serverId);
        if (cachedServer) {
          cachedServers.set(serverId, {
            ...cachedServer,
            members: cachedServer.members.filter(member => member.id !== userId)
          });
        }
        return { cachedServers };
      });

    } catch (error) {
      toast.error('Nie udało się usunąć użytkownika z serwera.');
      console.error("Error kicking user:", error);
    }
  }

  }));
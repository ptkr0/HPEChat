// over 700 lines of code
// i am afraid of this store

import { StateCreator } from 'zustand';
import { Server, ServerDetails } from '@/types/server.types';
import { Channel } from '@/types/channel.types';
import { serverService } from '@/services/serverService';
import { channelService } from '@/services/channelService';
import { ServerMessage } from '@/types/server-message.type';
import { serverMessageService } from '@/services/serverMessageService';
import { User } from '@/types/user.type';
import { userService } from '@/services/userService';
import { joinServerGroup, leaveServerGroup } from '@/services/signalrService';
import { AppState } from './useAppStore';

export interface ServerSlice {
  servers: Server[];
  serversLoading: boolean;
  serversError: string | null;
  fetchServers: () => Promise<void>;

  selectedServer: ServerDetails | null;

  serverDetailsLoading: boolean;
  serverDetailsError: string | null;

  cachedServers: Map<string, ServerDetails>;
  selectServer: (serverId: string | null) => Promise<void>;

  selectedChannel: Channel | null;
  selectedChannelMessages: ServerMessage[];
  channelMessagesLoading: boolean;
  channelMessagesError: string | null;
  cachedChannelMessages: Map<string, ServerMessage[]>; // map of all cached server messages (channelId -> messages array)

  selectChannel: (channelId: string | null) => void;

  createServer: (name: string, description?: string, image?: File) => Promise<Server | null>;
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

  changeAvatar: (user: User) => Promise<void>;
  changeUsername: (user: User, newUsername: string) => Promise<void>;
}

export const createServerSlice: StateCreator<AppState, [], [], ServerSlice> = (set, get) => ({
  servers: [],
  serversLoading: false,
  serversError: null,

  selectedServer: null,

  serverDetailsLoading: false,
  serverDetailsError: null,

  selectedChannel: null,
  selectedChannelMessages: [],
  channelMessagesLoading: false,
  channelMessagesError: null,
  cachedChannelMessages: new Map(),

  cachedServers: new Map(),

  fetchServers: async (initialServerId?: string) => {
    set({ serversLoading: true, serversError: null });
    try {
      const fetchedServers = await serverService.getAll();
      console.log("[initSR] servers in state:", get().servers.length);
      set({ servers: fetchedServers, serversLoading: false });

      fetchedServers.forEach(server => {
        if (server.image) { // if the server has an image, fetch and cache it
          get().fetchAndCacheServerImage(server.id, server.image);
        }
      });

      if (initialServerId) {
        get().selectServer(initialServerId);
      }
    } catch (error) {
      console.error("Error fetching servers:", error);
      set({ serversError: 'Nie udało się pobrać listy serwerów.', serversLoading: false });
    }
  },

  selectServer: async (serverId: string | null) => {

    // function to process server members avatars (fetch and cache them if not already cached)
    // it will be changed to more elegant way (lazy loading user images when component is in viewport)
    // but for now (small scale) it's enough
    const processServerMembersAvatars = (serverDetails: ServerDetails | null) => {
      if (serverDetails?.members) {
        serverDetails.members.forEach(member => {
          if (member.image && !get().avatarBlobs.has(member.id)) {
            get().fetchAndCacheAvatar(member);
          }
        });
      }
    };

    if (get().selectedServer?.id === serverId) {
      return;
    }

    const commonStateChanges = {
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
          selectedServer: cachedDetails,
          serverDetailsLoading: false,
          serverDetailsError: null,
          ...commonStateChanges
        });
        processServerMembersAvatars(cachedDetails);

        // cache miss
      } else {
        set({
          selectedServer: null,
          serverDetailsLoading: true,
          serverDetailsError: null,
          ...commonStateChanges
        });

        serverService.get(serverId).then(details => { // fetch server details
          set(state => {
            const newCachedServers = new Map(state.cachedServers).set(serverId, details);
            return {
              selectedServer: details,
              serverDetailsLoading: false,
              serverDetailsError: null,
              cachedServers: newCachedServers
            };
          });
          processServerMembersAvatars(details);

        }).catch(error => {
          console.error("Error fetching server details:", error);
          set({ serverDetailsError: 'Nie udało się załadować szczegółów serwera.', serverDetailsLoading: false });
        });
      }
    } else {
      set({
        selectedServer: null,
        serverDetailsLoading: false,
        serverDetailsError: null,
        ...commonStateChanges
      });
    }
  },

  selectChannel: (channelId: string | null) => {

    // if the channelId is the same as the current one, do nothing
    if (get().selectedChannel?.id === channelId && channelId !== null) {
      return;
    }

    if (channelId && get().selectedServer) {
      const basicChannelInfo = get().selectedServer?.channels.find(c => c.id === channelId);
      set({
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
          if (get().selectedChannel?.id === channelId) {
            set((state) => ({
              selectedChannelMessages: fetchedMessages,
              channelMessagesLoading: false,
              cachedChannelMessages: new Map(state.cachedChannelMessages).set(channelId, fetchedMessages),
            }));
          }
        }).catch(error => {
          console.error(`Error fetching messages for channel ${channelId}:`, error);

          if (get().selectedChannel?.id === channelId) {
            set({ channelMessagesError: 'Nie udało się pobrać wiadomości.', channelMessagesLoading: false });
          }
        });
      }
    } else {
      set({
        selectedChannel: null,
        selectedChannelMessages: [],
        channelMessagesLoading: false,
        channelMessagesError: null,
      });
    }
  },

  createServer: async (name: string, description?: string, image?: File) => {
    try {
      // creates server
      const newServer = await serverService.create(name, description, image);

      if (newServer) {
        set((state) => ({ servers: [...state.servers, newServer] }));
        get().selectServer(newServer.id);

        if (newServer.image) {
          get().fetchAndCacheServerImage(newServer.id, newServer.image);
        }
        joinServerGroup(newServer.id);
        return newServer;
      }
      return null;

    } catch (error) {
      console.error("Error creating server:", error);
      return null;
    }
  },

  joinServer: async (inviteCode) => {
    try {
      // joins server and creates a new server in the store
      const joinedServer = await serverService.join(inviteCode);

      if (joinedServer) {
        const { id, name, description, ownerId, image } = joinedServer;
        set((state) => ({ servers: [...state.servers, { id, name, description, ownerId, image }] }));
        // cache the server details
        set((state) => {
          const newCachedServers = new Map(state.cachedServers);
          newCachedServers.set(joinedServer.id, joinedServer);
          return { cachedServers: newCachedServers };
        });

        if (joinedServer?.members) {
          joinedServer.members.forEach(member => {
            if (member.image && !get().avatarBlobs.has(member.id)) {
              get().fetchAndCacheAvatar(member);
            }
          });
        }

        if (joinedServer.image && !get().serverImageBlobs.has(joinedServer.id)) {
          get().fetchAndCacheServerImage(joinedServer.id, joinedServer.image);
        }

        joinServerGroup(joinedServer.id); // join the SignalR group for the server
        return joinedServer;
      }
      return null;

    } catch (error) {
      console.error("Error joining server:", error);
      return null;
    }
  },

  createChannel: async (newChannelData) => {
    const selectedServer = get().selectedServer;
    if (!selectedServer || !selectedServer.id) return null;

    try {
      const newChannel = await channelService.create({ serverId: selectedServer.id, ...newChannelData });
      return newChannel ?? null;
    } catch (error) {
      console.error("Error creating channel:", error);
      return null;
    }
  },

  removeChannel: async (serverId: string, channelId: string) => {
    // Only update if the server is selected or cached
    if (!get().cachedServers.has(serverId) && get().selectedServer?.id !== serverId) return;

    const wasSelectedChannel = get().selectedChannel?.id === channelId;

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
      if (state.selectedServer?.id === serverId) {
        newSelectedServer = {
          ...state.selectedServer,
          channels: state.selectedServer.channels.filter(c => c.id !== channelId)
        };
      }

      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const messages = newCachedChannelMessages.get(channelId) || [];
      newCachedChannelMessages.delete(channelId);

      // Revoke attachment preview blobs for all messages that will be cleared
      messages.forEach(message => {
        if (message.attachment) {
          get().revokeAttachmentPreview(message.attachment.id);
        }
      });

      return {
        selectedServer: newSelectedServer,
        cachedServers: newCachedServers,
        cachedChannelMessages: newCachedChannelMessages,
      };
    });

    if (wasSelectedChannel && get().selectedServer?.id === serverId) {
      if (get().selectedServer?.channels.length) {
        get().selectChannel(get().selectedServer!.channels[0].id);
      } else {
        get().selectChannel(null);
      }
    }
  },

  sendMessage: async (channelId, messageContent) => {
    try {
      const sentMessage = await serverMessageService.send(channelId, messageContent);
      return sentMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  },

  removeMessageFromChannel: (serverId: string, channelId: string, messageId: string) => {
    set((state) => {

      // always update the cache for the channel
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const messages = newCachedChannelMessages.get(channelId) || [];

      const messageToRemove = messages.find(m => m.id === messageId);
      const filteredMessages = messages.filter(m => m.id !== messageId);

      newCachedChannelMessages.set(channelId, filteredMessages);
      
      // if message had attachment, revoke their URL
      if (messageToRemove?.attachment) {
        get().revokeAttachmentPreview(messageToRemove.attachment.id);
      }

      let newSelectedChannelMessages = state.selectedChannelMessages;

      // only update selectedChannelMessages if both the selected channel and server match,
      // to ensure consistency with other message update methods.
      if (state.selectedChannel?.id === channelId && state.selectedServer?.id === serverId) {
        newSelectedChannelMessages = state.selectedChannelMessages.filter(m => m.id !== messageId);
      }

      return {
        selectedChannelMessages: newSelectedChannelMessages,
        cachedChannelMessages: newCachedChannelMessages,
      };
    });
  },

  // edits the message but leaves the attachment unchanged
  editMessageInChannel: (serverId: string, message: Omit<ServerMessage, "attachment">) => {
    set((state) => {

      // update the cache for the message's channel, but only if the message is already cached
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const channelMessages = newCachedChannelMessages.get(message.channelId) || [];
      if (channelMessages.some(m => m.id === message.id)) {
        newCachedChannelMessages.set(message.channelId, channelMessages.map(m =>
          // ...m = original message, ...message = updated message, m.attachment = original attachment to keep it unchanged
          m.id === message.id ? { ...m, ...message, attachment: m.attachment } : m
        ));
      }

      let newSelectedChannelMessages = state.selectedChannelMessages;

      // update selectedChannelMessages only if the message is for the currently selected channel AND server
      if (state.selectedChannel?.id === message.channelId && state.selectedServer?.id === serverId) {
        newSelectedChannelMessages = state.selectedChannelMessages.map(m => 
          m.id === message.id ? { ...m, ...message, attachment: m.attachment } : m
        );
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
      await serverService.leave(serverId);
      get().leaveServer(serverId);
    }
    catch (error) {
      console.error("Error leaving server:", error);
    }
  },

  // this function should work both when the user leaves the server or is kicked
  leaveServer: async (serverId) => {
    try {

      leaveServerGroup(serverId); // leave the SignalR group for the server

      // remove server from state, cache, clear server channel messages
      // if the server was selected, select the first remaining server or null
      const wasSelectedServer = get().selectedServer?.id === serverId;
      const channelIdsToClear = get().cachedServers.get(serverId)?.channels.map(channel => channel.id) || [];

      set((state) => {
        const newServers = state.servers.filter(server => server.id !== serverId);
        const newCachedServers = new Map(state.cachedServers);
        newCachedServers.delete(serverId);
        const newCachedChannelMessages = new Map(state.cachedChannelMessages);
        const messagesToClear: ServerMessage[] = [];

        if (channelIdsToClear.length > 0) {
          channelIdsToClear.forEach(chId => {
            const messages = newCachedChannelMessages.get(chId) || [];
            messagesToClear.push(...messages);
            newCachedChannelMessages.delete(chId);
          });
        }

        // revoke attachment preview blobs for all messages that will be cleared
        messagesToClear.forEach(message => {
          if (message.attachment) {
            get().revokeAttachmentPreview(message.attachment.id);
          }
        });

        // revoke server image blob if it exists
        get().revokeServerImage(serverId);

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

    } catch (error) {
      console.error("Error leaving server:", error);
    }
  },

  kickUser: async (serverId: string, userId: string) => {
    try {
      await serverService.kick(serverId, userId);

    } catch (error) {
      console.error("Error kicking user:", error);
    }
  },

clearStore: () => {
  set({
    servers: [],
    serversLoading: false,
    serversError: null,
    selectedServer: null,
    serverDetailsLoading: false,
    serverDetailsError: null,
    cachedServers: new Map(),
    selectedChannel: null,
    selectedChannelMessages: [],
    channelMessagesLoading: false,
    channelMessagesError: null,
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
    if (get().selectedServer?.id === serverId || get().cachedServers.has(serverId)) {
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
        if (state.selectedServer?.id === serverId && state.selectedServer) {
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
      if (state.selectedChannel?.id === message.channelId && state.selectedServer?.id === serverId) {
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
    if (get().selectedServer?.id === serverId || get().cachedServers.has(serverId)) {
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
        if (state.selectedServer?.id === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            channels: state.selectedServer.channels.map(c => c.id === channel.id ? channel : c)
          };
        }

        let newSelectedChannel = state.selectedChannel;
        if (state.selectedChannel?.id === channel.id) {
          newSelectedChannel = channel;
        }

        return { selectedServer: newSelectedServer, cachedServers: newCachedServers, selectedChannel: newSelectedChannel };
      });
    }
  },

  addUserToServer: (serverId: string, user: User) => {

    // only update if the server is selected or cached (if server is not cached full info will be fetched)
    if (get().selectedServer?.id === serverId || get().cachedServers.has(serverId)) {
      set((state) => {
        const newCachedServers = new Map(state.cachedServers);
        const cachedServer = newCachedServers.get(serverId);

        if (cachedServer) {
          newCachedServers.set(serverId, {
            ...cachedServer,
            members: [...cachedServer.members.filter(m => m.id !== user.id), user]
          });
        }

        if (user.image && !get().avatarBlobs.has(user.id)) {
          get().fetchAndCacheAvatar(user);
        }

        let newSelectedServer = state.selectedServer;
        if (state.selectedServer?.id === serverId && state.selectedServer) {
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
    if (get().selectedServer?.id === serverId || get().cachedServers.has(serverId)) {
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
        if (state.selectedServer?.id === serverId && state.selectedServer) {
          newSelectedServer = {
            ...state.selectedServer,
            members: state.selectedServer.members.filter(member => member.id !== userId)
          };
        }
        return { selectedServer: newSelectedServer, cachedServers: newCachedServers };
      });
    }
  },

  changeAvatar: async (user: User) => {
    await get().revokeAvatar(user.id);

    if (user.image) {
      await get().fetchAndCacheAvatar(user);
    }
  },

  changeUsername: async (user, newUsername) => {
    set(state => {

      // update cached servers
      const newCachedServers = new Map(state.cachedServers);
      newCachedServers.forEach((server, serverId) => {
        if (server.members.some(member => member.id === user.id)) {
          const updatedMembers = server.members.map(member =>
            member.id === user.id ? { ...member, username: newUsername } : member
          );
          newCachedServers.set(serverId, { ...server, members: updatedMembers });
        }
      });

      // update currently selected server
      let newSelectedServer = state.selectedServer;
      if (state.selectedServer && newCachedServers.has(state.selectedServer.id)) {
        newSelectedServer = newCachedServers.get(state.selectedServer.id)!;
      }

      // update cached messages
      const newCachedMessages = new Map(state.cachedChannelMessages);
      newCachedMessages.forEach((messages, channelId) => {
        const updatedMessages = messages.map(message =>
          message.sender.id === user.id ? { ...message, sender: { ...message.sender, username: newUsername } } : message
        );
        newCachedMessages.set(channelId, updatedMessages);
      });

      // update currently selected channel messages
      let newSelectedChannelMessages = state.selectedChannelMessages;
      if (state.selectedChannel && newCachedMessages.has(state.selectedChannel.id)) {
        newSelectedChannelMessages = newCachedMessages.get(state.selectedChannel.id)!;
      }

      return {
        cachedServers: newCachedServers,
        selectedServer: newSelectedServer,
        cachedChannelMessages: newCachedMessages,
        selectedChannelMessages: newSelectedChannelMessages,
      };
    });
  },
});

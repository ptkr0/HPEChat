import { Channel } from "@/types/channel.types";
import { StateCreator } from "zustand";
import { AppState } from "./useAppStore";
import { serverMessageService } from "@/services/serverMessageService";

export interface ChannelSlice {
  selectedChannel: Channel | null;

  selectChannel: (channelId: string | null) => void;
  addChannel: (serverId: string, channel: Channel) => Promise<void>;
  updateChannel: (serverId: string, channel: Channel) => void;
  removeChannel: (serverId: string, channelId: string) => void;
  clearChannelSlice: () => void;
}

export const createChannelSlice: StateCreator<AppState, [], [], ChannelSlice> = (set, get) => ({
  selectedChannel: null,

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
        
      // If we have fewer than 50 cached messages, try to fetch more
      if (cachedMessages.length < 50) {
        serverMessageService.getAll(channelId).then(fetchedMessages => {
      if (get().selectedChannel?.id === channelId) {
        set((state) => ({
          selectedChannelMessages: fetchedMessages,
          cachedChannelMessages: new Map(state.cachedChannelMessages).set(channelId, fetchedMessages),
          hasMoreMessages: new Map(state.hasMoreMessages).set(channelId, fetchedMessages.length === 50),
        }));
      }
        }).catch(error => {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
        });
      } else {
        // We have 50 or more cached messages, assume there might be more
        set((state) => ({
      hasMoreMessages: new Map(state.hasMoreMessages).set(channelId, true),
        }));
      }
      } else {
        serverMessageService.getAll(channelId).then(fetchedMessages => {
          if (get().selectedChannel?.id === channelId) {
            set((state) => ({
              selectedChannelMessages: fetchedMessages,
              channelMessagesLoading: false,
              cachedChannelMessages: new Map(state.cachedChannelMessages).set(channelId, fetchedMessages),
              hasMoreMessages: new Map(state.hasMoreMessages).set(channelId, fetchedMessages.length === 50), // server fetches messages in batches of 50
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

  removeChannel: async (serverId: string, channelId: string) => {

    // only update if the server is selected or cached
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

      // revoke attachment preview blobs for all messages that will be cleared
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

  clearChannelSlice: () => {
    set(() => ({
      selectedChannel: null,
    }));
  },
});
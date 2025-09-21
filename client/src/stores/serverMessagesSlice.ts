import { ServerMessage } from "@/types/server-message.type";
import { StateCreator } from "zustand";
import { AppState } from "./useAppStore";
import { serverMessageService } from "@/services/serverMessageService";

export interface ServerMessagesSlice {
  selectedChannelMessages: ServerMessage[];
  channelMessagesLoading: boolean;
  channelMessagesError: string | null;
  cachedChannelMessages: Map<string, ServerMessage[]>; // map of all cached server messages (channelId -> messages array)
  hasMoreMessages: Map<string, boolean>; // map of channelId to whether there are more messages to load
  loadingMoreMessages: boolean;

  fetchChannelMessages: (channelId: string) => Promise<void>;
  fetchMoreMessages: (channelId: string) => Promise<void>;
  
  addMessageToChannel: (serverId: string, message: ServerMessage) => void;
  removeMessageFromChannel: (serverId: string, channelId: string, messageId: string) => void;
  editMessageInChannel: (serverId: string, message: ServerMessage) => void;
  
  clearChannelMessages: (channelId: string) => void;
  clearAllMessages: () => void;
}

export const createServerMessagesSlice: StateCreator<AppState, [], [], ServerMessagesSlice> = (set, get) => ({
  selectedChannelMessages: [],
  channelMessagesLoading: false,
  channelMessagesError: null,
  cachedChannelMessages: new Map(),
  hasMoreMessages: new Map(),
  loadingMoreMessages: false,

  fetchChannelMessages: async (channelId: string) => {
    set({
      channelMessagesLoading: true,
      channelMessagesError: null,
    });

    try {
      const fetchedMessages = await serverMessageService.getAll(channelId);
      
      set((state) => ({
        selectedChannelMessages: fetchedMessages,
        channelMessagesLoading: false,
        cachedChannelMessages: new Map(state.cachedChannelMessages).set(channelId, fetchedMessages),
        hasMoreMessages: new Map(state.hasMoreMessages).set(channelId, fetchedMessages.length === 50),
      }));
    } catch (error) {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
      
      set({
        channelMessagesError: 'Nie udało się pobrać wiadomości.',
        channelMessagesLoading: false
      });
    }
  },

  fetchMoreMessages: async (channelId: string) => {
    if (get().loadingMoreMessages || !get().hasMoreMessages.get(channelId)) {
      return;
    }

    const cachedMessages = get().cachedChannelMessages.get(channelId) || [];
    if (cachedMessages.length === 0) {
      return;
    }

    set({ loadingMoreMessages: true });

    try {
      const oldestMessage = cachedMessages.reduce((oldest, current) => 
        new Date(current.sentAt) < new Date(oldest.sentAt) ? current : oldest
      );
      
      const olderMessages = await serverMessageService.getAll(channelId, oldestMessage.sentAt); // fetch messages older than the oldest cached message
      const hasMore = olderMessages.length === 50; // 50 is the page size
      
      if (olderMessages.length > 0) {
        set(state => {
          // filter out any duplicates (could happen if messages came in the same time window)
          const existingMessageIds = new Set(cachedMessages.map(m => m.id));
          const uniqueOlderMessages = olderMessages.filter(m => !existingMessageIds.has(m.id));
          
          const newCachedMessages = [...cachedMessages, ...uniqueOlderMessages];
          const newCachedChannelMessages = new Map(state.cachedChannelMessages);
          newCachedChannelMessages.set(channelId, newCachedMessages);
          
          return {
            selectedChannelMessages: newCachedMessages,
            cachedChannelMessages: newCachedChannelMessages,
            hasMoreMessages: new Map(state.hasMoreMessages).set(channelId, hasMore),
            loadingMoreMessages: false
          };
        });
      } else {
        set(state => ({
          hasMoreMessages: new Map(state.hasMoreMessages).set(channelId, false),
          loadingMoreMessages: false
        }));
      }
    } catch (error) {
      console.error("Error fetching more messages:", error);
      set({ loadingMoreMessages: false });
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
        const messageExists = newSelectedChannelMessages.some(m => m.id === message.id);
        if (!messageExists) {
          newSelectedChannelMessages = [...newSelectedChannelMessages, message];
        }
      }

      return {
        selectedChannelMessages: newSelectedChannelMessages,
        cachedChannelMessages: newCachedChannelMessages
      };
    });
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

  editMessageInChannel: (serverId: string, message: ServerMessage) => {
    set((state) => {
      // update the cache for the message's channel, but only if the message is already cached
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      const channelMessages = newCachedChannelMessages.get(message.channelId) || [];
      
      if (channelMessages.some(m => m.id === message.id)) {
        newCachedChannelMessages.set(
          message.channelId, 
          channelMessages.map(m => m.id === message.id ? { ...m, ...message } : m)
        );
      }

      let newSelectedChannelMessages = state.selectedChannelMessages;

      // update selectedChannelMessages only if the message is for the currently selected channel AND server
      if (state.selectedChannel?.id === message.channelId && state.selectedServer?.id === serverId) {
        newSelectedChannelMessages = state.selectedChannelMessages.map(m => 
          m.id === message.id ? { ...m, ...message } : m
        );
      }

      return {
        selectedChannelMessages: newSelectedChannelMessages,
        cachedChannelMessages: newCachedChannelMessages
      };
    });
  },

  clearChannelMessages: (channelId: string) => {
    set((state) => {
      // get messages to clear for possible blob cleanup
      const messagesToClear = state.cachedChannelMessages.get(channelId) || [];

      // clean up attachment preview blobs
      messagesToClear.forEach(message => {
        if (message.attachment) {
          get().revokeAttachmentPreview(message.attachment.id);
        }
      });

      // update cache
      const newCachedChannelMessages = new Map(state.cachedChannelMessages);
      newCachedChannelMessages.delete(channelId);

      // update selected messages if they match the channel being cleared
      const newSelectedChannelMessages = 
        state.selectedChannel?.id === channelId ? [] : state.selectedChannelMessages;

      // update hasMoreMessages for the channel
      const newHasMoreMessages = new Map(state.hasMoreMessages);
      newHasMoreMessages.delete(channelId);

      return {
        cachedChannelMessages: newCachedChannelMessages,
        selectedChannelMessages: newSelectedChannelMessages,
        hasMoreMessages: newHasMoreMessages,
      };
    });
  },

  clearAllMessages: () => {
    set((state) => {
      // clean up attachment preview blobs for all cached messages
      state.cachedChannelMessages.forEach((messages) => {
        messages.forEach(message => {
          if (message.attachment) {
            get().revokeAttachmentPreview(message.attachment.id);
          }
        });
      });

      return {
        selectedChannelMessages: [],
        channelMessagesLoading: false,
        channelMessagesError: null,
        cachedChannelMessages: new Map(),
        hasMoreMessages: new Map(),
        loadingMoreMessages: false,
      };
    });
  },
});
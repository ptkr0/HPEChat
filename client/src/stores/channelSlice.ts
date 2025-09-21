import { Channel } from "@/types/channel.types";
import { StateCreator } from "zustand";
import { AppState } from "./useAppStore";

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
    // already selected
    if (get().selectedChannel?.id === channelId && channelId !== null) {
      return;
    }

    // reset selection
    if (!channelId || !get().selectedServer) {
      set({
        selectedChannel: null,
      });
      return;
    }

    // find channel info from selected server
    const selectedServer = get().selectedServer;
    const basicChannelInfo = selectedServer?.channels.find(c => c.id === channelId);
    if (!basicChannelInfo) {
      set({
        selectedChannel: null,
      });
      return;
    }

    set({
      selectedChannel: basicChannelInfo,
    });

    // notify the server messages slice that a new channel is selected
    if (get().fetchChannelMessages) {
      get().fetchChannelMessages(channelId);
    }
  },

  removeChannel: async (serverId: string, channelId: string) => {

    // only update if the server is selected or cached
    if (!get().cachedServers.has(serverId) && get().selectedServer?.id !== serverId) return;

    const wasSelectedChannel = get().selectedChannel?.id === channelId;

    // clear messages for the channel that will be removed
    if (get().clearChannelMessages) {
      get().clearChannelMessages(channelId);
    }

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

      return {
        selectedServer: newSelectedServer,
        cachedServers: newCachedServers,
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
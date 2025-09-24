import { StateCreator } from 'zustand';
import { Server, ServerDetails } from '@/types/server.types';
import { serverService } from '@/services/serverService';
import { User } from '@/types/user.type';
import { userService } from '@/services/userService';
import { joinServerGroup } from '@/services/signalrService';
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

  createServer: (name: string, description?: string, image?: File) => Promise<Server | null>;
  joinServer: (inviteCode: string) => Promise<ServerDetails | null>;
  updateServer: (server: Omit<ServerDetails, 'channels' | 'members'>) => Promise<Server | null>;
  leaveServer: (serverId: string) => Promise<void>;
  leaveServerAction: (serverId: string) => Promise<void>;
  kickUser: (serverId: string, userId: string) => Promise<void>;
  addUserToServer: (serverId: string, user: User) => void;
  removeUserFromServer: (serverId: string, userId: string) => void;

  clearServerSlice: () => void;

  changeAvatar: (user: User) => Promise<void>;
  changeUsernameOnServer: (user: User, newUsername: string) => Promise<void>;
}

export const createServerSlice: StateCreator<AppState, [], [], ServerSlice> = (set, get) => ({
  servers: [],
  serversLoading: false,
  serversError: null,

  selectedServer: null,

  serverDetailsLoading: false,
  serverDetailsError: null,

  cachedServers: new Map(),

  fetchServers: async (initialServerId?: string) => {
    set({ serversLoading: true, serversError: null });
    try {
      const fetchedServers = await serverService.getAll();
      console.log("[initSR] servers in state:", get().servers.length);
      set({ servers: fetchedServers, serversLoading: false });

      fetchedServers.forEach(server => {
        if (server.image) { // if the server has an image, fetch and cache it
          get().fetchAndCacheServerImage(server.id);
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



  createServer: async (name: string, description?: string, image?: File) => {
    try {
      // creates server
      const newServer = await serverService.create(name, description, image);

      if (newServer) {
        set((state) => ({ servers: [...state.servers, newServer] }));
        get().selectServer(newServer.id);

        if (newServer.image) {
          get().fetchAndCacheServerImage(newServer.id);
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
          get().fetchAndCacheServerImage(joinedServer.id);
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

  updateServer: async (server: Omit<ServerDetails, 'members' | 'channels'>) => {
    set((state) => {
      const oldServerData = state.servers.find((s) => s.id === server.id);

      // if server doesn't exist, simply return the current state.
      if (!oldServerData) {
        return state;
      }

      // handle server image updates
      if (oldServerData.image && !server.image) {
        // old server had image, but new one doesn't? delete old server image blob.
        get().revokeServerImage(oldServerData.id);
      } else if (
        server.image &&
        oldServerData.image !== server.image
      ) {
        // old server didn't have an image, or new one has a different one?
        // replace or fetch it.
        if (oldServerData.image) {
          get().revokeServerImage(oldServerData.id);
        }
        get().fetchAndCacheServerImage(server.id);
      }

      const newServerData = { ...oldServerData, ...server };

      // update the main servers array
      const newServers = state.servers.map((s) =>
        s.id === newServerData.id ? newServerData : s,
      );

      // update cached server data
      const newCachedServers = new Map(state.cachedServers);
      const prevCachedServer = newCachedServers.get(newServerData.id);

      if (prevCachedServer) {
        newCachedServers.set(newServerData.id, {
          ...prevCachedServer,
          ...newServerData,
          members: prevCachedServer.members,
          channels: prevCachedServer.channels,
        });
      }

      // update currently selected server if it is the one being updated
      let newSelectedServer = state.selectedServer;
      if (state.selectedServer?.id === server.id) {
        newSelectedServer = {
          ...state.selectedServer,
          ...server,
          members: state.selectedServer.members,
          channels: state.selectedServer.channels,
        };
      }

      return {
        servers: newServers,
        cachedServers: newCachedServers,
        selectedServer: newSelectedServer,
      };
    });

    return server;
  },

  // this function is used when the user leaves the server by himself
  leaveServerAction: async (serverId) => {
    try {
      await serverService.leave(serverId);
    }
    catch (error) {
      console.error("Error leaving server:", error);
    }
  },

  // this function should work both when the user leaves the server or is kicked
  leaveServer: async (serverId) => {
    try {

      // remove server from state, cache
      // if the server was selected, select the first remaining server or null
      const wasSelectedServer = get().selectedServer?.id === serverId;
      const channelIdsToClear = get().cachedServers.get(serverId)?.channels.map(channel => channel.id) || [];
      console.log(wasSelectedServer, serverId, get().selectedServer?.id);

      // notify the server messages slice to clear all messages for this server's channels
      if (channelIdsToClear.length > 0 && get().clearChannelMessages) {
        channelIdsToClear.forEach(channelId => {
          get().clearChannelMessages(channelId);
        });
      }

      set((state) => {
        const newServers = state.servers.filter(server => server.id !== serverId);
        const newCachedServers = new Map(state.cachedServers);
        newCachedServers.delete(serverId);

        // revoke server image blob if it exists
        get().revokeServerImage(serverId);

        return {
          servers: newServers,
          cachedServers: newCachedServers,
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

  clearServerSlice: () => {
    set({
      servers: [],
      serversLoading: false,
      serversError: null,
      selectedServer: null,
      serverDetailsLoading: false,
      serverDetailsError: null,
      cachedServers: new Map(),
    });
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
    const user = await userService.getMe();
    if (user && user.id === userId) {
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

  changeUsernameOnServer: async (user, newUsername) => {
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

      return {
        cachedServers: newCachedServers,
        selectedServer: newSelectedServer,
      };
    });
  },
});

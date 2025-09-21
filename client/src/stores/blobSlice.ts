import { StateCreator } from 'zustand';
import { User } from '@/types/user.type';
import { fileService } from '@/services/fileService';
import { AppState } from './useAppStore';

export interface BlobSlice {
  avatarBlobs: Map<string, string>;
  serverImageBlobs: Map<string, string>;
  attachmentPreviews: Map<string, string>;

  fetchAndCacheAvatar: (user: User) => Promise<void>;
  revokeAvatar: (userId: string) => void;

  fetchAndCacheServerImage: (serverId: string) => Promise<void>;
  revokeServerImage: (serverId: string) => void;

  fetchAndCacheAttachmentPreview: (attachmentId: string, previewName: string) => Promise<void>;
  revokeAttachmentPreview: (attachmentId: string) => void;

  clearBlobs: () => void;
}

export const createBlobSlice: StateCreator<AppState, [], [], BlobSlice> = (set, get) => ({
  avatarBlobs: new Map(),
  serverImageBlobs: new Map(),
  attachmentPreviews: new Map(),

  fetchAndCacheAvatar: async (user: User) => {
    if (!user.image || get().avatarBlobs.has(user.id)) return;
    try {
      const blob = await fileService.getAvatar(user.id);
      const blobUrl = URL.createObjectURL(blob);
      set((state: AppState) => ({
        avatarBlobs: new Map<string, string>(state.avatarBlobs).set(user.id, blobUrl),
      }));
    } catch (error) {
      console.error(`Error fetching avatar for user ${user.id}:`, error);
    }
  },

  revokeAvatar: (userId: string) => {
    set((state) => {
      const newAvatarBlobs = new Map(state.avatarBlobs);
      const blobUrl = newAvatarBlobs.get(userId);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        newAvatarBlobs.delete(userId);
      }
      return { avatarBlobs: newAvatarBlobs };
    });
  },

  fetchAndCacheServerImage: async (serverId: string) => {
    const server = get().servers?.find(s => s.id === serverId);
    if (!server?.image || get().serverImageBlobs.has(serverId)) return;
    try {
      const blob = await fileService.getServerImage(server.id);
      const blobUrl = URL.createObjectURL(blob);
      set((state) => ({
        serverImageBlobs: new Map(state.serverImageBlobs).set(serverId, blobUrl),
      }));
    } catch (error) {
      console.error(`Error fetching image for server ${serverId}:`, error);
    }
  },
  
  revokeServerImage: (serverId: string) => {
    set((state) => {
      const newServerImageBlobs = new Map(state.serverImageBlobs);
      const blobUrl = newServerImageBlobs.get(serverId);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        newServerImageBlobs.delete(serverId);
      }
      return { serverImageBlobs: newServerImageBlobs };
    });
  },

  fetchAndCacheAttachmentPreview: async (attachmentId, previewName) => {
    if (get().attachmentPreviews.has(attachmentId)) return;
    try {
      const blob = await fileService.getServerPreview(previewName);
      const blobUrl = URL.createObjectURL(blob);
      set((state) => ({
        attachmentPreviews: new Map(state.attachmentPreviews).set(attachmentId, blobUrl),
      }));
    } catch (error) {
      console.error("Failed to fetch attachment preview:", error);
    }
  },

  revokeAttachmentPreview: (attachmentId: string) => {
    set((state: AppState) => {
      const newPreviews: Map<string, string> = new Map(state.attachmentPreviews);
      const blobUrl: string | undefined = newPreviews.get(attachmentId);
      if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      newPreviews.delete(attachmentId);
      }
      return { attachmentPreviews: newPreviews };
    });
  },

  clearBlobs: () => {
    get().avatarBlobs.forEach(URL.revokeObjectURL);
    get().serverImageBlobs.forEach(URL.revokeObjectURL);
    get().attachmentPreviews.forEach(URL.revokeObjectURL);
    set({
      avatarBlobs: new Map(),
      serverImageBlobs: new Map(),
      attachmentPreviews: new Map(),
    });
  },
});
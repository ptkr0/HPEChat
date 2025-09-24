import { create } from 'zustand';
import { ServerSlice, createServerSlice } from './serverSlice';
import { BlobSlice, createBlobSlice } from './blobSlice';
import { ChannelSlice, createChannelSlice } from './channelSlice';
import { ServerMessagesSlice, createServerMessagesSlice } from './serverMessagesSlice';

// combine the types for the complete state
export type AppState = ServerSlice & BlobSlice & ChannelSlice & ServerMessagesSlice & {
  clearStore: () => void;
};

export const useAppStore = create<AppState>()((...a) => ({
  ...createServerSlice(...a),
  ...createBlobSlice(...a),
  ...createChannelSlice(...a),
  ...createServerMessagesSlice(...a),

  clearStore: () => {
    a[1]().clearServerSlice();
    a[1]().clearBlobs();
    a[1]().clearChannelSlice();
    a[1]().clearAllMessages();
  }
}));
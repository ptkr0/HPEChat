import { create } from 'zustand';
import { ServerSlice, createServerSlice } from './serverSlice';
import { BlobSlice, createBlobSlice } from './blobSlice';
import { ChannelSlice, createChannelSlice } from './channelSlice';

// combine the types for the complete state
export type AppState = ServerSlice & BlobSlice & ChannelSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createServerSlice(...a),
  ...createBlobSlice(...a),
  ...createChannelSlice(...a),
}));
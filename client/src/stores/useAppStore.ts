import { create } from 'zustand';
import { ServerSlice, createServerSlice } from './serverSlice';
import { BlobSlice, createBlobSlice } from './blobSlice';

// Combine the types for the complete state
export type AppState = ServerSlice & BlobSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createServerSlice(...a),
  ...createBlobSlice(...a),
}));
import { axiosPrivate } from "@/api/axios";
import { Server, ServerDetails } from "@/types/server.types";
const SERVER_URL = "Server"


export const serverService = {
    getAll: async (): Promise<Server[]> => {
        const response = await axiosPrivate.get(SERVER_URL);
        return response.data;
    },

    getById: async (id: string): Promise<ServerDetails> => {
        const response = await axiosPrivate.get(`${SERVER_URL}/${id}`);
        return response.data;
    },

    createServer: async (newServerData: Omit<Server, 'id' | 'ownerId'>): Promise<Server> => {
        const response = await axiosPrivate.post(SERVER_URL, newServerData);
        return response.data;
    },

    joinServer: async (inviteCode: string): Promise<ServerDetails> => {
        const response = await axiosPrivate.post(`${SERVER_URL}/join/${ inviteCode }`);
        console.log(response.data);
        return response.data;
    },

    leaveServer: async (serverId: string): Promise<void> => {
        await axiosPrivate.delete(`${SERVER_URL}/leave/${serverId}`);
    },

    kickUser: async (serverId: string, userId: string): Promise<void> => {
        await axiosPrivate.delete(`${SERVER_URL}/kick/${serverId}/${userId}`);
    },

    deleteServer: async (serverId: string): Promise<void> => {
        await axiosPrivate.delete(`${SERVER_URL}/${serverId}`);
    }
};
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

    joinServer: async (inviteCode: string): Promise<Server> => {
        const response = await axiosPrivate.post(`${SERVER_URL}/join/${ inviteCode }`);
        return response.data;
    },
};
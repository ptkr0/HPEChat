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

    createServer: async (name: string, description?: string, image?: File): Promise<Server> => {
        const formData = new FormData();
        formData.append("Name", name);
        if (description) {
            formData.append("Description", description);
        }
        if (image) {
            formData.append("Image", image);
        }
        const response = await axiosPrivate.post(SERVER_URL, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        
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
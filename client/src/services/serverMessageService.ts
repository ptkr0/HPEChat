import { axiosPrivate } from "@/api/axios";
import { ServerMessage } from "@/types/server-message.type";
const SERVER_URL = "ServerMessage";

export const serverMessageService = {

    getAll: async (channelId: string, lastCreatedAt?: string): Promise<ServerMessage[]> => {
        const response = await axiosPrivate.get(`${SERVER_URL}?ChannelId=${channelId}`, {
            params: {
                "LastCreatedAt": lastCreatedAt
            }
        });
        return response.data;
    },
    
    delete: async (messageId: string): Promise<void> => {
        await axiosPrivate.delete(`${SERVER_URL}/${messageId}`);
    },

    edit: async (messageId: string, message: string): Promise<ServerMessage> => {
        const response = await axiosPrivate.patch(`${SERVER_URL}/${messageId}`, message);
        return response.data;
    },

    send: async (channelId: string, message: string, attachment?: File): Promise<ServerMessage> => {
        const formData = new FormData();
        formData.append("ChannelId", channelId);
        formData.append("Message", message);

        if (attachment){
            formData.append("Attachment", attachment);
        }
        
        const response = await axiosPrivate.post(SERVER_URL, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    }
}
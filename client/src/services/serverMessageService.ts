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
    
    send: async (channelId: string, message: string): Promise<ServerMessage> => {
        const response = await axiosPrivate.post(SERVER_URL, { channelId: channelId, message: message });
        return response.data;
    }
}
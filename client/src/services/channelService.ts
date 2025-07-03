import { axiosPrivate } from "@/api/axios";
import { Channel } from "@/types/channel.types";
const CHANNEL_URL = "Channel"


export const channelService = {

    get: async (id: string): Promise<Channel> => {
        const response = await axiosPrivate.get(`${CHANNEL_URL}/${id}`);
        return response.data;
    },

    create: async (newChannelData: { serverId: string; name: string }): Promise<Channel> => {
        const response = await axiosPrivate.post(CHANNEL_URL, newChannelData);
        return response.data;
    },

    delete: async (channelId: string): Promise<void> => {
        await axiosPrivate.delete(`${CHANNEL_URL}/${channelId}`);
    }
};
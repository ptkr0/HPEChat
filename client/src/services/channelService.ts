import { axiosPrivate } from "@/api/axios";
import { Channel } from "@/types/channel.types";
const CHANNEL_URL = "Channel"


export const channelService = {

    getById: async (id: string): Promise<Channel> => {
        const response = await axiosPrivate.get(`${CHANNEL_URL}/${id}`);
        return response.data;
    }
};
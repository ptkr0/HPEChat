import { axiosPrivate } from "@/api/axios";
const FILE_URL = "File";

export const fileService = {

    getAvatar: async (id: string): Promise<Blob> => {
        const response = await axiosPrivate.get(`${FILE_URL}/avatars/${id}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getServerImage: async (id: string): Promise<Blob> => {
        const response = await axiosPrivate.get(`${FILE_URL}/serverImages/${id}`, {
            responseType: 'blob',
        });
        return response.data;
    },

}
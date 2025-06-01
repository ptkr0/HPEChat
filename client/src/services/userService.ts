import { axiosPrivate } from "@/api/axios";
import { User } from "@/types/user.type";
const LOGIN_URL = "User/login"
const LOGOUT_URL = "User/logout"
const GETME_URL = "User/auth-test"


export const userService = {
    login: async (username: string, password: string): Promise<User> => {
        const response = await axiosPrivate.post(LOGIN_URL, { username, password });
        return response.data;
    },

    logout: async () => {
        const response = await axiosPrivate.post(LOGOUT_URL, {});
        return response.data;
    },

    getMe: async (): Promise<Omit<User, "imageBlob">> => {
        const response = await axiosPrivate.get(GETME_URL);
        return response.data;
    },

    register: async (username: string, password: string, avatar?: File): Promise<User> => {
        const formData = new FormData();
        formData.append("Username", username);
        formData.append("Password", password);
        if (avatar) {
            formData.append("Image", avatar);
        }

        const response = await axiosPrivate.post("User/register", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    }
};
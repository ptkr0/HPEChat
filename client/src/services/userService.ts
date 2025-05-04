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

    getMe: async (): Promise<User> => {
        const response = await axiosPrivate.get(GETME_URL);
        return response.data;
    }
};
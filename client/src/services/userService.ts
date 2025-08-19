import { axiosPrivate } from "@/api/axios";
import { User, UserResponse } from "@/types/user.type";
const LOGIN_URL = "User/login"
const LOGOUT_URL = "User/logout"
const GETME_URL = "User/auth-test"
const REGISTER_URL = "User/register"
const CHANGE_PASSWORD_URL = "User/password"
const CHANGE_USERNAME_URL = "User/username"
const CHANGE_AVATAR_URL = "User/avatar"


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
    },

    register: async (username: string, password: string, avatar?: File): Promise<User> => {
        const formData = new FormData();
        formData.append("Username", username);
        formData.append("Password", password);
        if (avatar) {
            formData.append("Image", avatar);
        }

        const response = await axiosPrivate.post(REGISTER_URL, formData);

        return response.data;
    },
    password: async (oldPassword: string, newPassword: string): Promise<string> => {
        const response = await axiosPrivate.put(CHANGE_PASSWORD_URL, {
            oldPassword,
            newPassword,
        });

        return response.data;
    },

    username: async (username: string): Promise<UserResponse> => {
        const response = await axiosPrivate.put(CHANGE_USERNAME_URL, username);
        return response.data;
    },

    avatar: async (avatar: File | null): Promise<UserResponse> => {
        const formData = new FormData();
        if (avatar) {
            formData.append("avatar", avatar);
        }

        const response = await axiosPrivate.put(CHANGE_AVATAR_URL, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    }
};
export type User = {
    id: string;
    username: string;
    role: string;
    image: string;
}

export type UserResponse = {
    message: string;
    user: User | null;
}
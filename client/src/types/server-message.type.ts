import { User } from "./user.type";

export type ServerMessage = {
    id: string;
    channelId: string;
    message: string;
    sentAt: string;
    isEdited: boolean;
    sender: User;
}
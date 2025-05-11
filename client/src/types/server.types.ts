import { Channel } from "./channel.types";
import { User } from "./user.type";

export type Server = {
    id: string;
    name: string;
    description: string;
    ownerId: string;
}

export type ServerDetails = {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    members: User[];
    channels: Channel[];
}
import { useRef, useState, useCallback } from "react";
import { HubConnectionBuilder, LogLevel, HubConnection } from "@microsoft/signalr";
import { useAppStore } from "@/stores/useAppStore";
import { User } from "@/types/user.type";
import { Channel } from "@/types/channel.types";
import { ServerMessage } from "@/types/server-message.type";
import { setSignalRConnection } from "@/services/signalrService";

const SERVER_HUB_URL = 'https://localhost:7056/hubs/server';
const USER_HUB_URL = 'https://localhost:7056/hubs/user';

const ServerEventNames = {
    MessageAdded: "MessageAdded",
    MessageEdited: "MessageEdited",
    MessageRemoved: "MessageRemoved",
    ChannelAdded: "ChannelAdded",
    ChannelRemoved: "ChannelRemoved",
    ChannelUpdated: "ChannelUpdated",
    UserJoined: "UserJoined",
    UserLeft: "UserLeft",
};

const UserEventNames = {
    UsernameChanged: "UsernameChanged",
    AvatarChanged: "AvatarChanged",
};

export const useSignalR = () => {
    const appStoreActions = useAppStore.getState();

    const serverConnectionRef = useRef<HubConnection | null>(null);
    const userConnectionRef = useRef<HubConnection | null>(null);

    const [isServerConnected, setIsServerConnected] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const [isUserConnected, setIsUserConnected] = useState(false);
    const [userError, setUserError] = useState<string | null>(null);

    const registerServerEventHandlers = useCallback((connection: HubConnection) => {
        Object.values(ServerEventNames).forEach(eventName => connection.off(eventName));

        connection.on(ServerEventNames.MessageAdded, (serverId: string, message: ServerMessage) => {
            appStoreActions.addMessageToChannel(serverId.toUpperCase(), { ...message, id: message.id.toUpperCase() });
        });
        connection.on(ServerEventNames.MessageEdited, (serverId: string, message: ServerMessage) => {
            appStoreActions.editMessageInChannel(serverId.toUpperCase(), { ...message, id: message.id.toUpperCase() });
        });
        connection.on(ServerEventNames.MessageRemoved, (serverId: string, channelId: string, messageId: string) => {
            appStoreActions.removeMessageFromChannel(serverId.toUpperCase(), channelId.toUpperCase(), messageId.toUpperCase());
        });
        connection.on(ServerEventNames.ChannelAdded, (serverId: string, channel: Channel) => {
            appStoreActions.addChannel(serverId.toUpperCase(), { ...channel, id: channel.id.toUpperCase() });
        });
        connection.on(ServerEventNames.ChannelRemoved, (serverId: string, channelId: string) => {
            appStoreActions.removeChannel(serverId.toUpperCase(), channelId.toUpperCase());
        });
        connection.on(ServerEventNames.ChannelUpdated, (serverId: string, channel: Channel) => {
            appStoreActions.updateChannel(serverId.toUpperCase(), { ...channel, id: channel.id.toUpperCase() });
        });
        connection.on(ServerEventNames.UserJoined, (serverId: string, user: User) => {
            appStoreActions.addUserToServer(serverId.toUpperCase(), { ...user, id: user.id.toUpperCase() });
        });
        connection.on(ServerEventNames.UserLeft, (serverId: string, userId: string) => {
            appStoreActions.removeUserFromServer(serverId.toUpperCase(), userId.toUpperCase());
        });

        // in case of losing connection, reconnect to all server groups
        connection.onreconnected(async () => {
            console.log("SignalR: Connection reconnected. Rejoining server groups...");
            const currentServers = useAppStore.getState().servers;
            for (const server of currentServers) {
                try {
                    await connection.invoke("JoinServer", server.id);
                    console.log(`SignalR: Successfully re-joined server group ${server.id}`);
                } catch (err) {
                    console.error(`SignalR: Error re-joining server group ${server.id} on reconnect:`, err);
                }
            }
        });
    }, [appStoreActions]);

    const registerUserEventHandlers = useCallback((connection: HubConnection) => {
        Object.values(UserEventNames).forEach(eventName => connection.off(eventName));

        // todo: finish this
        connection.on(UserEventNames.UsernameChanged, (user: User) => {
            appStoreActions.changeUsername(user, user.username);
        });

        connection.on(UserEventNames.AvatarChanged, (user: User) => { 
            appStoreActions.changeAvatar(user);
        });
    }, [appStoreActions]);

    const initializeServerHub = useCallback(async () => {
        if (serverConnectionRef.current?.state === "Connected") return;

        const connection = new HubConnectionBuilder()
            .withUrl(SERVER_HUB_URL)
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        serverConnectionRef.current = connection;
        registerServerEventHandlers(connection);

        try {
            await connection.start();
            setIsServerConnected(true);
            setServerError(null);
            console.log("SignalR (Server): Connection started.");
            setSignalRConnection(connection);

            // join all server groups
            const currentServers = useAppStore.getState().servers;
            for (const server of currentServers) {
                await connection.invoke("JoinServer", server.id);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setServerError(`Connection Error: ${msg}`);
            console.error("SignalR (Server) Connection Error: ", err);
        }
    }, [registerServerEventHandlers]);

    const closeServerHub = useCallback(async () => {
        if (serverConnectionRef.current) {
            try {
                await serverConnectionRef.current.stop();
            } catch (err) {
                console.error("SignalR (Server): Error stopping connection.", err);
            } finally {
                setIsServerConnected(false);
                serverConnectionRef.current = null;
            }
        }
    }, []);

    const initializeUserHub = useCallback(async () => {
        if (userConnectionRef.current?.state === "Connected") return;

        const connection = new HubConnectionBuilder()
            .withUrl(USER_HUB_URL)
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();
        
        userConnectionRef.current = connection;
        registerUserEventHandlers(connection);

        try {
            await connection.start();
            setIsUserConnected(true);
            setUserError(null);
            console.log("SignalR (User): Connection started.");
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setUserError(`Connection Error: ${msg}`);
            console.error("SignalR (User) Connection Error: ", err);
        }
    }, [registerUserEventHandlers]);

    const closeUserHub = useCallback(async () => {
        if (userConnectionRef.current) {
            try {
                await userConnectionRef.current.stop();
            } catch (err) {
                console.error("SignalR (User): Error stopping connection.", err);
            } finally {
                setIsUserConnected(false);
                userConnectionRef.current = null;
            }
        }
    }, []);

    return {
        // server hub
        isServerConnected,
        serverError,
        initializeServerHub,
        closeServerHub,
        
        // user hub
        isUserConnected,
        userError,
        initializeUserHub,
        closeUserHub,
    };
};


import { useRef, useState, useCallback } from "react";
import { HubConnectionBuilder, LogLevel, HubConnection } from "@microsoft/signalr";
import { useAppStore } from "@/stores/appStore";
import { User } from "@/types/user.type";
import { Channel } from "@/types/channel.types";
import { ServerMessage } from "@/types/server-message.type";
import { setSignalRConnection } from "@/services/signalrService";

export const SIGNALR_URL = 'https://localhost:7056/hubs/server';

const EventNames = {
    MessageAdded: "MessageAdded",
    MessageEdited: "MessageEdited",
    MessageRemoved: "MessageRemoved",
    ChannelAdded: "ChannelAdded",
    ChannelRemoved: "ChannelRemoved",
    ChannelUpdated: "ChannelUpdated",
    UserJoined: "UserJoined",
    UserLeft: "UserLeft",
};

export const useSignalR = () => {
    const appStoreActions = useAppStore.getState();

    const connectionRef = useRef<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unregisterEventHandlers = useCallback((connection: HubConnection) => {
        Object.values(EventNames).forEach(eventName => connection.off(eventName));
    }, []);

    const closeSignalRConnection = useCallback(async () => {
        if (connectionRef.current) {
            unregisterEventHandlers(connectionRef.current);
            try {
                await connectionRef.current.stop();
                console.log("SignalR: Connection stopped.");
            } catch (err) {
                console.error("SignalR: Error stopping connection: ", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`SignalR Stop Error: ${errorMessage}`);
            } finally {
                setIsConnected(false);
                connectionRef.current = null;
            }
        }
    }, [unregisterEventHandlers]);

    const registerEventHandlers = useCallback((connection: HubConnection) => {

        connection.on(EventNames.MessageAdded, (serverId: string, message: ServerMessage) => {
            appStoreActions.addMessageToChannel(serverId.toUpperCase(), { ...message, id: message.id.toUpperCase() });
        });

        connection.on(EventNames.MessageEdited, (serverId: string, message: ServerMessage) => {
            appStoreActions.editMessageInChannel(serverId.toUpperCase(), { ...message, id: message.id.toUpperCase() });
        });

        connection.on(EventNames.MessageRemoved, (serverId: string, channelId: string, messageId: string) => {
            appStoreActions.removeMessageFromChannel(serverId.toUpperCase(), channelId.toUpperCase(), messageId.toUpperCase());
        });

        connection.on(EventNames.ChannelAdded, (serverId: string, channel: Channel) => {
            appStoreActions.addChannel(serverId.toUpperCase(), { ...channel, id: channel.id.toUpperCase() });
        });

        connection.on(EventNames.ChannelRemoved, (serverId: string, channelId: string) => {
            appStoreActions.removeChannel(serverId.toUpperCase(), channelId.toUpperCase());
        });

        connection.on(EventNames.ChannelUpdated, (serverId: string, channel: Channel) => {
            appStoreActions.updateChannel(serverId.toUpperCase(), { ...channel, id: channel.id.toUpperCase() });
        });

        connection.on(EventNames.UserJoined, (serverId: string, user: User) => {
            appStoreActions.addUserToServer(serverId.toUpperCase(), { ...user, id: user.id.toUpperCase() });
        });

        connection.on(EventNames.UserLeft, (serverId: string, userId: string) => {
            appStoreActions.removeUserFromServer(serverId.toUpperCase(), userId.toUpperCase());
        });

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

    const initializeSignalR = useCallback(async () => {
        if (connectionRef.current && connectionRef.current.state === "Connected") {
            console.log("SignalR: Already connected.");
            return;
        }
        if (connectionRef.current) {
            await closeSignalRConnection();
        }

        const connection = new HubConnectionBuilder()
            .withUrl(SIGNALR_URL)
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        registerEventHandlers(connection);
        connectionRef.current = connection;

        try {
            await connection.start();
            setIsConnected(true);
            setError(null);
            console.log("SignalR: Connection started successfully.");

            const currentServers = useAppStore.getState().servers;
            console.log(`SignalR: Attempting to join groups for ${currentServers.length} servers.`);
            for (const server of currentServers) {
                try {
                    await connection.invoke("JoinServer", server.id);
                    console.log(`SignalR: Successfully joined server group ${server.id} on initial connect.`);
                } catch (err) {
                    console.error(`SignalR: Error auto-joining server group ${server.id} on initial connect:`, err);
                }
            }
            setSignalRConnection(connection); // for global access (signalrService)
        } catch (err) {
            setIsConnected(false);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`SignalR Connection Error: ${errorMessage}`);
            console.error("SignalR Connection Error: ", err);
            connectionRef.current = null; 
        }
    }, [registerEventHandlers, closeSignalRConnection]); 

    const invokeHubMethod = useCallback(async (methodName: string, ...args: unknown[]) => {
        if (connectionRef.current && connectionRef.current.state === "Connected") {
            try {
                return await connectionRef.current.invoke(methodName, ...args);
            } catch (err) {
                console.error(`SignalR: Error invoking method ${methodName}:`, err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`SignalR Invoke Error (${methodName}): ${errorMessage}`);
                throw err; 
            }
        } else {
            const notConnectedMsg = "SignalR: Cannot invoke method, not connected.";
            console.error(notConnectedMsg);
            setError(notConnectedMsg);
            throw new Error(notConnectedMsg);
        }
    }, []);

    return {
        initializeSignalR,
        closeSignalRConnection,
        isConnected,
        error,
        invokeHubMethod,
        joinServerGroup: useCallback((serverId: string) => invokeHubMethod("JoinServer", serverId), [invokeHubMethod]),
        leaveServerGroup: useCallback((serverId: string) => invokeHubMethod("LeaveServer", serverId), [invokeHubMethod]),
    };
};


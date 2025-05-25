import { HubConnection } from "@microsoft/signalr";

let connection: HubConnection | null = null;

// this service exists beacause of error: "Invalid hook call. Hooks can only be called inside of the body of a function component."
export function setSignalRConnection(conn: HubConnection) {
    connection = conn;
}

export async function joinServerGroup(serverId: string) {
    if (!connection || connection.state !== "Connected") throw new Error("Not connected");
    await connection.invoke("JoinServer", serverId);
}

export async function leaveServerGroup(serverId: string) {
    if (!connection || connection.state !== "Connected") throw new Error("Not connected");
    await connection.invoke("LeaveServer", serverId);
}
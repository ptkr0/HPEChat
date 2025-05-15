export type ServerMessage = {
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    message: string;
    sentAt: string;
    isEdited: boolean;
}
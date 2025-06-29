export type Attachment = {
    id: string;
    name: string;
    type: AttachmentType;
    size: number;
    width?: number;
    height?: number;
    previewName?: string;
    fileName?: string;
}

export enum AttachmentType {
    IMAGE = "Image",
    VIDEO = "Video",
    AUDIO = "Audio",
    DOCUMENT = "Document",
    OTHER = "Other"
}
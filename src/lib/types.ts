export interface IncomingMessage {
    id: string;
    sender: string;
    text: string;
    platform: "whatsapp" | "email" | "internal";
    timestamp: string;
    avatarColor: string;
    type?: "text" | "voice" | "image" | "video";
}

export interface Ticket {
    id: string;
    title: string;
    status: "Open" | "In Progress" | "Resolved" | "Closed";
    priority: "Low" | "Medium" | "High" | "Critical";
    assignee?: string;
    customer: string;
    lastUpdated: string;
}

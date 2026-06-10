import { api } from '../../../shared/api/axiosClient';

export interface EmpresaConversation {
    id_conversation: number;
    tourist_id: number;
    tourist_name: string;
    tourist_photo: string | null;
    id_service: number | null;
    service_name: string | null;
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
    created_at: string;
}

export interface ChatMessage {
    id_message: number;
    id_conversation: number;
    sender_id: number;
    sender_name: string;
    sender_photo: string | null;
    content: string;
    read_at: string | null;
    created_at: string;
}

export const chatEmpresaApi = {
    conversations: async (): Promise<EmpresaConversation[]> => {
        const res = await api.get('/empresa/conversations');
        return res.data.conversations;
    },

    messages: async (conversationId: number): Promise<ChatMessage[]> => {
        const res = await api.get(`/conversations/${conversationId}/messages`);
        return res.data.messages;
    },

    send: async (conversationId: number, content: string): Promise<ChatMessage> => {
        const res = await api.post(`/conversations/${conversationId}/messages`, { content });
        return res.data.msg;
    },

    markRead: async (conversationId: number): Promise<void> => {
        await api.patch(`/conversations/${conversationId}/read`);
    },
};

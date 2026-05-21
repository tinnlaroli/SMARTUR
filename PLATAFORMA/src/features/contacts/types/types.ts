export type ContactStatus = 'pending' | 'in_progress' | 'done' | 'dismissed';

export interface ContactSubscription {
    id: number;
    email: string;
    source: string;
    reason: string | null;
    message: string | null;
    status: ContactStatus;
    created_at: string;
}

export interface ContactSubscriptionsResponse {
    subscriptions: ContactSubscription[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

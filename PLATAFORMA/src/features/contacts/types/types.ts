export interface ContactSubscription {
    id: number;
    email: string;
    source: string;
    created_at: string;
}

export interface ContactSubscriptionsResponse {
    subscriptions: ContactSubscription[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

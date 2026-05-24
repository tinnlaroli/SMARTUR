export interface CommunityPostAuthor {
    name: string;
    photo_url: string | null;
    avatar_icon_key: string | null;
    created_at?: string;
    interests?: string[];
}

export interface CommunityPost {
    id: number;
    user_id: number;
    caption: string;
    image_url: string | null;
    place_kind: 'svc' | 'poi';
    place_id: number;
    place_name: string;
    created_at: string;
    author: CommunityPostAuthor;
}

export interface CommunityPostsResponse {
    posts: CommunityPost[];
    totalRecords: number;
    currentPage: number;
    limit: number;
}

export type ReportReason = 'spam' | 'inappropriate' | 'false_info' | 'hateful';

export interface PostReport {
    id: number;
    post_id: number;
    reason: ReportReason;
    created_at: string;
    resolved: boolean;
    reporter_id: number;
    reporter_name: string;
    reporter_photo_url: string | null;
    post_caption: string;
    post_image_url: string | null;
    place_kind: 'svc' | 'poi';
    place_id: number;
    author_name: string;
}

export interface PostReportsResponse {
    total: number;
    reports: PostReport[];
}

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

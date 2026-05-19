export interface ProfileUserSummary {
    id: number;
    name: string;
    email: string;
    photo_url?: string | null;
    avatar_icon_key?: string | null;
}

export interface Profile {
    id: number;
    user_id: number;
    user?: ProfileUserSummary | null;
    birthDate?: string | null;
    age?: number | null;
    age_range?: string | null;
    gender?: string | null;
    interests?: string[];
    activity_level?: number | null;
    preferred_place?: string | null;
    travel_type?: string | null;
    has_accessibility?: boolean;
    accessibility_detail?: string | null;
    has_visited_before?: boolean;
    restrictions?: string | null;
    sustainable_preferences?: boolean;
}

export interface CreateProfileDTO {
    user_id: number;
    age?: number;
    age_range?: string;
    gender?: string;
    interests?: string[];
    activity_level?: number;
    preferred_place?: string;
    travel_type?: string;
    has_accessibility?: boolean;
    accessibility_detail?: string;
    has_visited_before?: boolean;
    restrictions?: string;
    sustainable_preferences?: boolean;
}

export interface UpdateProfileDTO {
    age?: number;
    age_range?: string;
    gender?: string;
    interests?: string[];
    activity_level?: number;
    preferred_place?: string;
    travel_type?: string;
    has_accessibility?: boolean;
    accessibility_detail?: string;
    has_visited_before?: boolean;
    restrictions?: string;
    sustainable_preferences?: boolean;
}

export interface ProfileResponse {
    travelerProfiles: Profile[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

class UserProfile {
  final int id;
  final String name;
  final String? photoUrl;
  final String? avatarIconKey;
  final DateTime? createdAt;
  final int followersCount;
  final int followingCount;
  final bool isFollowing;

  const UserProfile({
    required this.id,
    required this.name,
    this.photoUrl,
    this.avatarIconKey,
    this.createdAt,
    this.followersCount = 0,
    this.followingCount = 0,
    this.isFollowing = false,
  });

  factory UserProfile.fromJson(Map<String, dynamic> j) => UserProfile(
        id: j['id'] as int,
        name: (j['name'] as String?) ?? '',
        photoUrl: j['photo_url'] as String?,
        avatarIconKey: j['avatar_icon_key'] as String?,
        createdAt: j['created_at'] != null
            ? DateTime.tryParse(j['created_at'].toString())
            : null,
        followersCount: (j['followers_count'] as int?) ?? 0,
        followingCount: (j['following_count'] as int?) ?? 0,
        isFollowing: (j['is_following'] as bool?) ?? false,
      );

  UserProfile copyWith({bool? isFollowing, int? followersCount}) => UserProfile(
        id: id,
        name: name,
        photoUrl: photoUrl,
        avatarIconKey: avatarIconKey,
        createdAt: createdAt,
        followersCount: followersCount ?? this.followersCount,
        followingCount: followingCount,
        isFollowing: isFollowing ?? this.isFollowing,
      );

  Map<String, dynamic> toAuthorMap() => {
        'name': name,
        'photo_url': photoUrl,
        'avatar_icon_key': avatarIconKey,
        'created_at': createdAt?.toIso8601String(),
      };
}

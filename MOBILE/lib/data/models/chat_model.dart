class Conversation {
  final int id;
  final int touristId;
  final int companyId;
  final String companyName;
  final int? serviceId;
  final String? serviceName;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final DateTime createdAt;

  const Conversation({
    required this.id,
    required this.touristId,
    required this.companyId,
    required this.companyName,
    this.serviceId,
    this.serviceName,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    required this.createdAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: j['id_conversation'] as int,
        touristId: j['tourist_id'] as int,
        companyId: j['id_company'] as int,
        companyName: (j['company_name'] as String?) ?? '',
        serviceId: j['id_service'] as int?,
        serviceName: j['service_name'] as String?,
        lastMessage: j['last_message'] as String?,
        lastMessageAt: j['last_message_at'] != null
            ? DateTime.tryParse(j['last_message_at'].toString())
            : null,
        unreadCount: (j['unread_count'] as int?) ?? 0,
        createdAt: DateTime.parse(j['created_at'].toString()),
      );
}

// ─────────────────────────────────────────────────────────────────────────────

class ChatMessage {
  final int id;
  final int conversationId;
  final int? senderId;
  final String senderName;
  final String? senderPhoto;
  final String content;
  final DateTime? readAt;
  final DateTime createdAt;
  final bool isBot;

  const ChatMessage({
    required this.id,
    required this.conversationId,
    this.senderId,
    required this.senderName,
    this.senderPhoto,
    required this.content,
    this.readAt,
    required this.createdAt,
    this.isBot = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['id_message'] as int,
        conversationId: j['id_conversation'] as int,
        senderId: j['sender_id'] as int?,
        senderName: (j['sender_name'] as String?) ?? '',
        senderPhoto: j['sender_photo'] as String?,
        content: j['content'] as String,
        readAt: j['read_at'] != null
            ? DateTime.tryParse(j['read_at'].toString())
            : null,
        createdAt: DateTime.parse(j['created_at'].toString()),
        isBot: (j['is_bot'] as bool?) ?? false,
      );
}

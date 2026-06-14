import 'dart:convert';
import '../../core/constants/api_constants.dart';
import '../models/chat_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class ChatException implements Exception {
  final String message;
  ChatException(this.message);
  @override
  String toString() => message;
}

class ChatService {
  String _msg(dynamic res) {
    try {
      final d = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      return d['message'] as String? ?? 'Error ${res.statusCode}';
    } catch (_) {
      return 'Error ${res.statusCode}';
    }
  }

  Future<Conversation> createConversation({
    required int companyId,
    int? serviceId,
  }) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.conversations}');
    final body = jsonEncode({
      'id_company': companyId,
      if (serviceId != null) 'id_service': serviceId,
    });
    final res = await ApiClient.post(uri, body: body);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 200 || res.statusCode == 201) {
      final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      return Conversation.fromJson(
          data['conversation'] as Map<String, dynamic>? ?? data);
    }
    throw ChatException(_msg(res));
  }

  Future<List<Conversation>> fetchMyConversations() async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.conversationsMe}');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ChatException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    final list = data['conversations'] as List<dynamic>? ?? [];
    return list
        .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChatMessage>> fetchMessages(int conversationId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.conversations}/$conversationId/messages');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ChatException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    final list = data['messages'] as List<dynamic>? ?? [];
    return list
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ChatMessage> sendMessage(int conversationId, String content) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.conversations}/$conversationId/messages');
    final res = await ApiClient.post(uri, body: jsonEncode({'content': content}));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 200 || res.statusCode == 201) {
      final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      return ChatMessage.fromJson(
          data['msg'] as Map<String, dynamic>? ?? data);
    }
    throw ChatException(_msg(res));
  }

  Future<void> markRead(int conversationId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.conversations}/$conversationId/read');
    await ApiClient.patch(uri, body: '{}');
  }

  /// Sends the question to the FAQ bot.
  /// Returns [ChatMessage] if a FAQ matched, null if no match (provider should reply),
  /// throws [ChatException] on network/server error.
  Future<ChatMessage?> sendBotMessage(int conversationId, String content) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.conversations}/$conversationId/bot-message');
    final res = await ApiClient.post(uri, body: jsonEncode({'content': content}));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw ChatException(_msg(res));
    }
    final data = ApiClient.tryDecodeJson(res);
    final msg = data?['bot_message'];
    if (msg == null) return null; // no match — provider will reply
    return ChatMessage.fromJson(msg as Map<String, dynamic>);
  }
}

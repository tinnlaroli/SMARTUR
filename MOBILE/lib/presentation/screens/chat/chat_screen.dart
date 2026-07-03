import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/models/chat_model.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/chat_service.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';

const _pollInterval = Duration(seconds: 10);

class ChatScreen extends StatefulWidget {
  final Conversation conversation;

  const ChatScreen({super.key, required this.conversation});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _service = ChatService();
  final _authService = AuthService();
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<ChatMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  int? _myUserId;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    _myUserId = await _authService.getUserId();
    if (!mounted) return;
    await _load();
    _timer = Timer.periodic(_pollInterval, (_) => _load(silent: true));
  }

  Future<void> _load({bool silent = false}) async {
    try {
      final msgs = await _service.fetchMessages(widget.conversation.id);
      await _service.markRead(widget.conversation.id);
      if (mounted) {
        final wasAtBottom = _isAtBottom();
        setState(() {
          _messages = msgs;
          _loading = false;
        });
        if (wasAtBottom || !silent) _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        if (!silent) SmarturNotifications.showError(context, e.toString());
      }
    }
  }

  bool _isAtBottom() {
    if (!_scrollCtrl.hasClients) return true;
    final pos = _scrollCtrl.position;
    return pos.pixels >= pos.maxScrollExtent - 60;
  }

  void _scrollToBottom() {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    _inputCtrl.clear();
    setState(() => _sending = true);
    try {
      await _service.sendMessage(widget.conversation.id, text);
      await _load(silent: true);
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _sendBotMessage() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    _inputCtrl.clear();
    setState(() => _sending = true);
    try {
      final botReply = await _service.sendBotMessage(widget.conversation.id, text);
      if (!mounted) return;
      if (botReply != null) {
        // FAQ matched — show bot bubble
        setState(() => _messages.add(botReply));
        _scrollToBottom();
      } else {
        // Sin coincidencia — el bot responde igual con una burbuja útil (local)
        // para que el usuario vea que fue atendido; el prestador completará.
        setState(() => _messages.add(ChatMessage(
              id: -DateTime.now().millisecondsSinceEpoch,
              conversationId: widget.conversation.id,
              senderName: 'Asistente',
              content:
                  'No tengo una respuesta guardada para eso todavía. Le avisé a '
                  '${widget.conversation.companyName} para que te responda pronto. '
                  'Puedes preguntarme por horarios, precios o ubicación.',
              createdAt: DateTime.now(),
              isBot: true,
            )));
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, 'Asistente no disponible');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  // Tap al robot: con texto → busca en FAQs; vacío → muestra la hoja de FAQs.
  void _onBotTap() {
    if (_inputCtrl.text.trim().isNotEmpty) {
      _sendBotMessage();
    } else {
      _openFaqSheet();
    }
  }

  Future<void> _openFaqSheet() async {
    List<String> faqs;
    try {
      faqs = await _service.fetchConversationFaqs(widget.conversation.id);
    } catch (_) {
      if (mounted) {
        SmarturNotifications.showError(
            context, 'No se pudieron cargar las preguntas.');
      }
      return;
    }
    if (!mounted) return;
    if (faqs.isEmpty) {
      SmarturNotifications.showInfo(
        context,
        '${widget.conversation.companyName} aún no tiene preguntas frecuentes. '
        'Escribe tu duda y te responderán.',
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _FaqSheet(
        companyName: widget.conversation.companyName,
        faqs: faqs,
        onPick: (q) {
          Navigator.pop(ctx);
          _inputCtrl.text = q;
          _sendBotMessage();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: SmarturAppBar(
        showBack: true,
        titleWidget: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: scheme.primaryContainer,
              child: Text(
                widget.conversation.companyName.isNotEmpty
                    ? widget.conversation.companyName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  color: scheme.onPrimaryContainer,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.conversation.companyName,
                    style: const TextStyle(
                        fontFamily: 'CalSans',
                        fontSize: 17,
                        fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (widget.conversation.serviceName != null)
                    Text(
                      widget.conversation.serviceName!,
                      style: Theme.of(context)
                          .textTheme
                          .labelSmall
                          ?.copyWith(color: scheme.primary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SmarturBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              // Messages
              Expanded(
                child: _loading
                    ? const _ChatSkeleton()
                    : _messages.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.chat_bubble_outline_rounded,
                                    size: 48, color: scheme.outline),
                                const SizedBox(height: 12),
                                Text(
                                  'Sé el primero en escribir',
                                  style: TextStyle(color: scheme.outline),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: _scrollCtrl,
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                            itemCount: _messages.length,
                            itemBuilder: (context, i) {
                              final msg = _messages[i];
                              final isMe = msg.senderId == _myUserId;
                              return _MessageBubble(
                                message: msg,
                                isMe: isMe,
                                showName: !isMe,
                              );
                            },
                          ),
              ),

              // Input bar
              Container(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                decoration: BoxDecoration(
                  color: scheme.surface,
                  border: Border(
                    top: BorderSide(color: scheme.outlineVariant),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputCtrl,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: InputDecoration(
                          hintText: l10n.chatTypeHere,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: scheme.surfaceContainerHighest,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                          isDense: true,
                        ),
                        onSubmitted: (_) => _send(),
                        maxLines: 4,
                        minLines: 1,
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Bot assistant button
                    if (!_sending)
                      IconButton(
                        onPressed: _onBotTap,
                        icon: const Icon(Icons.smart_toy_outlined),
                        color: scheme.primary,
                        tooltip: 'Preguntar al asistente',
                        iconSize: 22,
                      ),
                    const SizedBox(width: 2),
                    _sending
                        ? const SizedBox(
                            width: 40,
                            height: 40,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : IconButton.filled(
                            onPressed: _send,
                            icon: const Icon(Icons.send_rounded),
                            style: IconButton.styleFrom(
                              backgroundColor: scheme.primary,
                              foregroundColor: scheme.onPrimary,
                            ),
                            tooltip: l10n.chatSend,
                          ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final bool showName;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.showName,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final sem = SmarturSemanticColors.of(context);

    if (message.isBot) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: sem.accent.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.smart_toy_outlined,
                  size: 16, color: sem.accent),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.72,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: sem.accent.withValues(alpha: 0.10),
                    border: Border.all(
                        color: sem.accent.withValues(alpha: 0.25)),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(4),
                      topRight: Radius.circular(18),
                      bottomLeft: Radius.circular(18),
                      bottomRight: Radius.circular(18),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Asistente virtual',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: sem.accent,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(message.content,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: scheme.onSurface)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          child: Column(
            crossAxisAlignment:
                isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (showName)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 2),
                  child: Text(
                    message.senderName,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: scheme.outline,
                        ),
                  ),
                ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: isMe ? scheme.primary : scheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isMe ? 18 : 4),
                    bottomRight: Radius.circular(isMe ? 4 : 18),
                  ),
                ),
                child: Text(
                  message.content,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isMe ? scheme.onPrimary : scheme.onSurface,
                      ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
                child: Text(
                  _formatTime(message.createdAt),
                  style: Theme.of(context)
                      .textTheme
                      .labelSmall
                      ?.copyWith(color: scheme.outline, fontSize: 10),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton de carga del chat — burbujas alternadas con shimmer
// ─────────────────────────────────────────────────────────────────────────────

class _ChatSkeleton extends StatelessWidget {
  const _ChatSkeleton();

  @override
  Widget build(BuildContext context) {
    // Anchos y lados alternados para simular una conversación.
    const bubbles = [
      (0.55, false),
      (0.42, true),
      (0.68, false),
      (0.35, true),
      (0.5, false),
      (0.6, true),
    ];
    return SmarturShimmer(
      enabled: true,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          for (final b in bubbles)
            Align(
              alignment:
                  b.$2 ? Alignment.centerRight : Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: SkeletonContainer(
                  width: MediaQuery.sizeOf(context).width * b.$1,
                  height: 44,
                  borderRadius: 18,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hoja de preguntas frecuentes del asistente
// ─────────────────────────────────────────────────────────────────────────────

class _FaqSheet extends StatelessWidget {
  final String companyName;
  final List<String> faqs;
  final ValueChanged<String> onPick;

  const _FaqSheet({
    required this.companyName,
    required this.faqs,
    required this.onPick,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: scheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Icon(Icons.smart_toy_outlined, color: scheme.primary, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Preguntas frecuentes',
                    style: TextStyle(
                      fontFamily: 'CalSans',
                      fontSize: 19,
                      fontWeight: FontWeight.w700,
                      color: scheme.onSurface,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              'Toca una pregunta y el asistente de $companyName te responde al instante.',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12.5,
                height: 1.4,
                color: scheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 14),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: faqs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  return InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => onPick(faqs[i]),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: scheme.outlineVariant.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.help_outline_rounded,
                              size: 18, color: scheme.primary),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              faqs[i],
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                color: scheme.onSurface,
                              ),
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded,
                              size: 18,
                              color: scheme.onSurfaceVariant
                                  .withValues(alpha: 0.6)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

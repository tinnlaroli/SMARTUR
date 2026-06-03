import 'package:flutter/foundation.dart';

/// Screen name posted when an FCM notification is tapped.
/// Consumed by [_MainScreenState] to switch to the correct tab.
/// Values: 'home' | 'diary' | 'discover' | 'community'
final pendingNotificationScreen = ValueNotifier<String?>(null);

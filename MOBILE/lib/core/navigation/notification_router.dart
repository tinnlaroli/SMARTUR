import 'package:flutter/foundation.dart';

/// Screen name posted when an FCM notification is tapped.
/// Consumed by [_MainScreenState] to switch tabs or push screens.
/// Values: 'home' | 'explore' | 'routes' | 'profile' | 'messages' | 'bookings' | 'servicios'
final pendingNotificationScreen = ValueNotifier<String?>(null);

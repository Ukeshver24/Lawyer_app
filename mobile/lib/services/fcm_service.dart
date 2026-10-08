import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';
import '../screens/case_detail_screen.dart';

// Top-level background message handler for FCM
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('📱 FCM Background Message Received: ${message.messageId}');
}

class FCMService {
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Initialize Firebase and setup push notifications
  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      FirebaseMessaging messaging = FirebaseMessaging.instance;

      // 1. Request notification permissions (iOS & Android 13+)
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('📱 FCM Notification Permission: ${settings.authorizationStatus}');

      // 2. Subscribe to general legal updates topic
      await messaging.subscribeToTopic('all_judgments');
      debugPrint('📱 Subscribed to topic: all_judgments');

      // 3. Handle when app is opened from a TERMINATED state via notification
      RemoteMessage? initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationClick(initialMessage);
      }

      // 4. Handle when app is opened from a BACKGROUND state via notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('📱 FCM onMessageOpenedApp: ${message.data}');
        _handleNotificationClick(message);
      });

      // 5. Handle foreground messages while user is inside the app
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('📱 FCM Foreground Message: ${message.notification?.title}');
        _showInAppNotificationBanner(message);
      });

    } catch (e) {
      debugPrint('⚠️ FCM Initialization Error: $e');
    }
  }

  /// Navigate to CaseDetailScreen when user taps notification
  static void _handleNotificationClick(RemoteMessage message) async {
    final caseId = message.data['caseId'];
    if (caseId == null || caseId.toString().isEmpty) return;

    try {
      final caseItem = await ApiService.getCaseById(caseId.toString());
      if (caseItem != null && navigatorKey.currentContext != null) {
        Navigator.of(navigatorKey.currentContext!).push(
          MaterialPageRoute(
            builder: (context) => CaseDetailScreen(caseItem: caseItem),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error navigating from notification: $e');
    }
  }

  /// Show clean in-app snackbar if notification arrives while app is open
  static void _showInAppNotificationBanner(RemoteMessage message) {
    final context = navigatorKey.currentContext;
    if (context == null) return;

    final title = message.notification?.title ?? '🏛️ New Legal Update';
    final body = message.notification?.body ?? 'A new judgment has been published.';
    final caseId = message.data['caseId'];

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 5),
        backgroundColor: const Color(0xFF0F172A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
            const SizedBox(height: 2),
            Text(body, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
        ),
        action: caseId != null
            ? SnackBarAction(
                label: 'VIEW',
                textColor: const Color(0xFFD97706),
                onPressed: () => _handleNotificationClick(message),
              )
            : null,
      ),
    );
  }
}

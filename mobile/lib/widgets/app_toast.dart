import 'package:flutter/material.dart';

enum ToastType { success, error, info, warning }

class AppToast {
  static void show(
    BuildContext context,
    String message, {
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    final scaffoldMessenger = ScaffoldMessenger.maybeOf(context);
    if (scaffoldMessenger == null) return;

    scaffoldMessenger.hideCurrentSnackBar();

    Color bgColor;
    Color iconColor;
    IconData icon;

    switch (type) {
      case ToastType.success:
        bgColor = const Color(0xFF065F46); // Dark Emerald
        iconColor = const Color(0xFF34D399);
        icon = Icons.check_circle_rounded;
        break;
      case ToastType.error:
        bgColor = const Color(0xFF991B1B); // Dark Red
        iconColor = const Color(0xFFF87171);
        icon = Icons.error_rounded;
        break;
      case ToastType.warning:
        bgColor = const Color(0xFF92400E); // Dark Amber
        iconColor = const Color(0xFFFBBF24);
        icon = Icons.warning_rounded;
        break;
      case ToastType.info:
        bgColor = const Color(0xFF0F172A); // Slate 900
        iconColor = const Color(0xFF60A5FA);
        icon = Icons.info_rounded;
        break;
    }

    scaffoldMessenger.showSnackBar(
      SnackBar(
        duration: duration,
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        elevation: 0,
        margin: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 0),
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static void showSuccess(BuildContext context, String message) =>
      show(context, message, type: ToastType.success);

  static void showError(BuildContext context, String message) =>
      show(context, message, type: ToastType.error);

  static void showInfo(BuildContext context, String message) =>
      show(context, message, type: ToastType.info);

  static void showWarning(BuildContext context, String message) =>
      show(context, message, type: ToastType.warning);
}

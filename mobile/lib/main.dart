import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:digi_law_reporter_mobile/providers/auth_provider.dart';
import 'package:digi_law_reporter_mobile/providers/search_provider.dart';
import 'package:digi_law_reporter_mobile/providers/bookmark_provider.dart';
import 'package:digi_law_reporter_mobile/theme/app_theme.dart';
import 'package:digi_law_reporter_mobile/screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DigiLawReporterApp());
}

/// Custom scroll behavior to completely disable Android 12+ stretch overscroll and bounce
class AppScrollBehavior extends ScrollBehavior {
  const AppScrollBehavior();

  @override
  Widget buildOverscrollIndicator(
      BuildContext context, Widget child, ScrollableDetails details) {
    return child;
  }

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const ClampingScrollPhysics();
  }
}

class DigiLawReporterApp extends StatelessWidget {
  const DigiLawReporterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => SearchProvider()),
        ChangeNotifierProvider(create: (_) => BookmarkProvider()),
      ],
      child: MaterialApp(
        title: 'Digi Law Reporter',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        scrollBehavior: const AppScrollBehavior(),
        builder: (context, child) {
          return ScrollConfiguration(
            behavior: const AppScrollBehavior(),
            child: child ?? const SizedBox.shrink(),
          );
        },
        home: const SplashScreen(),
      ),
    );
  }
}

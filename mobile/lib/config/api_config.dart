import 'package:flutter/foundation.dart';

class ApiConfig {
  // Allow build-time override via --dart-define=API_BASE_URL=...
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  // Base URL for the Node.js Express backend API
  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl;
    }
    // In release mode or on physical devices, use the production backend
    if (kReleaseMode) {
      return 'https://law.gradixtech.com/api';
    }
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      // Connects to live production server so APK works on physical Android phones
      return 'https://law.gradixtech.com/api';
    }
    return 'https://law.gradixtech.com/api';
  }

  // Auth endpoints
  static String get loginUrl => '$baseUrl/auth/login';
  static String get signupUrl => '$baseUrl/auth/signup';
  static String get savedCasesUrl => '$baseUrl/auth/saved-cases';

  // Search endpoints (Backend public search)
  static String get searchUrl => '$baseUrl/public/search';
  static String get courtsUrl => '$baseUrl/public/courts';

  // Cases endpoints
  static String get casesUrl => '$baseUrl/cases';

  // Public endpoints
  static String get healthUrl => '$baseUrl/health';
}

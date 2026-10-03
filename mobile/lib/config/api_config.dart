import 'package:flutter/foundation.dart';

class ApiConfig {
  // Base URL for the Node.js Express backend API
  // Android Emulator connects to Mac host via 10.0.2.2
  // Web / iOS Simulator connects via localhost
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
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

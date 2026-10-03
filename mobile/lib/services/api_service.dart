import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/case_model.dart';
import '../models/user_model.dart';

class ApiService {
  // 1. User Login
  static Future<UserModel?> login(String identifier, String password) async {
    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.loginUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'mobile': identifier,
              'mpin': password,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);

        if (data['user'] != null) {
          return UserModel.fromJson({
            ...data['user'],
            'token': data['token'],
          });
        }
      }

      debugPrint('Login failed: ${response.statusCode} ${response.body}');
      return null;
    } catch (e) {
      debugPrint('Login Exception: $e');
      return null;
    }
  }

  // 2. User Signup
  static Future<UserModel?> signup({
    required String name,
    required String mobile,
    required String dob,
    required String mpin,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.signupUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': name,
              'mobile': mobile,
              'dob': dob,
              'mpin': mpin,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['user'] != null) {
          return UserModel.fromJson({
            ...data['user'],
            'token': data['token'],
          });
        }
      }
      return null;
    } catch (e) {
      debugPrint('Signup Exception: $e');
      return null;
    }
  }

  // 3. Search Judgments (Strictly from Backend Database)
  static Future<List<CaseModel>> searchCases({
    String query = '',
    String mode = 'general',
    String court = '',
    String year = '',
    String month = '',
    String number = '',
  }) async {
    try {
      final queryParameters = <String, String>{};
      if (query.isNotEmpty) {
        queryParameters['q'] = query;
        queryParameters['keyword'] = query;
      }
      if (mode.isNotEmpty && mode != 'general') {
        queryParameters['mode'] = mode;
        queryParameters['tab'] = mode;
      }
      if (court.isNotEmpty && court != 'All Courts') {
        queryParameters['court'] = court;
      }
      if (year.isNotEmpty) {
        queryParameters['year'] = year;
      }
      if (month.isNotEmpty) {
        queryParameters['month'] = month;
      }
      if (number.isNotEmpty) {
        queryParameters['number'] = number;
      }

      final uri = Uri.parse(ApiConfig.searchUrl).replace(
        queryParameters: queryParameters.isNotEmpty ? queryParameters : null,
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List casesList =
            data['data'] ?? data['cases'] ?? (data is List ? data : []);
        return casesList.map((c) => CaseModel.fromJson(c)).toList();
      }

      // Fallback: Query cases endpoint directly for published records
      final casesUri = Uri.parse('${ApiConfig.casesUrl}?status=Published');
      final casesRes =
          await http.get(casesUri).timeout(const Duration(seconds: 8));
      if (casesRes.statusCode == 200) {
        final data = jsonDecode(casesRes.body);
        final List casesList =
            data['data'] ?? data['cases'] ?? (data is List ? data : []);
        return casesList.map((c) => CaseModel.fromJson(c)).toList();
      }
    } catch (e) {
      debugPrint('Search Cases Exception: $e');
    }

    // Strictly DB only - NO dummy / mock data fallback!
    return [];
  }

  // 4. Fetch Case Detail by ID from Backend Database
  static Future<CaseModel?> getCaseById(String id) async {
    try {
      // 1. Try public judgment endpoint
      final publicRes = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/public/judgment/$id'))
          .timeout(const Duration(seconds: 8));
      if (publicRes.statusCode == 200) {
        final data = jsonDecode(publicRes.body);
        final caseData = data['data'] ?? data['case'] ?? data;
        if (caseData != null) {
          return CaseModel.fromJson(caseData);
        }
      }

      // 2. Try cases management endpoint
      final response = await http
          .get(Uri.parse('${ApiConfig.casesUrl}/$id'))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final caseData = data['case'] ?? data['data'] ?? data;
        if (caseData != null) {
          return CaseModel.fromJson(caseData);
        }
      }
    } catch (e) {
      debugPrint('Get Case By ID Exception: $e');
    }
    return null;
  }

  // 5. Fetch Unique Courts list from database (with in-memory instant cache)
  static List<String>? _cachedCourts;

  static Future<List<String>> getCourts() async {
    if (_cachedCourts != null && _cachedCourts!.isNotEmpty) {
      return _cachedCourts!;
    }
    try {
      final response = await http
          .get(Uri.parse(ApiConfig.courtsUrl))
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List courtsList = data['data'] ?? [];
        if (courtsList.isNotEmpty) {
          final list = courtsList.map((e) => e.toString()).toList();
          if (!list.contains('SC')) list.insert(0, 'SC');
          _cachedCourts = list;
          return list;
        }
      }
    } catch (e) {
      debugPrint('Get Courts Exception: $e');
    }
    const fallback = [
      'SC',
      'High Court of Madras',
      'Delhi High Court',
      'Bombay High Court',
      'Calcutta High Court'
    ];
    _cachedCourts = fallback;
    return fallback;
  }

  // 6. Fetch Saved Judgments for User
  static Future<List<CaseModel>> getSavedCases(String identifier) async {
    try {
      final response = await http
          .get(Uri.parse('${ApiConfig.savedCasesUrl}/$identifier'))
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List casesList = data['data'] ?? data['cases'] ?? [];
        return casesList.map((c) => CaseModel.fromJson(c)).toList();
      }

      debugPrint(
        'Get Saved Cases failed: ${response.statusCode} ${response.body}',
      );
    } catch (e) {
      debugPrint('Get Saved Cases Exception: $e');
    }

    return [];
  }

  // 7. Save/Update Saved Judgments for User
  static Future<List<CaseModel>> saveCases(
    String identifier,
    List<CaseModel> cases,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.savedCasesUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'identifier': identifier,
              'cases': cases.map((c) => c.toJson()).toList(),
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final List casesList = data['data'] ?? data['cases'] ?? [];
        return casesList.map((c) => CaseModel.fromJson(c)).toList();
      }

      debugPrint(
        'Save Cases failed: ${response.statusCode} ${response.body}',
      );
    } catch (e) {
      debugPrint('Save Cases Exception: $e');
    }

    return [];
  }
}



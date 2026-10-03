import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get userName => _user?.name ?? '';

  AuthProvider() {
    _loadSavedUser();
  }

  // Load saved session on app startup
  Future<void> _loadSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');

    if (userString != null) {
      try {
        _user = UserModel.fromJson(jsonDecode(userString));
        notifyListeners();
      } catch (e) {
        debugPrint('Error loading saved user: $e');
      }
    }
  }

  // Login with Mobile Number + 4-digit MPIN
  Future<bool> loginWithMobile({
    required String mobile,
    required String mpin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await ApiService.login(mobile, mpin);

      if (result == null) {
        _errorMessage = 'Invalid mobile number or MPIN.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _user = result;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(result.toJson()));

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Login error: $e');
      _errorMessage = 'Login failed. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Legacy login method
  Future<bool> login(String identifier, String password) async {
    return loginWithMobile(
      mobile: identifier,
      mpin: password,
    );
  }

  // Signup with Name + Mobile + DOB + 4-digit MPIN
  Future<bool> signup({
    required String name,
    required String mobile,
    required String dob,
    required String mpin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await ApiService.signup(
        name: name,
        mobile: mobile,
        dob: dob,
        mpin: mpin,
      );

      if (result == null) {
        _errorMessage = 'Signup failed. Please try again.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _user = result;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(result.toJson()));

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Signup error: $e');
      _errorMessage = 'Signup failed. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout action
  Future<void> logout() async {
    _user = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');

    notifyListeners();
  }
}

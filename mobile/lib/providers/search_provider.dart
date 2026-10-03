import 'dart:async';
import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../services/api_service.dart';

class SearchProvider extends ChangeNotifier {
  List<CaseModel> _homeCases = [];
  List<CaseModel> _cases = [];
  bool _isLoading = false;
  bool _isHomeLoading = false;
  String _selectedMode = 'keyword';
  String _selectedCourt = '';
  String _searchQuery = '';
  String _selectedYear = '';
  Timer? _debounceTimer;

  List<CaseModel> get homeCases => _homeCases;
  List<CaseModel> get cases => _cases;
  bool get isLoading => _isLoading;
  bool get isHomeLoading => _isHomeLoading;
  String get selectedMode => _selectedMode;
  String get selectedCourt => _selectedCourt;
  String get searchQuery => _searchQuery;
  String get selectedYear => _selectedYear;

  SearchProvider() {
    _homeCases = [];
    _cases = [];
    loadHomeFeed();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  /// Load published cases for the Home feed
  Future<void> loadHomeFeed() async {
    _isHomeLoading = true;
    notifyListeners();

    try {
      final results = await ApiService.searchCases(
        query: '',
        mode: 'all',
      );
      _homeCases = results;
    } catch (e) {
      debugPrint('SearchProvider loadHomeFeed error: $e');
    } finally {
      _isHomeLoading = false;
      notifyListeners();
    }
  }

  /// Clear any active search query and results
  void clearSearch() {
    _debounceTimer?.cancel();
    _searchQuery = '';
    _selectedCourt = '';
    _selectedYear = '';
    _cases = [];
    _isLoading = false;
    notifyListeners();
  }

  void setMode(String mode) {
    _selectedMode = mode;
    clearSearch();
  }

  void setCourt(String court) {
    if (_selectedCourt == court) {
      _selectedCourt = '';
    } else {
      _selectedCourt = court;
    }
    performSearch();
  }

  void setQuery(String query, {bool immediate = false}) {
    _searchQuery = query;
    _debounceTimer?.cancel();

    if (query.trim().isEmpty && _selectedCourt.isEmpty && _selectedYear.isEmpty) {
      _cases = [];
      _isLoading = false;
      notifyListeners();
      return;
    }

    if (immediate) {
      performSearch();
    } else {
      _debounceTimer = Timer(const Duration(milliseconds: 150), () {
        performSearch();
      });
    }
  }

  void setQueryAndCourt(String query, String court) {
    _searchQuery = query;
    _selectedCourt = court;
    _debounceTimer?.cancel();

    if (query.trim().isEmpty && court.trim().isEmpty) {
      _cases = [];
      _isLoading = false;
      notifyListeners();
      return;
    }

    performSearch();
  }

  void setYear(String year) {
    _selectedYear = year;
    performSearch();
  }

  Future<void> performSearch() async {
    // If no query and not home/all feed, return empty results immediately
    if (_selectedMode != 'all' &&
        _selectedMode != 'home' &&
        _searchQuery.trim().isEmpty &&
        _selectedCourt.trim().isEmpty &&
        _selectedYear.trim().isEmpty) {
      _cases = [];
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final results = await ApiService.searchCases(
        query: _searchQuery.trim(),
        mode: _selectedMode,
        court: _selectedCourt,
        year: _selectedYear,
      );
      _cases = results;
    } catch (e) {
      debugPrint('SearchProvider performSearch error: $e');
      _cases = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// High-speed structured citation search directly against backend database
  Future<void> searchByCitation({
    required String year,
    required String month,
    required String court,
    required String number,
  }) async {
    _debounceTimer?.cancel();
    _selectedMode = 'citation';
    _selectedYear = year;
    _selectedCourt = court;
    _searchQuery = '$year ($month) DLR ($court) #$number'.trim();

    _isLoading = true;
    notifyListeners();

    try {
      final results = await ApiService.searchCases(
        query: _searchQuery,
        mode: 'citation',
        court: court,
        year: year,
        month: month,
        number: number,
      );
      _cases = results;
    } catch (e) {
      debugPrint('SearchProvider searchByCitation error: $e');
      _cases = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

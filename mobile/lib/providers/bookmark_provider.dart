import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../services/api_service.dart';

class BookmarkProvider extends ChangeNotifier {
  final Map<String, CaseModel> _savedCases = {};
  String _identifier = '';

  List<CaseModel> get savedCases => _savedCases.values.toList();

  bool isCaseSaved(String id) {
    return _savedCases.containsKey(id);
  }

  Future<void> loadSavedCases(String identifier) async {
    final trimmedIdentifier = identifier.trim();

    if (trimmedIdentifier.isEmpty) {
      return;
    }

    _identifier = trimmedIdentifier;

    try {
      final cases = await ApiService.getSavedCases(_identifier);

      _savedCases
        ..clear()
        ..addEntries(
          cases.map(
            (caseItem) => MapEntry(
              caseItem.id,
              caseItem.copyWith(isSaved: true),
            ),
          ),
        );

      notifyListeners();
    } catch (e) {
      debugPrint('Load Saved Cases Exception: $e');
    }
  }

  void toggleSaveCase(CaseModel caseItem) {
    if (_savedCases.containsKey(caseItem.id)) {
      _savedCases.remove(caseItem.id);
    } else {
      _savedCases[caseItem.id] = caseItem.copyWith(isSaved: true);
    }

    notifyListeners();
    _persistSavedCases();
  }

  Future<void> _persistSavedCases() async {
    if (_identifier.isEmpty) {
      return;
    }

    try {
      await ApiService.saveCases(
        _identifier,
        savedCases,
      );
    } catch (e) {
      debugPrint('Persist Saved Cases Exception: $e');
    }
  }
}

class CaseModel {
  final String id;
  final String title;
  final String court;
  final String year;
  final String citation;
  final String headnote;
  final String content;
  final String caseNumber;
  final String appellant;
  final String respondent;
  final String judge;
  final String act;
  final String decisionDate;
  final bool isSaved;

  CaseModel({
    required this.id,
    required this.title,
    required this.court,
    required this.year,
    required this.citation,
    required this.headnote,
    required this.content,
    this.caseNumber = '',
    this.appellant = '',
    this.respondent = '',
    this.judge = '',
    this.act = '',
    this.decisionDate = '',
    this.isSaved = false,
  });

  String get formattedDate {
    if (decisionDate.isEmpty) return '';
    try {
      final parts = decisionDate.split('-');
      if (parts.length == 3) {
        return '${parts[2].padLeft(2, '0')}/${parts[1].padLeft(2, '0')}/${parts[0]}';
      }
    } catch (_) {}
    return decisionDate;
  }

  String get displayPetitioner {
    if (appellant.isNotEmpty) return appellant;
    final split = title.split(RegExp(r'\s+(?:vs\.?|v\.?|VERSUS)\s+', caseSensitive: false));
    if (split.isNotEmpty && split[0].trim().isNotEmpty) {
      return split[0].trim();
    }
    return title;
  }

  String get displayRespondent {
    if (respondent.isNotEmpty) return respondent;
    final split = title.split(RegExp(r'\s+(?:vs\.?|v\.?|VERSUS)\s+', caseSensitive: false));
    if (split.length > 1 && split[1].trim().isNotEmpty) {
      return split[1].trim();
    }
    return '';
  }

  factory CaseModel.fromJson(Map<String, dynamic> json) {
    // 1. Citation extraction from DB fields
    String parsedCitation = '';
    if (json['citation'] != null && json['citation'].toString().trim().isNotEmpty) {
      parsedCitation = json['citation'].toString().trim();
    } else if (json['citations'] != null) {
      final c = json['citations'];
      if (c is List && c.isNotEmpty) {
        final first = c[0];
        if (first is Map) {
          final year = first['year'] ?? '';
          final month = first['month'] != null && first['month'].toString().isNotEmpty ? '(${first['month']})' : '';
          final reporter = first['reporter'] ?? 'DLR';
          final court = first['court'] != null && first['court'].toString().isNotEmpty ? '(${first['court'].toString().toUpperCase()})' : '';
          final num = first['number'] ?? '';
          parsedCitation = '$year $month $reporter $court $num'.replaceAll(RegExp(r'\s+'), ' ').trim();
        } else {
          parsedCitation = first.toString();
        }
      } else if (c is Map) {
        parsedCitation = '${c['year'] ?? ''} ${c['reporter'] ?? 'DLR'} ${c['number'] ?? ''}'.trim();
      } else if (c is String && c.trim().isNotEmpty && c != '[]') {
        parsedCitation = c;
      }
    }
    if (parsedCitation.isEmpty && json['citation_number'] != null) {
      parsedCitation = json['citation_number'].toString().trim();
    }
    if (parsedCitation.isEmpty && json['case_number'] != null && json['case_number'].toString().trim().isNotEmpty) {
      parsedCitation = json['case_number'].toString().trim();
    }
    if (parsedCitation.isEmpty && json['caseNumber'] != null && json['caseNumber'].toString().trim().isNotEmpty) {
      parsedCitation = json['caseNumber'].toString().trim();
    }

    // 2. Title extraction from DB fields
    String parsedTitle = (json['title'] ?? json['case_name'] ?? '').toString().trim();
    if (parsedTitle.isEmpty) {
      final pet = (json['petitioner'] ?? json['petitioner_name'] ?? json['appellant'] ?? '').toString().trim();
      final res = (json['respondent'] ?? json['respondent_name'] ?? '').toString().trim();
      if (pet.isNotEmpty && res.isNotEmpty) {
        parsedTitle = '$pet vs. $res';
      } else if (pet.isNotEmpty) {
        parsedTitle = pet;
      } else {
        parsedTitle = json['case_number'] ?? 'Untitled Judgment';
      }
    }

    // 3. Clean HTML tags from headnote & judgment text while preserving paragraph breaks
    String rawHeadnote = (json['headnote'] ?? json['head_note'] ?? json['headNote'] ?? json['summary'] ?? '').toString();
    String cleanHeadnote = rawHeadnote
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'</li>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll(RegExp(r'[ \t]+'), ' ')
        .trim();

    String rawContent = (json['content'] ?? json['judgment_text'] ?? json['judgmentText'] ?? json['full_text'] ?? '').toString();
    String cleanContent = rawContent
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'</li>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll(RegExp(r'[ \t]+'), ' ')
        .trim();

    final rawCaseNumber = (json['case_number'] ?? json['caseNumber'] ?? '').toString().trim();
    
    // Act & section
    String actCombined = (json['act'] ?? json['act_name'] ?? '').toString().trim();
    final sec = (json['section'] ?? '').toString().trim();
    if (sec.isNotEmpty) {
      actCombined = actCombined.isNotEmpty ? '$actCombined; section $sec' : 'Section $sec';
    }

    return CaseModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      title: parsedTitle,
      court: (json['court'] ?? json['court_name'] ?? 'Supreme Court of India').toString(),
      year: (json['year'] ?? json['judgment_year'] ?? '2026').toString(),
      citation: parsedCitation.isNotEmpty ? parsedCitation : 'DLR Precedent',
      headnote: cleanHeadnote,
      content: cleanContent,
      caseNumber: rawCaseNumber,
      appellant: (json['appellant'] ?? json['petitioner'] ?? json['petitioner_name'] ?? '').toString().trim(),
      respondent: (json['respondent'] ?? json['respondent_name'] ?? '').toString().trim(),
      judge: (json['judge'] ?? json['coram'] ?? '').toString().trim(),
      act: actCombined,
      decisionDate: (json['decisionDate'] ?? json['decision_date'] ?? json['judgment_date'] ?? json['judgmentDate'] ?? '').toString().split('T')[0],
      isSaved: json['isSaved'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'court': court,
      'year': year,
      'citation': citation,
      'headnote': headnote,
      'content': content,
      'case_number': caseNumber,
      'appellant': appellant,
      'respondent': respondent,
      'judge': judge,
      'act': act,
      'decision_date': decisionDate,
      'isSaved': isSaved,
    };
  }

  CaseModel copyWith({bool? isSaved}) {
    return CaseModel(
      id: id,
      title: title,
      court: court,
      year: year,
      citation: citation,
      headnote: headnote,
      content: content,
      caseNumber: caseNumber,
      appellant: appellant,
      respondent: respondent,
      judge: judge,
      act: act,
      decisionDate: decisionDate,
      isSaved: isSaved ?? this.isSaved,
    );
  }
}


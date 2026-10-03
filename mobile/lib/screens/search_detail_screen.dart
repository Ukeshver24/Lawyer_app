import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/search_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_header.dart';
import '../widgets/case_card.dart';
import '../widgets/empty_state.dart';
import 'main_navigation_screen.dart';

class SearchDetailScreen extends StatefulWidget {
  final String modeKey;
  final String title;
  final String desc;
  final IconData icon;
  final String hint;

  const SearchDetailScreen({
    super.key,
    required this.modeKey,
    required this.title,
    required this.desc,
    required this.icon,
    required this.hint,
  });

  @override
  State<SearchDetailScreen> createState() => _SearchDetailScreenState();
}

class _SearchDetailScreenState extends State<SearchDetailScreen> {
  late final TextEditingController _textController;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController();
    _hasSearched = false;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final provider = Provider.of<SearchProvider>(context, listen: false);
        provider.setMode(widget.modeKey);
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final searchProvider = Provider.of<SearchProvider>(context);

    return Scaffold(
      appBar: AppHeader(
        showBackButton: true,
        backTooltip: 'Back',
        onBackTap: () {
          FocusManager.instance.primaryFocus?.unfocus();
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          } else {
            MainNavigationScreen.navigateToHome(context);
          }
        },
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Mode Header Banner Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x050F172A),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFDBEAFE)),
                    ),
                    child: Icon(
                      widget.icon,
                      color: const Color(0xFF1D4ED8),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.desc,
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 2. Search Input tailored to mode
            if (widget.modeKey == 'citation')
              _CitationBuilderBox(
                onCitationSearch: (year, month, court, number) {
                  setState(() {
                    _hasSearched = number.isNotEmpty || year.isNotEmpty;
                  });
                  searchProvider.searchByCitation(
                    year: year,
                    month: month,
                    court: court,
                    number: number,
                  );
                },
                onClear: () {
                  setState(() {
                    _hasSearched = false;
                  });
                  searchProvider.clearSearch();
                },
              )
            else if (widget.modeKey == 'party')
              _PartyNameSearchBox(
                onSearch: (partyQuery, courtFilter) {
                  setState(() {
                    _hasSearched = partyQuery.trim().isNotEmpty ||
                        courtFilter.trim().isNotEmpty;
                  });
                  searchProvider.setQueryAndCourt(partyQuery, courtFilter);
                },
                onClear: () {
                  setState(() {
                    _hasSearched = false;
                  });
                  searchProvider.clearSearch();
                },
              )

            else
              // Spacious, Large, High-Visibility Search Bar
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _hasSearched && _textController.text.isNotEmpty
                        ? const Color(0xFF2563EB)
                        : const Color(0xFFCBD5E1),
                    width: 1.6,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                    const BoxShadow(
                      color: Color(0x0A0F172A),
                      blurRadius: 4,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                padding: const EdgeInsets.fromLTRB(12, 6, 8, 6),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFDBEAFE)),
                      ),
                      child: const Icon(
                        Icons.search_rounded,
                        color: Color(0xFF1D4ED8),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        autofocus: false,
                        textInputAction: TextInputAction.search,
                        onChanged: (val) {
                          final hasText = val.trim().isNotEmpty;
                          setState(() {
                            _hasSearched = hasText;
                          });
                          if (hasText) {
                            searchProvider.setQuery(val);
                          } else {
                            searchProvider.clearSearch();
                          }
                        },
                        onSubmitted: (val) {
                          final hasText = val.trim().isNotEmpty;
                          setState(() {
                            _hasSearched = hasText;
                          });
                          if (hasText) {
                            searchProvider.setQuery(val, immediate: true);
                          } else {
                            searchProvider.clearSearch();
                          }
                        },
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          hintText: widget.hint,
                          hintStyle: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 13.5,
                            fontWeight: FontWeight.w400,
                            color: Color(0xFF94A3B8),
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    if (_textController.text.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.close_rounded,
                            size: 20, color: Color(0xFF64748B)),
                        tooltip: 'Clear query',
                        onPressed: () {
                          _textController.clear();
                          setState(() {
                            _hasSearched = false;
                          });
                          searchProvider.clearSearch();
                        },
                      ),
                    ElevatedButton(
                      onPressed: () {
                        final q = _textController.text.trim();
                        if (q.isNotEmpty) {
                          setState(() {
                            _hasSearched = true;
                          });
                          searchProvider.setQuery(q, immediate: true);
                          FocusManager.instance.primaryFocus?.unfocus();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1D4ED8),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        minimumSize: const Size(0, 36),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Search',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // 3. Search Results or Initial Guide State
            if (!_hasSearched) ...[
              // Prompt / Guidance Card - NO search results shown yet!
              const SizedBox(height: 20),
              _InitialSearchGuideCard(modeTitle: widget.title),
            ] else ...[
              const SizedBox(height: 18),
              const Divider(color: Color(0xFFE2E8F0), height: 1),
              const SizedBox(height: 14),

              // Search Results Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Search Results',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFDBEAFE)),
                        ),
                        child: Text(
                          '${searchProvider.cases.length}',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1D4ED8),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (searchProvider.isLoading)
                    const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 15,
                          height: 15,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF1D4ED8),
                          ),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Searching...',
                          style: TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Case Cards or Empty State
              if (searchProvider.isLoading && searchProvider.cases.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 48),
                  alignment: Alignment.center,
                  child: const Column(
                    children: [
                      SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                      SizedBox(height: 12),
                      Text(
                        'Searching all case records & full judgments...',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                )
              else if (searchProvider.cases.isEmpty)
                EmptyStateWidget(
                  title: 'No matching judgments found',
                  message:
                      'Searched all case titles, parties, acts, sections, headnotes, and full judgments. Try different keywords or terms.',
                  onActionTap: () {
                    _textController.clear();
                    setState(() {
                      _hasSearched = false;
                    });
                    searchProvider.clearSearch();
                  },
                  actionLabel: 'Reset Search',
                )
              else
                ...searchProvider.cases.map((c) => CaseCard(caseItem: c)),
            ],
          ],
        ),
      ),
    );
  }
}



/// Structured Citation Search Builder Box Widget
class _CitationBuilderBox extends StatefulWidget {
  final Function(String year, String month, String court, String number) onCitationSearch;
  final VoidCallback onClear;

  const _CitationBuilderBox({
    required this.onCitationSearch,
    required this.onClear,
  });

  @override
  State<_CitationBuilderBox> createState() => _CitationBuilderBoxState();
}

class _CitationBuilderBoxState extends State<_CitationBuilderBox> {
  final _yearController = TextEditingController(text: '2026');
  final _monthController = TextEditingController();
  final _countController = TextEditingController();

  List<String> _courtList = ['SC'];
  String _selectedCourt = 'SC';

  @override
  void initState() {
    super.initState();
    _loadCourts();
  }

  void _loadCourts() async {
    final courts = await ApiService.getCourts();
    if (mounted && courts.isNotEmpty) {
      setState(() {
        _courtList = courts;
        if (!_courtList.contains(_selectedCourt)) {
          _selectedCourt = _courtList.first;
        }
      });
    }
  }

  @override
  void dispose() {
    _yearController.dispose();
    _monthController.dispose();
    _countController.dispose();
    super.dispose();
  }

  void _triggerSearch() {
    final year = _yearController.text.trim();
    final month = _monthController.text.trim();
    final court = _selectedCourt.trim();
    final count = _countController.text.trim().replaceAll('#', '');

    widget.onCitationSearch(
      year.isEmpty ? '2026' : year,
      month,
      court,
      count,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Year (4 digits) | Month (2 digits) | Reporter (DLR) | Court (Dropdown)
          Row(
            children: [
              Expanded(
                flex: 3,
                child: _LabeledField(
                  label: 'Year',
                  hint: '2026',
                  controller: _yearController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(4),
                  ],
                  maxLength: 4,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                flex: 2,
                child: _LabeledField(
                  label: 'Month',
                  hint: 'MM',
                  controller: _monthController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(2),
                  ],
                  maxLength: 2,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Reporter',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Container(
                      height: 34,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'DLR',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Court',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Container(
                      height: 34,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _courtList.contains(_selectedCourt)
                              ? _selectedCourt
                              : _courtList.first,
                          isExpanded: true,
                          icon: const Icon(Icons.arrow_drop_down_rounded,
                              size: 18, color: Color(0xFF64748B)),
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                          items: _courtList.map((c) {
                            return DropdownMenuItem<String>(
                              value: c,
                              child: Text(
                                c,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            );
                          }).toList(),
                          onChanged: (newVal) {
                            if (newVal != null) {
                              setState(() {
                                _selectedCourt = newVal;
                              });
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Row 2: Count / Citation Number (#) field
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Citation Number (#)',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 9.5,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 3),
              SizedBox(
                height: 36,
                child: TextField(
                  controller: _countController,
                  keyboardType: TextInputType.text,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _triggerSearch(),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9a-zA-Z]')),
                  ],
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(left: 10, right: 6, top: 9, bottom: 9),
                      child: Text(
                        '#',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                    ),
                    prefixIconConstraints:
                        const BoxConstraints(minWidth: 0, minHeight: 0),
                    hintText: 'Enter Number (e.g. 1, 01, 1A, 42B)',
                    hintStyle: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11.5,
                      color: Color(0xFF94A3B8),
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide:
                          const BorderSide(color: Color(0xFF1D4ED8), width: 1.5),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Row 3: Action Buttons (Clear & Get Citation)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: () {
                  _yearController.text = '2026';
                  _monthController.clear();
                  _countController.clear();
                  setState(() {
                    _selectedCourt = 'SC';
                  });
                  widget.onClear();
                },
                icon: const Icon(Icons.refresh_rounded,
                    size: 14, color: Color(0xFF64748B)),
                label: const Text(
                  'Clear',
                  style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11.5,
                      color: Color(0xFF64748B)),
                ),
              ),
              ElevatedButton.icon(
                onPressed: _triggerSearch,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.search_rounded, size: 14),
                label: const Text(
                  'Get Citation',
                  style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Structured Party Name Search Box
class _PartyNameSearchBox extends StatefulWidget {
  final Function(String query, String court) onSearch;
  final VoidCallback onClear;

  const _PartyNameSearchBox({
    required this.onSearch,
    required this.onClear,
  });

  @override
  State<_PartyNameSearchBox> createState() => _PartyNameSearchBoxState();
}

class _PartyNameSearchBoxState extends State<_PartyNameSearchBox> {
  final _partyController = TextEditingController();
  String _selectedCourt = 'All Courts';

  @override
  void dispose() {
    _partyController.dispose();
    super.dispose();
  }

  void _triggerSearch() {
    final party = _partyController.text.trim();
    final court = _selectedCourt == 'All Courts' ? '' : _selectedCourt;
    widget.onSearch(party, court);
  }

  @override
  Widget build(BuildContext context) {
    final searchProvider = Provider.of<SearchProvider>(context);

    final List<String> availableCourts = ['All Courts'];
    final courtSource = searchProvider.homeCases.isNotEmpty
        ? searchProvider.homeCases
        : searchProvider.cases;
    for (final c in courtSource) {
      if (c.court.isNotEmpty && !availableCourts.contains(c.court)) {
        availableCourts.add(c.court);
      }
    }

    if (!availableCourts.contains(_selectedCourt)) {
      _selectedCourt = 'All Courts';
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SELECT COURT & ENTER PARTY NAME',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 10.5,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedCourt,
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded,
                    size: 18, color: Color(0xFF64748B)),
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
                items: availableCourts.map((court) {
                  return DropdownMenuItem<String>(
                    value: court,
                    child: Text(court),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedCourt = val);
                    _triggerSearch();
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 36,
                  child: TextField(
                    controller: _partyController,
                    style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: Color(0xFF0F172A)),
                    decoration: InputDecoration(
                      hintText: 'Type Party Name / Case Title',
                      hintStyle: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          color: Color(0xFF94A3B8)),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 8),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(
                            color: Color(0xFF1D4ED8), width: 1.5),
                      ),
                    ),
                    onSubmitted: (_) => _triggerSearch(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: _triggerSearch,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  minimumSize: const Size(0, 36),
                  elevation: 0,
                ),
                icon: const Icon(Icons.search_rounded, size: 13),
                label: const Text(
                  'Find Case',
                  style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLength;

  const _LabeledField({
    required this.label,
    required this.hint,
    required this.controller,
    this.keyboardType,
    this.inputFormatters,
    this.maxLength,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 9.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 3),
        SizedBox(
          height: 34,
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            maxLength: maxLength,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              counterText: '',
              hintText: hint,
              hintStyle: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 10.5,
                  color: Color(0xFF94A3B8)),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide:
                    const BorderSide(color: Color(0xFF1D4ED8), width: 1.5),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _InitialSearchGuideCard extends StatelessWidget {
  final String modeTitle;
  const _InitialSearchGuideCard({required this.modeTitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060F172A),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x202563EB),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              Icons.search_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Instant Precedent Search',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Type any query above to search across all details of published cases in lightning speed:',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 12.5,
              color: Color(0xFF64748B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
          const Column(
            children: [
              Row(
                children: [
                  _SearchScopeTag(
                      label: 'Case Title & Number', icon: Icons.gavel_rounded),
                  SizedBox(width: 8),
                  _SearchScopeTag(
                      label: 'Petitioner & Respondent',
                      icon: Icons.people_outline_rounded),
                ],
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  _SearchScopeTag(
                      label: 'Full Judgment Text',
                      icon: Icons.description_outlined),
                  SizedBox(width: 8),
                  _SearchScopeTag(
                      label: 'Headnote & Summary',
                      icon: Icons.summarize_outlined),
                ],
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  _SearchScopeTag(
                      label: 'Acts & Sections', icon: Icons.menu_book_rounded),
                  SizedBox(width: 8),
                  _SearchScopeTag(
                      label: 'Citations & DLR',
                      icon: Icons.format_quote_rounded),
                ],
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  _SearchScopeTag(
                      label: 'Court & Bench',
                      icon: Icons.account_balance_outlined),
                  SizedBox(width: 8),
                  _SearchScopeTag(
                      label: 'Decision Date & Year',
                      icon: Icons.calendar_today_outlined),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_outlined,
                    size: 18, color: Color(0xFF1D4ED8)),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Every field entered during Add Case is fully indexed for real-time instant results.',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF475569),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchScopeTag extends StatelessWidget {
  final String label;
  final IconData icon;

  const _SearchScopeTag({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        height: 38,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(9),
          border: Border.all(color: const Color(0xFFDBEAFE)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: const Color(0xFF1D4ED8)),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E40AF),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

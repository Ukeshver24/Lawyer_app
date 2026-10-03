import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/case_model.dart';
import '../providers/auth_provider.dart';
import '../providers/bookmark_provider.dart';
import '../screens/case_detail_screen.dart';
import '../screens/login_screen.dart';
import 'app_toast.dart';

class CaseCard extends StatelessWidget {
  final CaseModel caseItem;
  final bool showBookmark;

  const CaseCard({
    super.key,
    required this.caseItem,
    this.showBookmark = false,
  });

  String _cleanText(String raw) {
    if (raw.isEmpty) return '';
    return raw
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'</li>', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&ndash;', '-')
        .replaceAll('&mdash;', '-')
        .replaceAll(RegExp(r'[ \t\n\r]+'), ' ')
        .trim();
  }

  void _onReadFullJudgmentTap(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    if (!authProvider.isAuthenticated) {
      AppToast.showInfo(
        context,
        'Please sign in with your Mobile to read full judgment.',
      );
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => LoginScreen(
            targetScreen: CaseDetailScreen(caseItem: caseItem),
          ),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CaseDetailScreen(caseItem: caseItem),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookmarkProvider = Provider.of<BookmarkProvider>(context);
    final isSaved = bookmarkProvider.isCaseSaved(caseItem.id);

    final displayCourt = caseItem.court.trim().isNotEmpty
        ? caseItem.court.trim()
        : 'Supreme Court of India';

    final displayHeadnote = caseItem.headnote.trim().isNotEmpty
        ? _cleanText(caseItem.headnote)
        : 'Headnote summary will be updated once published by the editorial bench.';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          splashColor: const Color(0x0A2563EB),
          highlightColor: Colors.transparent,
          onTap: () => _onReadFullJudgmentTap(context),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Court Name Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(7),
                              border: Border.all(color: const Color(0xFFDBEAFE)),
                            ),
                            child: const Icon(
                              Icons.account_balance_rounded,
                              size: 15,
                              color: Color(0xFF1D4ED8),
                            ),
                          ),
                          const SizedBox(width: 9),
                          Expanded(
                            child: Text(
                              displayCourt,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (showBookmark)
                      IconButton(
                        constraints: const BoxConstraints(),
                        padding: EdgeInsets.zero,
                        icon: Icon(
                          isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                          color: isSaved ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                          size: 20,
                        ),
                        onPressed: () {
                          bookmarkProvider.toggleSaveCase(caseItem);
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // 2. Headnote Summary (Strictly Justified)
                Text(
                  displayHeadnote,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.justify,
                  style: const TextStyle(
                    fontFamily: 'Times New Roman',
                    fontSize: 14.0,
                    color: Color(0xFF334155),
                    height: 1.5,
                    fontWeight: FontWeight.normal,
                  ),
                ),
                const SizedBox(height: 14),

                // 3. View Full Judgment Action Button (Compact & Short)
                Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 13,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'View Full Judgment',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.2,
                          ),
                        ),
                        SizedBox(width: 5),
                        Icon(
                          Icons.arrow_forward_rounded,
                          color: Color(0xFF60A5FA),
                          size: 13,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

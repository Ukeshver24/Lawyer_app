import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/app_header.dart';
import '../widgets/case_card.dart';
import '../providers/bookmark_provider.dart';

class SavedCasesScreen extends StatelessWidget {
  const SavedCasesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bookmarkProvider = Provider.of<BookmarkProvider>(context);
    final savedList = bookmarkProvider.savedCases;

    return Scaffold(
      appBar: const AppHeader(),
      backgroundColor: const Color(0xFFFAFBFF),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bookmark, color: Color(0xFF2563EB), size: 24),
                const SizedBox(width: 8),
                const Text(
                  'Saved Judgments',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${savedList.length} Saved',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Expanded(
              child: savedList.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.bookmark_outline,
                              size: 54, color: Colors.grey[300]),
                          const SizedBox(height: 12),
                          const Text(
                            'No bookmarked judgments yet.',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF475569),
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Tap the bookmark icon on any judgment to save it for quick offline reading.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                fontSize: 12, color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      physics: const ClampingScrollPhysics(),
                      itemCount: savedList.length,
                      itemBuilder: (context, index) {
                        return CaseCard(
                          caseItem: savedList[index],
                          showBookmark: true,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

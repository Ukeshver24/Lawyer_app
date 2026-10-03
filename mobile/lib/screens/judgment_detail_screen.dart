import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../theme/app_colors.dart';
import '../widgets/app_header.dart';

class JudgmentDetailScreen extends StatefulWidget {
  final CaseModel caseItem;

  const JudgmentDetailScreen({super.key, required this.caseItem});

  @override
  State<JudgmentDetailScreen> createState() => _JudgmentDetailScreenState();
}

class _JudgmentDetailScreenState extends State<JudgmentDetailScreen> {
  double _fontSize = 13.0;
  bool _isBookmarked = false;

  @override
  Widget build(BuildContext context) {
    final c = widget.caseItem;

    return Scaffold(
      appBar: const AppHeader(showBackButton: true),
      backgroundColor: AppColors.appBackground,
      body: Column(
        children: [
          // Top Dark Action Bar (Toolbar)
          Container(
            color: const Color(0xFF0F172A),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white, size: 18),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      'Judgment Reader',
                      style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),

                Row(
                  children: [
                    // Text Resizer
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: () => setState(() => _fontSize = (_fontSize - 1).clamp(11.0, 18.0)),
                            child: const Text('A-', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 6),
                          Text('${_fontSize.toInt()}px', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                          const SizedBox(width: 6),
                          InkWell(
                            onTap: () => setState(() => _fontSize = (_fontSize + 1).clamp(11.0, 18.0)),
                            child: const Text('A+', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Bookmark Button
                    IconButton(
                      icon: Icon(
                        _isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                        color: _isBookmarked ? const Color(0xFFFACC15) : Colors.white70,
                        size: 20,
                      ),
                      onPressed: () {
                        setState(() => _isBookmarked = !_isBookmarked);
                      },
                    ),

                    // Share Button
                    const Icon(Icons.share, color: Colors.white70, size: 18),
                  ],
                ),
              ],
            ),
          ),

          // Legal Document Reader Body (Formated 1:1 matching website photo layout)
          Expanded(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.borderSlate),
                  boxShadow: const [
                    BoxShadow(color: Color(0x06000000), blurRadius: 6, offset: Offset(0, 2)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Official Citation Header
                    Text(
                      c.citation,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 4),

                    // Court Name
                    Text(
                      c.court.toUpperCase(),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlue, letterSpacing: 1.2),
                    ),
                    const SizedBox(height: 16),

                    // Appellant vs Respondent Section
                    Text(
                      '${c.appellant.isNotEmpty ? c.appellant : c.title} ... Appellant(s);',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    const Text('Versus', style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textMuted)),
                    const SizedBox(height: 4),
                    Text(
                      '${c.respondent.isNotEmpty ? c.respondent : "OTHERS"} ... Respondent(s).',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 16),

                    // Appeal Number & Decision Date Box
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.appBackground,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.borderSlate),
                      ),
                      child: Column(
                        children: [
                          Text(
                            c.act.isNotEmpty ? c.act : 'CIVIL APPEAL NO. 7839 OF 2014',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Decided on ${c.decisionDate.isNotEmpty ? c.decisionDate : c.year}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryBlue),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // HEAD NOTE & RATIO DECIDENDI
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'HEAD NOTE & RATIO DECIDENDI',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.primaryNavy, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            c.headnote,
                            style: TextStyle(fontSize: _fontSize, height: 1.5, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Full Judgment Text
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'FULL JUDGMENT & ORDER',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 0.5),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      c.content,
                      style: TextStyle(fontSize: _fontSize, height: 1.6, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

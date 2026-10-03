import 'package:flutter/material.dart';
import '../widgets/app_header.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppHeader(
        showBackButton: true,
        onBackTap: () => Navigator.pop(context),
      ),
      backgroundColor: const Color(0xFFFAFBFF),
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.shield, color: Color(0xFF2563EB), size: 14),
                  SizedBox(width: 6),
                  Text(
                    'VERIFIED LEGAL REPOSITORY',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1D4ED8),
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            const Text(
              'About Digi Law Reporter',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),

            const Text(
              'Digi Law Reporter is India\'s premier verified legal research platform, serving advocates, judicial officers, and legal scholars with sub-second search accuracy across Supreme Court and High Court judgments.',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF475569),
                height: 1.6,
              ),
            ),
            const SizedBox(height: 24),

            // 3 Pillar Cards
            const _InfoCard(
              icon: Icons.flash_on,
              title: 'Sub-Second Search Engine',
              description:
                  'Delivering instant results across 2.4+ million verbatim judgments, headnotes, and official reporter citations.',
            ),
            const SizedBox(height: 12),
            const _InfoCard(
              icon: Icons.verified_user_outlined,
              title: '100% Certified Court Records',
              description:
                  'Every judgment in our repository is cross-referenced with official registry records for absolute courtroom authority.',
            ),
            const SizedBox(height: 12),
            const _InfoCard(
              icon: Icons.security,
              title: 'Bank-Grade SSL Security',
              description:
                  'All searches, user bookmarks, and session tokens are encrypted end-to-end for confidentiality.',
            ),
            const SizedBox(height: 24),

            // Contact Info Callout Box
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'DIGITAL LAW REPORTER INDIA',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF60A5FA),
                      letterSpacing: 1.0,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Legal Complex, High Court Road, New Delhi, India',
                    style: TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Email: support@digilawreporter.in | Phone: +91 98765 43210',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _InfoCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF2563EB), size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    height: 1.4,
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

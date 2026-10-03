import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';
import '../screens/main_navigation_screen.dart';

class HeroSearchSection extends StatelessWidget {
  const HeroSearchSection({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isLoggedIn = authProvider.isAuthenticated;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 4.0),
      padding: const EdgeInsets.all(12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060F172A),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Digital Lawyer Suite Badge & Live Status Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(7),
                  border: Border.all(color: const Color(0xFFDBEAFE)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.balance_rounded, size: 12, color: Color(0xFF1D4ED8)),
                    SizedBox(width: 4),
                    Text(
                      'DIGI LAW REPORTER',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                        color: Color(0xFF1D4ED8),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(7),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 5.5,
                      height: 5.5,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      '1950 – 2026 Archive',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // 2. Main Title Only (No descriptions)
          const Text(
            'Digital Legal Precedents & Research',
            style: TextStyle(
              fontSize: 15.5,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 9),

          // 3. Compact Feature Highlights - Title Only
          const Row(
            children: [
              Expanded(
                child: _FeatureHighlightCard(
                  icon: Icons.account_balance_rounded,
                  iconColor: Color(0xFF2563EB),
                  title: 'Apex & High Courts',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _FeatureHighlightCard(
                  icon: Icons.format_quote_rounded,
                  iconColor: Color(0xFFD97706),
                  title: 'Certified Citations',
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Row(
            children: [
              Expanded(
                child: _FeatureHighlightCard(
                  icon: Icons.menu_book_rounded,
                  iconColor: Color(0xFF059669),
                  title: 'Acts & Sections',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _FeatureHighlightCard(
                  icon: Icons.verified_rounded,
                  iconColor: Color(0xFF7C3AED),
                  title: 'Verified Headnotes',
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),

          // 4. Compact Action Button
          if (!isLoggedIn)
            InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const LoginScreen(
                      targetScreen: MainNavigationScreen(initialIndex: 1),
                    ),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(11),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(11),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock_outline_rounded, color: Colors.white, size: 15),
                    SizedBox(width: 6),
                    Text(
                      'Login to Access Full Judgments',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                    SizedBox(width: 5),
                    Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                  ],
                ),
              ),
            )
          else
            InkWell(
              onTap: () {
                MainNavigationScreen.setTab(context, 1);
              },
              borderRadius: BorderRadius.circular(11),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(11),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.explore_rounded, color: Colors.white, size: 15),
                    SizedBox(width: 6),
                    Text(
                      'Explore Legal Repository',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                    SizedBox(width: 5),
                    Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FeatureHighlightCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;

  const _FeatureHighlightCard({
    required this.icon,
    required this.iconColor,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6.5),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 13.5, color: iconColor),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../screens/main_navigation_screen.dart';

class ExploreCourtsSection extends StatelessWidget {
  const ExploreCourtsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header: "Explore Courts" & "View All →"
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Explore Courts',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    MainNavigationScreen.setTab(context, 1);
                  },
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Row(
                    children: [
                      Text(
                        'View All',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(Icons.arrow_forward,
                          size: 11, color: AppColors.primaryBlue),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Fixed 3-Column Non-Scrolling Row Layout
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: SizedBox(
              height: 88,
              child: Row(
                children: [
                  Expanded(
                    child: _CourtCardItem(
                      title: 'Supreme Court',
                      subtitle: 'Full Archive',
                      range: '1950–Present',
                      icon: Icons.account_balance,
                      onTap: () {
                        MainNavigationScreen.setTab(context, 1);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _CourtCardItem(
                      title: 'High Courts',
                      subtitle: 'All States',
                      range: '1950–Present',
                      icon: Icons.gavel,
                      onTap: () {
                        MainNavigationScreen.setTab(context, 1);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _CourtCardItem(
                      title: 'Tribunals',
                      subtitle: 'NCLAT, NGT',
                      range: '& more',
                      icon: Icons.balance,
                      onTap: () {
                        MainNavigationScreen.setTab(context, 1);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CourtCardItem extends StatelessWidget {
  final String title;
  final String subtitle;
  final String range;
  final IconData icon;
  final VoidCallback onTap;

  const _CourtCardItem({
    required this.title,
    required this.subtitle,
    required this.range,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSlate, width: 1),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashFactory: NoSplash.splashFactory,
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(
                        icon,
                        color: AppColors.primaryBlue,
                        size: 13,
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios,
                      size: 8,
                      color: AppColors.textMuted,
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      '$subtitle • $range',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 8.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

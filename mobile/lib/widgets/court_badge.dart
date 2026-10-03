import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CourtBadge extends StatelessWidget {
  final String courtName;

  const CourtBadge({super.key, required this.courtName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.blueSurface,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.blueBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.account_balance, size: 12, color: AppColors.primaryBlue),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              courtName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryNavy,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

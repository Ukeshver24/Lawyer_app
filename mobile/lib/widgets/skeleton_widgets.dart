import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Reusable Shimmer/Skeleton Box Widget
class SkeletonBox extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8.0,
  });

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.4, end: 0.85).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: AppColors.skeletonBase.withValues(alpha: _animation.value),
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
        );
      },
    );
  }
}

/// Case Card Skeleton loader
class CaseCardSkeleton extends StatelessWidget {
  const CaseCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSlate),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              SkeletonBox(width: 140, height: 20, borderRadius: 6),
              SkeletonBox(width: 80, height: 20, borderRadius: 6),
            ],
          ),
          SizedBox(height: 12),
          SkeletonBox(width: double.infinity, height: 18, borderRadius: 4),
          SizedBox(height: 8),
          SkeletonBox(width: 220, height: 18, borderRadius: 4),
          SizedBox(height: 12),
          SkeletonBox(width: double.infinity, height: 14, borderRadius: 4),
          SizedBox(height: 6),
          SkeletonBox(width: 180, height: 14, borderRadius: 4),
          SizedBox(height: 14),
          Divider(color: AppColors.borderSlate, height: 1),
          SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              SkeletonBox(width: 80, height: 14, borderRadius: 4),
              SkeletonBox(width: 120, height: 14, borderRadius: 4),
            ],
          ),
        ],
      ),
    );
  }
}

/// Home Screen Skeleton loader
class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonBox(width: 160, height: 16, borderRadius: 4),
          SizedBox(height: 8),
          SkeletonBox(width: 240, height: 24, borderRadius: 6),
          SizedBox(height: 16),
          CaseCardSkeleton(),
          CaseCardSkeleton(),
          CaseCardSkeleton(),
        ],
      ),
    );
  }
}

/// Search Results Skeleton loader
class SearchResultSkeleton extends StatelessWidget {
  const SearchResultSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        CaseCardSkeleton(),
        CaseCardSkeleton(),
        CaseCardSkeleton(),
      ],
    );
  }
}

/// Profile Skeleton loader
class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSlate),
      ),
      child: const Column(
        children: [
          SkeletonBox(width: 72, height: 72, borderRadius: 36),
          SizedBox(height: 14),
          SkeletonBox(width: 140, height: 20, borderRadius: 6),
          SizedBox(height: 8),
          SkeletonBox(width: 180, height: 14, borderRadius: 4),
        ],
      ),
    );
  }
}

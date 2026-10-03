import 'package:flutter/material.dart';

/// Centralized Design System Colors for Digital Law Reporter Mobile
class AppColors {
  // Primary Navy Family
  static const Color darkNavy = Color(0xFF0A1128);      // Darkest Navy / major dark sections
  static const Color slate950 = Color(0xFF0F172A);      // Slate 950 / headings and dark UI
  static const Color primaryNavy = Color(0xFF1E3A8A);   // Primary 900 Navy Blue
  static const Color deepNavy = Color(0xFF172554);      // Deep Navy / dark footer or special sections

  // Brand Blue Family
  static const Color primaryBlue = Color(0xFF2563EB);   // Primary button blue / important actions
  static const Color activeBlue = Color(0xFF3B82F6);    // Active links / icons / highlights
  static const Color lightBlue = Color(0xFF60A5FA);     // Light blue accent
  static const Color blueSurface = Color(0xFFEFF6FF);   // Subtle blue container background
  static const Color blueBorder = Color(0xFFBFDBFE);    // Subtle blue border

  // Backgrounds & Surfaces
  static const Color appBackground = Color(0xFFFAFBFF); // Main application background
  static const Color surfaceWhite = Color(0xFFFFFFFF);  // Cards / surfaces / inputs
  static const Color borderSlate = Color(0xFFE2E8F0);   // Borders / dividers
  static const Color subtleSlate = Color(0xFFF8FAFC);   // Input background / subtle card

  // Gold & Summary Accents
  static const Color goldAccent = Color(0xFFD4AF37);    // Very subtle legal/premium accent
  static const Color headnoteBg = Color(0xFFFFFBEB);    // Headnote / summary background
  static const Color amberBorder = Color(0xFFFDE68A);   // Amber border
  static const Color amberText = Color(0xFFB45309);     // Amber text title

  // Text Family
  static const Color textPrimary = Color(0xFF0F172A);   // Primary text
  static const Color textSecondary = Color(0xFF475569); // Secondary text
  static const Color textMuted = Color(0xFF64748B);     // Metadata / muted text
  static const Color textWhite = Color(0xFFFFFFFF);     // Text on dark backgrounds

  // Status & Skeleton Colors
  static const Color skeletonBase = Color(0xFFE2E8F0);
  static const Color skeletonHighlight = Color(0xFFF1F5F9);
  static const Color successGreen = Color(0xFF16A34A);
  static const Color errorRed = Color(0xFFDC2626);
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Brand palette — ported 1:1 from mobile/src/index.css @theme tokens.
class AppColors {
  // Surfaces
  static const surface = Color(0xFFFFF8F7);
  static const surfaceDim = Color(0xFFF2D3D0);
  static const lowest = Color(0xFFFFFFFF);
  static const low = Color(0xFFFFF0EF);
  static const container = Color(0xFFFFE9E7);
  static const high = Color(0xFFFFE2DF);
  static const highest = Color(0xFFFADBD9);

  // Text / ink
  static const onSurface = Color(0xFF281716);
  static const onSurfaceVariant = Color(0xFF5C403E);
  static const inverseSurface = Color(0xFF3F2C2A);
  static const inverseOnSurface = Color(0xFFFFEDEB);

  // Outline
  static const outline = Color(0xFF906F6C);
  static const outlineVariant = Color(0xFFE5BDBA);

  // Primary (brand red)
  static const primary = Color(0xFF870012);
  static const primaryContainer = Color(0xFFB3001B);
  static const onPrimaryContainer = Color(0xFFFFBEB9);
  static const primaryFixed = Color(0xFFFFDAD7);

  // Secondary
  static const secondary = Color(0xFFAC3236);
  static const secondaryContainer = Color(0xFFFC6D6C);

  // Semantic status colors (used across feed/detail/my-reports)
  static const successBg = Color(0xFFE8F5E9);
  static const successFg = Color(0xFF2E7D32);
  static const rejectBg = Color(0xFFFCE4EC);
  static const rejectFg = Color(0xFFC62828);
  static const pendingBg = Color(0xFFF5F5F5);

  // Misc shades referenced literally in the React source
  static const ink = Color(0xFF1C0F0E);
  static const mutedInk = Color(0xFF8A6260);
  static const faintInk = Color(0xFFA08280);
  static const hairline = Color(0xFFF0DBD9);
}

/// The brand-red gradient used on coin/balance banners (coin-shimmer-bg).
const kBrandGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [AppColors.primary, AppColors.primaryContainer],
);

class AppTheme {
  static ThemeData build() {
    final base = ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.surface,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        surface: AppColors.surface,
        brightness: Brightness.light,
      ),
      splashColor: AppColors.primary.withOpacity(0.08),
      highlightColor: Colors.transparent,
    );

    // Hanken Grotesk == display font; Plus Jakarta Sans == body font.
    final sans = GoogleFonts.plusJakartaSansTextTheme(base.textTheme);

    return base.copyWith(
      textTheme: sans.apply(
        bodyColor: AppColors.onSurface,
        displayColor: AppColors.onSurface,
      ),
    );
  }

  /// Display (Hanken Grotesk) text style helper for headings.
  static TextStyle display({
    double size = 16,
    FontWeight weight = FontWeight.w800,
    Color color = AppColors.onSurface,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.hankenGrotesk(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      letterSpacing: letterSpacing,
    );
  }
}

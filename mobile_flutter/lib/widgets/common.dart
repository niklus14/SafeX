/// Shared UI helpers used across screens.
library;

import 'dart:io';
import 'package:flutter/material.dart';
import '../theme.dart';

/// Network/file image with a graceful brand-tinted fallback box.
class AppImage extends StatelessWidget {
  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;
  const AppImage(this.url,
      {super.key,
      this.fit = BoxFit.cover,
      this.width,
      this.height});

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: width,
      height: height,
      color: AppColors.highest,
      alignment: Alignment.center,
      child: const Icon(Icons.image_outlined, color: AppColors.outlineVariant),
    );

    if (url.isEmpty) return fallback;

    Widget img;
    if (url.startsWith('http')) {
      img = Image.network(url,
          fit: fit,
          width: width,
          height: height,
          errorBuilder: (_, __, ___) => fallback);
    } else if (url.startsWith('data:')) {
      // data URI — rare on Flutter; show fallback.
      img = fallback;
    } else {
      img = Image.file(File(url),
          fit: fit,
          width: width,
          height: height,
          errorBuilder: (_, __, ___) => fallback);
    }
    return img;
  }
}

/// Status pill colors keyed by the AZ display status.
class StatusStyle {
  final String label;
  final Color bg;
  final Color fg;
  const StatusStyle(this.label, this.bg, this.fg);

  static StatusStyle of(String status) {
    switch (status) {
      case 'HƏLL EDİLDİ':
        return const StatusStyle('Həll edildi', AppColors.successBg, AppColors.successFg);
      case 'İCRADADIR':
        return const StatusStyle('İcradadır', AppColors.low, AppColors.primary);
      case 'İMTİNA EDİLDİ':
        return const StatusStyle('İmtina edildi', AppColors.rejectBg, AppColors.rejectFg);
      default:
        return const StatusStyle('Gözləyir', AppColors.pendingBg, AppColors.onSurfaceVariant);
    }
  }
}

/// Small rounded pill.
class Pill extends StatelessWidget {
  final String text;
  final Color bg;
  final Color fg;
  final double fontSize;
  const Pill(this.text,
      {super.key, required this.bg, required this.fg, this.fontSize = 10});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(text,
          style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
              color: fg,
              letterSpacing: 0.4)),
    );
  }
}

/// Avatar from two initials.
class InitialAvatar extends StatelessWidget {
  final String name;
  final double size;
  final Color bg;
  final Color fg;
  const InitialAvatar(this.name,
      {super.key,
      this.size = 40,
      this.bg = AppColors.primary,
      this.fg = Colors.white});

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    final letters = parts.map((p) => p.isNotEmpty ? p[0] : '').join();
    return letters.length > 2 ? letters.substring(0, 2).toUpperCase() : letters.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Text(_initials,
          style: TextStyle(
              color: fg, fontWeight: FontWeight.w800, fontSize: size * 0.32)),
    );
  }
}

/// Shell chrome: top header, bottom nav with center camera FAB, and toast.
/// Ported from the ShellHeader / BottomNav / Toast widgets in App.tsx.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';
import 'common.dart';

class ShellHeader extends StatelessWidget implements PreferredSizeWidget {
  const ShellHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        border: const Border(
            bottom: BorderSide(color: AppColors.outlineVariant, width: 0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
                color: AppColors.low, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.location_on, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 8),
          Text('myRegion',
              style: AppTheme.display(
                  size: 20, color: AppColors.primary, weight: FontWeight.w800)),
          const Spacer(),
          // Messages
          GestureDetector(
            onTap: () => app.navigate(Screen.messages),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle),
                  child: const Icon(Icons.chat_bubble_outline,
                      color: AppColors.primary, size: 20),
                ),
                Positioned(
                  top: -2,
                  right: -2,
                  child: Container(
                    width: 18,
                    height: 18,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                        color: Color(0xFFEF4444), shape: BoxShape.circle),
                    child: const Text('2',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Avatar
          GestureDetector(
            onTap: () => app.navigate(Screen.profile),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primaryFixed, width: 2),
              ),
              clipBehavior: Clip.antiAlias,
              child: AppImage(app.user.avatar),
            ),
          ),
        ],
      ),
    );
  }
}

class ShellBottomNav extends StatelessWidget {
  const ShellBottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();

    Widget item(Screen id, IconData icon, String label) {
      final active = app.screen == id;
      return Expanded(
        child: InkWell(
          onTap: () => app.navigate(id),
          borderRadius: BorderRadius.circular(999),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon,
                    size: 22,
                    color: active
                        ? AppColors.primary
                        : AppColors.onSurfaceVariant.withOpacity(0.7)),
                const SizedBox(height: 4),
                Text(label,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: active
                            ? AppColors.primary
                            : AppColors.onSurfaceVariant.withOpacity(0.7))),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: const Border(
            top: BorderSide(color: AppColors.outlineVariant, width: 0.5)),
        boxShadow: [
          BoxShadow(
              color: AppColors.primary.withOpacity(0.04),
              blurRadius: 22,
              offset: const Offset(0, -4)),
        ],
      ),
      padding: const EdgeInsets.only(top: 8, bottom: 18, left: 8, right: 8),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            item(Screen.feed, Icons.explore_outlined, 'Lent'),
            item(Screen.myReports, Icons.assignment_outlined, 'Müraciətlər'),
            // Center FAB
            Expanded(
              child: Transform.translate(
                offset: const Offset(0, -20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () {
                        app.resetDraftForCapture();
                        app.navigate(Screen.camera);
                      },
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.surface, width: 4),
                          boxShadow: [
                            BoxShadow(
                                color: AppColors.primary.withOpacity(0.4),
                                blurRadius: 25,
                                offset: const Offset(0, 8)),
                          ],
                        ),
                        child: const Icon(Icons.camera_alt,
                            color: Colors.white, size: 28),
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text('BİLDİR',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                            letterSpacing: 0.5)),
                  ],
                ),
              ),
            ),
            item(Screen.rewards, Icons.emoji_events_outlined, 'Mükafatlar'),
            item(Screen.profile, Icons.person_outline, 'Profil'),
          ],
        ),
      ),
    );
  }
}

/// Toast banner shown at the top of the frame.
class ToastOverlay extends StatelessWidget {
  const ToastOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.toast;
    if (t == null) return const SizedBox.shrink();

    final (icon, color) = switch (t.kind) {
      ToastKind.success => (Icons.check_circle, const Color(0xFFA5D6A7)),
      ToastKind.error => (Icons.error_outline, AppColors.secondaryContainer),
      ToastKind.info => (Icons.info_outline, const Color(0xFF93C5FD)),
    };

    return Positioned(
      top: MediaQuery.of(context).padding.top + 12,
      left: 16,
      right: 16,
      child: Material(
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.inverseSurface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(color: Colors.black26, blurRadius: 16, offset: Offset(0, 6)),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(t.message,
                    style: const TextStyle(
                        color: AppColors.inverseOnSurface,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
              GestureDetector(
                onTap: app.hideToast,
                child: Icon(Icons.close,
                    color: Colors.white.withOpacity(0.6), size: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

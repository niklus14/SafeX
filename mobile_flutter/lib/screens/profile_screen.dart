import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';

const _boardCoins = [
  2180, 1960, 1540, 1425, 1310, 1190, 1125, 1030, 980, 930,
  870, 820, 780, 735, 690, 650, 610, 570, 530, 490,
];

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  int _userRank(int coins) {
    final idx = _boardCoins.indexWhere((c) => c <= coins);
    return idx == -1 ? _boardCoins.length + 1 : idx + 1;
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final user = app.user;
    final rank = _userRank(user.coins);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        // Avatar + name + rank
        Center(
          child: Column(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.outlineVariant.withOpacity(0.4), width: 2),
                ),
                clipBehavior: Clip.antiAlias,
                child: AppImage(user.avatar),
              ),
              const SizedBox(height: 12),
              Text(user.name, style: AppTheme.display(size: 20)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.low,
                  borderRadius: BorderRadius.circular(999),
                  border:
                      Border.all(color: AppColors.outlineVariant.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Sıralama',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.onSurfaceVariant)),
                    const SizedBox(width: 6),
                    Text('#$rank',
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary)),
                    const SizedBox(width: 6),
                    Pill('SİZ', bg: AppColors.primary, fg: Colors.white, fontSize: 9),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // Stats card
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              _stat(Text.rich(TextSpan(children: [
                TextSpan(
                    text: '${user.trustScore}',
                    style: AppTheme.display(size: 18)),
                TextSpan(
                    text: '/100',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.onSurfaceVariant.withOpacity(0.5))),
              ])), 'Etibarlılıq'),
              _divider(),
              _stat(Text('${user.reportsCount}', style: AppTheme.display(size: 18)),
                  'Müraciət'),
              _divider(),
              _stat(Text('${user.solvedCount}', style: AppTheme.display(size: 18)),
                  'Həll edilib'),
              _divider(),
              _stat(Text('${user.coins}', style: AppTheme.display(size: 18)),
                  'Civic Xal'),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // Badges
        Row(
          children: [
            Text('Mükafatlar', style: AppTheme.display(size: 14, color: AppColors.onSurfaceVariant)),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _badge(Icons.star, const Color(0xFFFBBF24), 'Rising Star',
                  const Color(0xFFFFFBEB), const Color(0xFFFDE68A)),
              _badge(Icons.military_tech, const Color(0xFF64748B),
                  'İcma Köməkçisi', const Color(0xFFF8FAFC),
                  const Color(0xFFE2E8F0)),
              _badge(Icons.shield, AppColors.primary, 'Aktiv Vətəndaş',
                  AppColors.low, AppColors.outlineVariant),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // Settings
        Text('Tənzimləmələr',
            style: AppTheme.display(size: 14, color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              // Language
              _settingRow(
                Icons.language,
                'Dil',
                trailing: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                      color: AppColors.low,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                          color: AppColors.outlineVariant.withOpacity(0.25))),
                  child: Row(
                    children: ['AZ', 'EN'].map((lang) {
                      final on = user.language == lang;
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 2),
                        decoration: BoxDecoration(
                            color: on ? AppColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(999)),
                        child: Text(lang,
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: on
                                    ? Colors.white
                                    : AppColors.onSurfaceVariant.withOpacity(0.6))),
                      );
                    }).toList(),
                  ),
                ),
                onTap: () {
                  app.updateUser(language: user.language == 'AZ' ? 'EN' : 'AZ');
                  app.showToast(
                      'Dil dəyişdirildi: ${user.language}', ToastKind.info);
                },
              ),
              const Divider(height: 1, color: AppColors.outlineVariant),
              // Notifications
              _settingRow(
                Icons.notifications_none,
                'Bildirişlər',
                trailing: Switch(
                  value: user.notificationsEnabled,
                  activeColor: AppColors.primary,
                  onChanged: (v) {
                    app.updateUser(notificationsEnabled: v);
                    app.showToast(
                        v ? 'Bildirişlər aktivdir!' : 'Bildirişlər söndürüldü.',
                        ToastKind.info);
                  },
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Logout
        GestureDetector(
          onTap: () {
            app.reset();
            app.navigate(Screen.onboarding);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border:
                  Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                      color: AppColors.low,
                      borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.logout, size: 15, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                const Text('Çıxış',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary)),
                const Spacer(),
                Icon(Icons.chevron_right,
                    size: 15, color: AppColors.primary.withOpacity(0.4)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _stat(Widget value, String label) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          children: [
            value,
            const SizedBox(height: 4),
            Text(label.toUpperCase(),
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.3,
                    color: AppColors.onSurfaceVariant.withOpacity(0.7))),
          ],
        ),
      ),
    );
  }

  Widget _divider() => Container(
      width: 0.5, height: 40, color: AppColors.outlineVariant.withOpacity(0.25));

  Widget _badge(IconData icon, Color iconColor, String label, Color bg, Color border) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
              color: bg, shape: BoxShape.circle, border: Border.all(color: border, width: 2)),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: 56,
          child: Text(label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.onSurfaceVariant)),
        ),
      ],
    );
  }

  Widget _settingRow(IconData icon, String label,
      {required Widget trailing, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                  color: AppColors.low, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, size: 15, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Text(label,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600)),
            const Spacer(),
            trailing,
          ],
        ),
      ),
    );
  }
}

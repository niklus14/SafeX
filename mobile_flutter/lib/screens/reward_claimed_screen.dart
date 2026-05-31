import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';

class RewardClaimedScreen extends StatelessWidget {
  const RewardClaimedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final claimed = app.claimedReward;
    if (claimed == null) return const SizedBox.shrink();
    final reward = claimed.reward;
    final code = claimed.code;

    return Container(
      color: AppColors.surface,
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              border:
                  Border.all(color: AppColors.outlineVariant.withOpacity(0.3)),
              boxShadow: const [
                BoxShadow(color: Colors.black12, blurRadius: 30, offset: Offset(0, 10)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                      color: AppColors.container, shape: BoxShape.circle),
                  child: const Icon(Icons.check_circle,
                      color: Color(0xFFBD0E21), size: 36),
                ),
                const SizedBox(height: 16),
                Text('Uğurla alındı!', style: AppTheme.display(size: 20)),
                const SizedBox(height: 4),
                const Text(
                  'Mükafat kuponunuz aktivdir. Məbləğ balansınızdan çıxıldı.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.low,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: AppColors.outlineVariant.withOpacity(0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('MƏHSUL NÖVÜ',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                  color: AppColors.onSurfaceVariant)),
                          Text('${reward.cost} Xal',
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFBD0E21))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(reward.title,
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // QR placeholder
                Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                          color: AppColors.outlineVariant.withOpacity(0.3))),
                  child: const Icon(Icons.qr_code_2, size: 140),
                ),
                const SizedBox(height: 24),
                // Code + copy
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceDim.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.1)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(code,
                          style: AppTheme.display(
                              size: 18, color: AppColors.primary, letterSpacing: 3)),
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: code));
                          app.showToast(
                              'Xüsusi kupon kodu kopyalandı!', ToastKind.success);
                        },
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.copy,
                              size: 16, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text('KODU KASSADA TƏQDİM EDİN',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                        color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      app.clearClaimed();
                      app.navigate(Screen.rewards);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999)),
                    ),
                    child: const Text('Bağla',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

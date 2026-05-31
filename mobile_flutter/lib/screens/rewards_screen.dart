import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class _Member {
  final int rank;
  final String name;
  final String role;
  final int coins;
  final int solved;
  final int reports;
  _Member(this.rank, this.name, this.role, this.coins, this.solved, this.reports);
}

final _leaderboard = <_Member>[
  _Member(1, 'Leyla Məmmədova', 'Məhəllə müşahidəçisi', 2180, 31, 44),
  _Member(2, 'Rəşad Əliyev', 'Aktiv vətəndaş', 1960, 28, 39),
  _Member(3, 'Anar Məmmədov', 'Etibarlı iştirakçı', 1540, 18, 24),
  _Member(4, 'Nigar Həsənova', 'Sübut göndərən', 1425, 19, 27),
  _Member(5, 'Kamal Vəliyev', 'İcma dəstəyi', 1310, 16, 22),
  _Member(6, 'Fərid Qasımov', 'Təsdiqçi', 1190, 14, 21),
];

const _earnRows = [
  ['A', 'Yeni düzgün müraciət', '+10 Xal', 0xFFDCFCE7, 0xFF15803D],
  ['B', 'Digər müraciətin təsdiqlənməsi', '+5 Xal', 0xFFDBEAFE, 0xFF1D4ED8],
  ['C', 'Problem rəsmi həll olunanda', '+20 Xal', 0xFFFEF3C7, 0xFFB45309],
  ['D', 'Yanlış və ya spam müraciət', '-10 Xal', 0xFFFFE4E6, 0xFFBE123C],
];

String _maskName(String name, [int firstLen = 3, int lastLen = 3]) {
  final parts = name.split(' ');
  if (parts.length == 1) {
    return '${parts[0].substring(0, parts[0].length.clamp(0, firstLen))}.';
  }
  final first = parts.first;
  final last = parts.last;
  return '${first.substring(0, first.length.clamp(0, firstLen))}. '
      '${last.substring(0, last.length.clamp(0, lastLen))}.';
}

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  int _userRank(int coins) {
    final idx = _leaderboard.indexWhere((m) => m.coins <= coins);
    return idx == -1 ? _leaderboard.length + 1 : idx + 1;
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final user = app.user;
    final userRank = _userRank(user.coins);
    final top3 = _leaderboard.take(3).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mükafatlar', style: AppTheme.display(size: 20)),
          const SizedBox(height: 2),
          const Text('Topladığınız xallar şəhərə verdiyiniz töhfəni göstərir',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 16),
          // Balance banner
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24),
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: kBrandGradient,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      shape: BoxShape.circle),
                  child: const Icon(Icons.emoji_events,
                      color: AppColors.onPrimaryContainer, size: 30),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${user.coins} Xal',
                        style: AppTheme.display(size: 30, color: Colors.white)),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => _showInfo(context),
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle),
                        child: const Icon(Icons.info_outline,
                            color: Colors.white70, size: 13),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('MÖVCUD XAL BALANSINIZ',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                        color: Colors.white.withOpacity(0.8))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Leaderboard
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border:
                    Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Aylıq liderlik cədvəli',
                          style: AppTheme.display(size: 14)),
                      Pill('Sizin yeriniz: #$userRank',
                          bg: AppColors.low, fg: AppColors.primary, fontSize: 10),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...top3.map((m) => _row(m)),
                  if (userRank > 3) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 4),
                      child: Center(
                          child: Text('···',
                              style: TextStyle(
                                  color: AppColors.outlineVariant,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 4))),
                    ),
                    _userRow(user.name, user.coins, userRank),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(_Member m) {
    final (rowBg, rowBorder) = switch (m.rank) {
      1 => (const Color(0xFFFFFBEB), const Color(0xFFFDE68A)),
      2 => (const Color(0xFFF8FAFC), const Color(0xFFE2E8F0)),
      3 => (const Color(0xFFFFF7ED), const Color(0xFFFED7AA)),
      _ => (AppColors.surface, AppColors.outlineVariant),
    };
    final avatarBg = switch (m.rank) {
      1 => const Color(0xFFFBBF24),
      2 => const Color(0xFF94A3B8),
      3 => const Color(0xFFFB923C),
      _ => AppColors.primary,
    };
    final badge = switch (m.rank) {
      1 => const Icon(Icons.emoji_events, size: 14, color: Color(0xFFB45309)),
      2 => const Icon(Icons.military_tech, size: 14, color: Color(0xFF475569)),
      3 => const Icon(Icons.military_tech, size: 14, color: Color(0xFFC2410C)),
      _ => Text('${m.rank}', style: const TextStyle(fontSize: 12)),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: rowBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: rowBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
                color: rowBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: rowBorder)),
            child: badge,
          ),
          const SizedBox(width: 12),
          InitialAvatar(m.name, size: 40, bg: avatarBg),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_maskName(m.name),
                    style: AppTheme.display(size: 14)),
                Text(m.role,
                    style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 2),
                Text('${m.reports} müraciət • ${m.solved} həllə töhfə',
                    style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppColors.onSurfaceVariant.withOpacity(0.7))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${m.coins}', style: AppTheme.display(size: 14, color: AppColors.primary)),
              Text('XAL',
                  style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurfaceVariant.withOpacity(0.7))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _userRow(String name, int coins, int rank) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.low,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
                color: AppColors.container,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.3))),
            child: Text('$rank',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary)),
          ),
          const SizedBox(width: 12),
          InitialAvatar(name, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(_maskName(name),
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.display(size: 14, color: AppColors.primary)),
                ),
                const SizedBox(width: 6),
                Pill('SİZ', bg: AppColors.primary, fg: Colors.white, fontSize: 9),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$coins',
                  style: AppTheme.display(size: 14, color: AppColors.primary)),
              Text('XAL',
                  style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurfaceVariant.withOpacity(0.7))),
            ],
          ),
        ],
      ),
    );
  }

  void _showInfo(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.outlineVariant,
                    borderRadius: BorderRadius.circular(999)),
              ),
            ),
            const SizedBox(height: 16),
            Text('Necə qazanılır?', style: AppTheme.display(size: 16)),
            const SizedBox(height: 2),
            const Text('Xal sistemi haqqında',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: const Text(
                'Xallar keyfiyyəti ölçür. Eyni yerdəki təkrar müraciətlər mövcud problemə birləşdirilir — əlavə xal qazandırmır.',
                style: TextStyle(
                    fontSize: 12,
                    height: 1.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF92400E)),
              ),
            ),
            const SizedBox(height: 12),
            ..._earnRows.map((r) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                            color: Color(r[3] as int),
                            borderRadius: BorderRadius.circular(8)),
                        child: Text(r[0] as String,
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(r[4] as int))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                          child: Text(r[1] as String,
                              style: const TextStyle(fontSize: 12))),
                      Text(r[2] as String,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary)),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}

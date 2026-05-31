import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';

class _Thread {
  final String id;
  final String org;
  final String lastMessage;
  final String time;
  final bool unread;
  final IconData icon;
  const _Thread(this.id, this.org, this.lastMessage, this.time, this.icon,
      {this.unread = false});
}

const _threads = [
  _Thread('azarsu', 'Azərsu əməkdaşı',
      'Zəhmət olmasa problemin yaxın plandan şəklini göndərin.', '5 dəq əvvəl',
      Icons.water_drop, unread: true),
  _Thread('azerisiq', 'Azərişıq əməkdaşı',
      'İşıqlandırma müraciətiniz üzrə əlavə konum lazımdır.', '18 dəq əvvəl',
      Icons.bolt, unread: true),
  _Thread('rih', 'Nərimanov RİH operatoru',
      'Müraciətiniz aidiyyəti quruma yönləndirildi.', 'Dünən', Icons.apartment),
];

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Container(
      color: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              height: 64,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              color: Colors.white.withOpacity(0.9),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => app.navigate(Screen.feed),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                          color: AppColors.low, shape: BoxShape.circle),
                      child: const Icon(Icons.arrow_back,
                          color: AppColors.primary, size: 20),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Mesaj qutusu', style: AppTheme.display(size: 18)),
                      const Text('Qurumlarla yazışmalar',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurfaceVariant)),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: kBrandGradient,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.chat_bubble_outline,
                              color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('2 yeni mesaj',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14)),
                              SizedBox(height: 2),
                              Text(
                                  'Qurum əməkdaşları müraciətləriniz üzrə əlavə məlumat istəyir.',
                                  style: TextStyle(
                                      color: Colors.white70, fontSize: 11)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._threads.map((t) => _threadTile(app, t)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _threadTile(AppState app, _Thread t) {
    return GestureDetector(
      onTap: () {
        app.setMessageThread(t.id);
        app.navigate(Screen.messageThread);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16)),
              child: Icon(t.icon, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                          child: Text(t.org,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w800))),
                      Text(t.time,
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurfaceVariant.withOpacity(0.7))),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(t.lastMessage,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 12,
                          height: 1.5,
                          color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (t.unread)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(999)),
                          child: const Text('YENİ',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800)),
                        ),
                      if (t.unread) const SizedBox(width: 8),
                      Text('Müraciət üzrə əlaqə',
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color:
                                  AppColors.onSurfaceVariant.withOpacity(0.6))),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';

enum _PermState { idle, requesting, granted, denied }

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});
  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  _PermState camera = _PermState.idle;
  _PermState location = _PermState.idle;

  Future<void> _requestCamera() async {
    setState(() => camera = _PermState.requesting);
    final status = await Permission.camera.request();
    if (!mounted) return;
    if (status.isGranted) {
      setState(() => camera = _PermState.granted);
      context.read<AppState>().grantPermission('camera');
    } else {
      setState(() => camera = _PermState.denied);
    }
  }

  Future<void> _requestLocation() async {
    setState(() => location = _PermState.requesting);
    final status = await Permission.locationWhenInUse.request();
    if (!mounted) return;
    if (status.isGranted) {
      setState(() => location = _PermState.granted);
      context.read<AppState>().grantPermission('location');
    } else {
      setState(() => location = _PermState.denied);
    }
  }

  bool get _allDone =>
      camera != _PermState.idle && location != _PermState.idle;

  Widget _stateChip(_PermState s, VoidCallback onRequest) {
    switch (s) {
      case _PermState.granted:
        return _chip('İcazə verildi', AppColors.successBg, AppColors.successFg,
            Icons.check);
      case _PermState.denied:
        return _chip('İmtina edildi', AppColors.rejectBg, AppColors.rejectFg,
            Icons.close);
      case _PermState.requesting:
        return _chip('Gözlənilir…', AppColors.low, AppColors.primary, null,
            spin: true);
      case _PermState.idle:
        return ElevatedButton(
          onPressed: onRequest,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            minimumSize: const Size(0, 0),
          ),
          child: const Text('İcazə ver',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        );
    }
  }

  Widget _chip(String text, Color bg, Color fg, IconData? icon,
      {bool spin = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (spin)
            SizedBox(
                width: 13,
                height: 13,
                child: CircularProgressIndicator(strokeWidth: 2, color: fg))
          else if (icon != null)
            Icon(icon, size: 13, color: fg),
          const SizedBox(width: 6),
          Text(text,
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.bold, color: fg)),
        ],
      ),
    );
  }

  Widget _card(IconData icon, String title, String desc, Widget action) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.3)),
        boxShadow: const [
          BoxShadow(color: Color(0x08000000), blurRadius: 20, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.onSurface)),
                const SizedBox(height: 4),
                Text(desc,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 16),
                action,
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Container(
      color: AppColors.surface,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle),
                child: const Icon(Icons.shield_outlined,
                    color: AppColors.primary, size: 36),
              ),
              const SizedBox(height: 12),
              Text('Lazımi icazələr',
                  style: AppTheme.display(size: 24, weight: FontWeight.w800)),
              const SizedBox(height: 8),
              const Text(
                'Tətbiqin tam funksionallığından yararlanmaq üçün aşağıdakı icazələri təmin edin.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: 32),
              _card(Icons.camera_alt_outlined, 'Kamera',
                  'Problemi yerindəcə fotoşəkil ilə çəkib sənədləşdirmək üçün tələb olunur.',
                  _stateChip(camera, _requestCamera)),
              const SizedBox(height: 16),
              _card(Icons.location_on_outlined, 'Məkan',
                  'Problemin dəqiq ünvanını avtomatik müəyyənləşdirmək üçün lazımdır.',
                  _stateChip(location, _requestLocation)),
              if (camera == _PermState.denied || location == _PermState.denied)
                const Padding(
                  padding: EdgeInsets.only(top: 16),
                  child: Text(
                    'İmtina edilmiş icazəni bərpa etmək üçün cihaz parametrlərindən tətbiq icazələrini açın.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant),
                  ),
                ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _allDone ? () => app.navigate(Screen.feed) : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.primary.withOpacity(0.4),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Hazırdır',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      SizedBox(width: 8),
                      Icon(Icons.chevron_right, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

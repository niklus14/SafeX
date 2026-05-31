import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../geolocate.dart';
import '../models.dart';
import '../theme.dart';

/// Real capture screen. Uses the native camera (image_picker) for reliability
/// and resolves GPS in the background so the draft has coordinates ready.
class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});
  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final _picker = ImagePicker();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _resolveLocation();
  }

  Future<void> _resolveLocation() async {
    try {
      final loc = await resolveLocation();
      if (!mounted) return;
      context.read<AppState>().patchDraft(
          lat: loc.lat, lng: loc.lng, location: loc.location, isLocationCustom: false);
    } catch (_) {/* keep defaults */}
  }

  Future<void> _capture(ImageSource source) async {
    if (_busy) return;
    setState(() => _busy = true);
    final app = context.read<AppState>();
    try {
      final file =
          await _picker.pickImage(source: source, maxWidth: 1600, imageQuality: 85);
      if (file == null) {
        if (mounted) setState(() => _busy = false);
        return;
      }
      app.patchDraft(photo: file.path);
      app.navigate(Screen.createDetails);
      app.showToast('Fotoşəkil çəkildi.', ToastKind.success);
    } catch (_) {
      app.showToast('Şəkil alına bilmədi.', ToastKind.error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Container(
      color: Colors.black,
      child: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _circleBtn(Icons.close, () => app.navigate(Screen.feed)),
                  const Text('KAMERA',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2,
                          fontSize: 14)),
                  _circleBtn(Icons.photo_library_outlined,
                      () => _capture(ImageSource.gallery)),
                ],
              ),
            ),
            // Viewfinder placeholder (native camera opens on tap)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 220,
                      height: 220,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.white24, width: 2),
                        borderRadius: BorderRadius.circular(32),
                      ),
                      child: Icon(Icons.center_focus_weak,
                          color: Colors.white.withOpacity(0.3), size: 64),
                    ),
                    const SizedBox(height: 24),
                    const Text('Şəhər problemini çərçivəyə alın',
                        style: TextStyle(color: Colors.white70, fontSize: 13)),
                  ],
                ),
              ),
            ),
            // Shutter bar
            Container(
              height: 140,
              color: Colors.black,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _circleBtn(Icons.photo_library_outlined,
                      () => _capture(ImageSource.gallery),
                      bg: Colors.white12),
                  GestureDetector(
                    onTap: () => _capture(ImageSource.camera),
                    child: Container(
                      width: 80,
                      height: 80,
                      padding: const EdgeInsets.all(4),
                      decoration:
                          const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.black, width: 4),
                        ),
                        child: _busy
                            ? const Padding(
                                padding: EdgeInsets.all(18),
                                child: CircularProgressIndicator(
                                    color: AppColors.primary, strokeWidth: 3),
                              )
                            : Container(
                                margin: const EdgeInsets.all(6),
                                decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle),
                                child: const Icon(Icons.camera_alt,
                                    color: Colors.white, size: 24),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap, {Color? bg}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
            color: bg ?? Colors.black.withOpacity(0.4), shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}

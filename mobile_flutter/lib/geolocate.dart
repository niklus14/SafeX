/// geolocate.dart — resolve the device's real position + an Azerbaijani address.
/// Ported from mobile/src/geolocate.ts (browser Nominatim → native geocoding).
library;

import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class ResolvedLocation {
  final double lat;
  final double lng;
  final String location;
  ResolvedLocation(this.lat, this.lng, this.location);
}

String _coordLabel(double lat, double lng) =>
    '${lat.toStringAsFixed(4)}°N, ${lng.toStringAsFixed(4)}°E';

Future<String> _reverseGeocode(double lat, double lng) async {
  try {
    final placemarks = await placemarkFromCoordinates(lat, lng);
    if (placemarks.isEmpty) return _coordLabel(lat, lng);
    final p = placemarks.first;
    final road = (p.thoroughfare?.isNotEmpty ?? false)
        ? p.thoroughfare!
        : (p.street ?? '');
    final area = (p.subLocality?.isNotEmpty ?? false)
        ? p.subLocality!
        : (p.locality ?? '');
    final parts = [road, area].where((s) => s.isNotEmpty).toList();
    return parts.isEmpty ? _coordLabel(lat, lng) : parts.join(', ');
  } catch (_) {
    return _coordLabel(lat, lng);
  }
}

/// Resolve current position. Throws if location services/permission unavailable.
Future<ResolvedLocation> resolveLocation() async {
  final enabled = await Geolocator.isLocationServiceEnabled();
  if (!enabled) throw Exception('Location services disabled');

  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    throw Exception('Location permission denied');
  }

  final pos = await Geolocator.getCurrentPosition(
    locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
  );
  final label = await _reverseGeocode(pos.latitude, pos.longitude);
  return ResolvedLocation(pos.latitude, pos.longitude, label);
}

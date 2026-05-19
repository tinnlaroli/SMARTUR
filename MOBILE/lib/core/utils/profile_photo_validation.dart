import 'dart:typed_data';

enum ProfilePhotoIssue { none, tooLarge, invalidFormat }

/// Formatos aceptados (mismo criterio que el API + HEIC/HEIF típico en iOS).
class ProfilePhotoValidation {
  ProfilePhotoValidation._();

  static const int maxBytes = 5 * 1024 * 1024;

  static const Set<String> allowedMimeTypes = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  };

  /// Detecta MIME: prioridad metadata del SO, magic bytes, extensión.
  static String? detectMimeType({
    required Uint8List bytes,
    required String filename,
    String? platformMime,
  }) {
    final pm = platformMime?.toLowerCase().trim();
    if (pm != null && pm.isNotEmpty && allowedMimeTypes.contains(pm)) {
      return pm;
    }
    final magic = _mimeFromMagicBytes(bytes);
    if (magic != null) return magic;
    return _mimeFromExtension(filename);
  }

  static ProfilePhotoIssue validate({
    required Uint8List bytes,
    required String filename,
    String? platformMime,
  }) {
    if (bytes.isEmpty) return ProfilePhotoIssue.invalidFormat;
    if (bytes.length > maxBytes) return ProfilePhotoIssue.tooLarge;
    final mime = detectMimeType(
      bytes: bytes,
      filename: filename,
      platformMime: platformMime,
    );
    if (mime == null || !allowedMimeTypes.contains(mime)) {
      return ProfilePhotoIssue.invalidFormat;
    }
    return ProfilePhotoIssue.none;
  }

  static String effectiveFilename(String filename, String mime) {
    final t = filename.trim();
    if (t.isNotEmpty && t != 'image') return t;
    switch (mime) {
      case 'image/png':
        return 'avatar.png';
      case 'image/gif':
        return 'avatar.gif';
      case 'image/webp':
        return 'avatar.webp';
      case 'image/heic':
      case 'image/heif':
        return 'avatar.heic';
      case 'image/jpeg':
      default:
        return 'avatar.jpg';
    }
  }

  static String? _mimeFromExtension(String name) {
    final lower = name.toLowerCase().trim();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    if (lower.endsWith('.heif')) return 'image/heif';
    return null;
  }

  static String? _mimeFromMagicBytes(Uint8List bytes) {
    if (bytes.length < 12) return null;
    // JPEG
    if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) {
      return 'image/jpeg';
    }
    // PNG
    if (bytes.length >= 4 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50 &&
        bytes[2] == 0x4E &&
        bytes[3] == 0x47) {
      return 'image/png';
    }
    // GIF
    if (bytes.length >= 3 &&
        bytes[0] == 0x47 &&
        bytes[1] == 0x49 &&
        bytes[2] == 0x46) {
      return 'image/gif';
    }
    // WebP (RIFF....WEBP)
    if (bytes.length >= 12) {
      final h = String.fromCharCodes(bytes.sublist(0, 4));
      final t = String.fromCharCodes(bytes.sublist(8, 12));
      if (h == 'RIFF' && t == 'WEBP') return 'image/webp';
    }
    // HEIC/HEIF (ftyp heic, mif1, heix, msf1)
    if (bytes.length >= 12) {
      final ftyp = String.fromCharCodes(bytes.sublist(4, 8));
      if (ftyp == 'ftyp') {
        final brand = String.fromCharCodes(bytes.sublist(8, 12));
        final b = brand.toLowerCase();
        if (b.contains('heic') ||
            b.contains('heix') ||
            b.contains('mif1') ||
            b.contains('msf1')) {
          return 'image/heic';
        }
      }
    }
    return null;
  }
}

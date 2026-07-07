// Unit tests for AuthService's pure/testable logic:
//  - error parsing (SOCIAL_ACCOUNT -> SocialAccountException)
//  - setRememberMe's expiry math (30 days vs 24 hours)
//
// AuthService talks to flutter_secure_storage (a platform plugin) and to
// package:http directly (not dependency-injected). Rather than refactor the
// production class, this test:
//  - mocks the flutter_secure_storage MethodChannel with an in-memory map,
//    so real read/write calls work without a device/plugin.
//  - uses http's `runWithClient` zone override (supported since http 0.13)
//    to swap in a `MockClient` for the duration of each test, without any
//    source changes to AuthService.
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smartur/data/services/auth_service.dart';

const _secureStorageChannel =
    MethodChannel('plugins.it_nomads.com/flutter_secure_storage');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final Map<String, String> fakeStorage = {};

  setUp(() {
    fakeStorage.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_secureStorageChannel, (call) async {
      switch (call.method) {
        case 'write':
          final args = Map<String, dynamic>.from(call.arguments as Map);
          fakeStorage[args['key'] as String] = args['value'] as String;
          return null;
        case 'read':
          final args = Map<String, dynamic>.from(call.arguments as Map);
          return fakeStorage[args['key'] as String];
        case 'delete':
          final args = Map<String, dynamic>.from(call.arguments as Map);
          fakeStorage.remove(args['key'] as String);
          return null;
        case 'readAll':
          return fakeStorage;
        case 'deleteAll':
          fakeStorage.clear();
          return null;
        case 'containsKey':
          final args = Map<String, dynamic>.from(call.arguments as Map);
          return fakeStorage.containsKey(args['key'] as String);
        default:
          return null;
      }
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_secureStorageChannel, null);
  });

  group('AuthService.loginStep1 error parsing', () {
    test('throws SocialAccountException with provider=google on 409/SOCIAL_ACCOUNT', () async {
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({'code': 'SOCIAL_ACCOUNT', 'provider': 'google'}),
          409,
        );
      });

      await http.runWithClient(() async {
        final service = AuthService();
        await expectLater(
          () => service.loginStep1('a@a.com', 'whatever'),
          throwsA(isA<SocialAccountException>()
              .having((e) => e.provider, 'provider', 'google')
              .having((e) => e.code, 'code', 'auth.social_account')),
        );
      }, () => client);
    });

    test('throws SocialAccountException with provider=facebook', () async {
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({'code': 'SOCIAL_ACCOUNT', 'provider': 'facebook'}),
          409,
        );
      });

      await http.runWithClient(() async {
        final service = AuthService();
        await expectLater(
          () => service.loginStep1('a@a.com', 'whatever'),
          throwsA(isA<SocialAccountException>()
              .having((e) => e.provider, 'provider', 'facebook')),
        );
      }, () => client);
    });

    test('throws generic AuthException (not SocialAccountException) for bad credentials', () async {
      final client = MockClient((request) async {
        return http.Response(jsonEncode({'message': 'Credenciales incorrectas'}), 400);
      });

      await http.runWithClient(() async {
        final service = AuthService();
        await expectLater(
          () => service.loginStep1('a@a.com', 'whatever'),
          throwsA(isA<AuthException>().having(
              (e) => e is SocialAccountException, 'is social', false)),
        );
      }, () => client);
    });

    test('throws AuthRateLimitException on 429', () async {
      final client = MockClient((request) async {
        return http.Response('', 429);
      });

      await http.runWithClient(() async {
        final service = AuthService();
        await expectLater(
          () => service.loginStep1('a@a.com', 'whatever'),
          throwsA(isA<AuthRateLimitException>()),
        );
      }, () => client);
    });

    test('returns parsed body on 200', () async {
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({'data': {'userId': 1, 'requiresVerification': true}}),
          200,
        );
      });

      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.loginStep1('a@a.com', 'whatever');
        expect(result?['data']['requiresVerification'], true);
      }, () => client);
    });
  });

  group('AuthService.tryRefreshToken', () {
    test('returns null when no refresh token stored', () async {
      final client = MockClient((request) async {
        fail('should not call the network without a stored refresh token');
      });
      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.tryRefreshToken();
        expect(result, isNull);
      }, () => client);
    });

    test('saves and returns new token on 200', () async {
      fakeStorage['refresh_token'] = 'old-refresh';
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({'token': 'new-access', 'refreshToken': 'new-refresh'}),
          200,
        );
      });
      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.tryRefreshToken();
        expect(result, 'new-access');
        expect(fakeStorage['auth_token'], 'new-access');
        expect(fakeStorage['refresh_token'], 'new-refresh');
      }, () => client);
    });

    test('returns null on non-200 response', () async {
      fakeStorage['refresh_token'] = 'old-refresh';
      final client = MockClient((request) async {
        return http.Response('', 401);
      });
      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.tryRefreshToken();
        expect(result, isNull);
      }, () => client);
    });
  });

  group('AuthService.validateTokenWithServer', () {
    test('returns false when no token stored', () async {
      final client = MockClient((request) async {
        fail('should not call the network without a stored token');
      });
      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.validateTokenWithServer();
        expect(result, isFalse);
      }, () => client);
    });

    test('returns true on 200 ping', () async {
      fakeStorage['auth_token'] = 'valid-token';
      final client = MockClient((request) async {
        return http.Response('', 200);
      });
      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.validateTokenWithServer();
        expect(result, isTrue);
      }, () => client);
    });

    test('refreshes token silently on 401 and returns true', () async {
      fakeStorage['auth_token'] = 'expired-token';
      fakeStorage['refresh_token'] = 'old-refresh';
      final client = MockClient((request) async {
        if (request.url.path.endsWith('/me/ping')) {
          return http.Response('', 401);
        }
        return http.Response(
          jsonEncode({'token': 'new-access', 'refreshToken': 'new-refresh'}),
          200,
        );
      });
      await http.runWithClient(() async {
        final service = AuthService();
        final result = await service.validateTokenWithServer();
        expect(result, isTrue);
        expect(fakeStorage['auth_token'], 'new-access');
      }, () => client);
    });
  });

  group('AuthService.setRememberMe expiry math', () {
    test('remember=true sets expiry ~30 days out', () async {
      final service = AuthService();
      final before = DateTime.now();
      await service.setRememberMe(true);
      final enabled = await service.isRememberMeEnabled();
      expect(enabled, true);

      final rawExpiry = fakeStorage['session_expires_at'];
      expect(rawExpiry, isNotNull);
      final expiry = DateTime.fromMillisecondsSinceEpoch(int.parse(rawExpiry!));
      final diff = expiry.difference(before);
      expect(diff.inDays, greaterThanOrEqualTo(29));
      expect(diff.inDays, lessThanOrEqualTo(30));
    });

    test('remember=false sets expiry ~24 hours out', () async {
      final service = AuthService();
      final before = DateTime.now();
      await service.setRememberMe(false);
      final enabled = await service.isRememberMeEnabled();
      expect(enabled, false);

      final rawExpiry = fakeStorage['session_expires_at'];
      expect(rawExpiry, isNotNull);
      final expiry = DateTime.fromMillisecondsSinceEpoch(int.parse(rawExpiry!));
      final diff = expiry.difference(before);
      expect(diff.inHours, greaterThanOrEqualTo(23));
      expect(diff.inHours, lessThanOrEqualTo(24));
    });
  });
}

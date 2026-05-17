import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/data/models/user_model.dart';

class AuthState {
  final bool isAuthenticated;
  final UserModel? user;
  final String? token;
  const AuthState({this.isAuthenticated = false, this.user, this.token});

  AuthState copyWith({bool? isAuthenticated, UserModel? user, String? token}) =>
      AuthState(isAuthenticated: isAuthenticated ?? this.isAuthenticated, user: user ?? this.user, token: token ?? this.token);
}

class AuthNotifier extends StateNotifier<AuthState> {
  final _storage = const FlutterSecureStorage();
  AuthNotifier() : super(const AuthState()) { _loadFromStorage(); }

  Future<void> _loadFromStorage() async {
    final token = await _storage.read(key: 'auth_token');
    if (token != null) state = state.copyWith(isAuthenticated: true, token: token);
  }

  Future<void> setAuth(UserModel user, String token) async {
    await _storage.write(key: 'auth_token', value: token);
    state = AuthState(isAuthenticated: true, user: user, token: token);
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    state = const AuthState();
  }
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());

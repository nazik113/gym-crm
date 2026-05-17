import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';

class AuthRepository {
  final Dio _dio;
  AuthRepository(this._dio);

  Future<Map<String, dynamic>> login({required String phone, required String password}) async {
    final res = await _dio.post('/auth/login', data: {'phone': phone, 'password': password});
    return {
      'user': UserModel.fromJson(res.data['user']),
      'token': res.data['token'] as String,
    };
  }

  Future<Map<String, dynamic>> validateCode(String code) async {
    final res = await _dio.post('/auth/validate-code', data: {'code': code});
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final res = await _dio.post('/auth/register', data: data);
    return {
      'user': UserModel.fromJson(res.data['user']),
      'token': res.data['token'] as String,
    };
  }

  Future<void> logout() => _dio.post('/auth/logout');
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);

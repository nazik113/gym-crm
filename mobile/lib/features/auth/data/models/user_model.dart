import 'package:freezed_annotation/freezed_annotation.dart';
part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required int id,
    @JsonKey(name: 'role_id') required int roleId,
    required RoleModel role,
    required String phone,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name')  required String lastName,
    @JsonKey(name: 'full_name')  required String fullName,
    @JsonKey(name: 'date_of_birth') String? dateOfBirth,
    String? avatar,
    @JsonKey(name: 'qr_code') String? qrCode,
    @JsonKey(name: 'is_active')  @Default(true) bool isActive,
    @JsonKey(name: 'is_in_gym')  @Default(false) bool isInGym,
    @JsonKey(name: 'active_subscription') SubscriptionModel? activeSubscription,
    UserModel? trainer,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
}

@freezed
class RoleModel with _$RoleModel {
  const factory RoleModel({
    required int id,
    required String name,
    @JsonKey(name: 'display_name') required String displayName,
  }) = _RoleModel;
  factory RoleModel.fromJson(Map<String, dynamic> json) => _$RoleModelFromJson(json);
}

@freezed
class SubscriptionModel with _$SubscriptionModel {
  const factory SubscriptionModel({
    required int id,
    @JsonKey(name: 'plan_id') required int planId,
    PlanModel? plan,
    @JsonKey(name: 'price_paid') required double pricePaid,
    @JsonKey(name: 'sessions_remaining') int? sessionsRemaining,
    @JsonKey(name: 'starts_at') required String startsAt,
    @JsonKey(name: 'expires_at') required String expiresAt,
    required String status,
  }) = _SubscriptionModel;
  factory SubscriptionModel.fromJson(Map<String, dynamic> json) => _$SubscriptionModelFromJson(json);
}

@freezed
class PlanModel with _$PlanModel {
  const factory PlanModel({
    required int id,
    required String name,
    required double price,
    @JsonKey(name: 'duration_days') required int durationDays,
    @JsonKey(name: 'sessions_count') int? sessionsCount,
    @Default('#6366F1') String color,
  }) = _PlanModel;
  factory PlanModel.fromJson(Map<String, dynamic> json) => _$PlanModelFromJson(json);
}

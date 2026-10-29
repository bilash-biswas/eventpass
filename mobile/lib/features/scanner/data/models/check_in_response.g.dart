// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'check_in_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CheckInResponseImpl _$$CheckInResponseImplFromJson(
  Map<String, dynamic> json,
) => _$CheckInResponseImpl(
  message: json['message'] as String,
  ticket: Ticket.fromJson(json['ticket'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$CheckInResponseImplToJson(
  _$CheckInResponseImpl instance,
) => <String, dynamic>{'message': instance.message, 'ticket': instance.ticket};

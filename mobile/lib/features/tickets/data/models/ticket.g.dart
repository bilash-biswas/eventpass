// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ticket.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TicketImpl _$$TicketImplFromJson(Map<String, dynamic> json) => _$TicketImpl(
  id: json['id'] as String,
  code: json['code'] as String,
  status: json['status'] as String,
  eventId: json['eventId'] as String,
  userId: json['userId'] as String,
  checkedInAt: json['checkedInAt'] as String?,
  createdAt: json['createdAt'] as String,
  event: json['event'] == null
      ? null
      : Event.fromJson(json['event'] as Map<String, dynamic>),
  user: json['user'] == null
      ? null
      : User.fromJson(json['user'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$TicketImplToJson(_$TicketImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'status': instance.status,
      'eventId': instance.eventId,
      'userId': instance.userId,
      'checkedInAt': instance.checkedInAt,
      'createdAt': instance.createdAt,
      'event': instance.event,
      'user': instance.user,
    };

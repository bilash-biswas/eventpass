// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EventImpl _$$EventImplFromJson(Map<String, dynamic> json) => _$EventImpl(
  id: json['id'] as String,
  slug: json['slug'] as String,
  title: json['title'] as String,
  description: json['description'] as String,
  location: json['location'] as String,
  startsAt: json['startsAt'] as String,
  endsAt: json['endsAt'] as String,
  capacity: (json['capacity'] as num).toInt(),
  coverImageUrl: json['coverImageUrl'] as String?,
  status: json['status'] as String,
  organizerId: json['organizerId'] as String,
  organizer: json['organizer'] == null
      ? null
      : User.fromJson(json['organizer'] as Map<String, dynamic>),
  ticketsCount: (json['ticketsCount'] as num?)?.toInt(),
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$$EventImplToJson(_$EventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'title': instance.title,
      'description': instance.description,
      'location': instance.location,
      'startsAt': instance.startsAt,
      'endsAt': instance.endsAt,
      'capacity': instance.capacity,
      'coverImageUrl': instance.coverImageUrl,
      'status': instance.status,
      'organizerId': instance.organizerId,
      'organizer': instance.organizer,
      'ticketsCount': instance.ticketsCount,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };

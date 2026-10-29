// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'paginated_events.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PaginatedEventsImpl _$$PaginatedEventsImplFromJson(
  Map<String, dynamic> json,
) => _$PaginatedEventsImpl(
  total: (json['total'] as num).toInt(),
  page: (json['page'] as num).toInt(),
  pageSize: (json['pageSize'] as num).toInt(),
  totalPages: (json['totalPages'] as num).toInt(),
  items: (json['items'] as List<dynamic>)
      .map((e) => Event.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$$PaginatedEventsImplToJson(
  _$PaginatedEventsImpl instance,
) => <String, dynamic>{
  'total': instance.total,
  'page': instance.page,
  'pageSize': instance.pageSize,
  'totalPages': instance.totalPages,
  'items': instance.items,
};

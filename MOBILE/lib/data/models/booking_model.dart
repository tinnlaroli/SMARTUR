class Booking {
  final int id;
  final int serviceId;
  final String serviceName;
  final String? companyName;
  final int? companyId;
  final DateTime visitDate;
  final String? visitTime;
  final int guests;
  final String? notes;
  final String status; // pending | confirmed | cancelled
  final bool isWalkin;
  final DateTime createdAt;

  const Booking({
    required this.id,
    required this.serviceId,
    required this.serviceName,
    this.companyName,
    this.companyId,
    required this.visitDate,
    this.visitTime,
    this.guests = 1,
    this.notes,
    required this.status,
    this.isWalkin = false,
    required this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> j) => Booking(
        id: j['id_booking'] as int,
        serviceId: j['id_service'] as int,
        serviceName: (j['service_name'] as String?) ?? '',
        companyName: j['company_name'] as String?,
        companyId: j['id_company'] as int?,
        visitDate: DateTime.parse(j['visit_date'].toString()),
        visitTime: j['visit_time'] as String?,
        guests: (j['guests'] as int?) ?? 1,
        notes: j['notes'] as String?,
        status: (j['status'] as String?) ?? 'pending',
        isWalkin: (j['is_walkin'] as bool?) ?? false,
        createdAt: DateTime.parse(j['created_at'].toString()),
      );

  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCancelled => status == 'cancelled';
}

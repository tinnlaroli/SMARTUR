import 'package:flutter/material.dart';
import 'package:smartur/presentation/widgets/imagen_red.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/welltur_theme.dart';
import '../../data/services/wellness_service.dart';

const _nombresW = {
  'W1': 'Pausa y descanso', 'W2': 'Naturaleza', 'W3': 'Movimiento', 'W4': 'Mente-cuerpo',
  'W5': 'Culinaria', 'W6': 'Cultura', 'W7': 'Autocuidado',
};

/// Nombre legible e icono por categoría del catálogo WELLTUR.
({String nombre, IconData icono}) _categoria(String raw) {
  final c = raw.toLowerCase();
  if (c.startsWith('mente')) return (nombre: 'Mente y cuerpo', icono: Icons.self_improvement_rounded);
  if (c.startsWith('spa')) return (nombre: c.contains('temazcal') ? 'Spa y temazcal' : 'Spa', icono: Icons.spa_rounded);
  if (c.startsWith('balneario')) return (nombre: 'Balneario', icono: Icons.pool_rounded);
  if (c.contains('aventura')) return (nombre: 'Naturaleza y aventura', icono: Icons.hiking_rounded);
  if (c.startsWith('naturaleza')) return (nombre: 'Naturaleza', icono: Icons.forest_rounded);
  if (c.startsWith('hospedaje')) return (nombre: 'Hospedaje', icono: Icons.bed_rounded);
  if (c.startsWith('cafe')) return (nombre: 'Café de altura', icono: Icons.coffee_rounded);
  if (c.startsWith('gastronom')) return (nombre: 'Gastronomía', icono: Icons.restaurant_rounded);
  if (c.startsWith('cultura')) return (nombre: 'Cultura', icono: Icons.museum_rounded);
  if (c.startsWith('artesan')) return (nombre: 'Artesanía', icono: Icons.palette_rounded);
  final limpio = raw.replaceAll('_', ' ').trim();
  return (nombre: limpio.isEmpty ? 'Bienestar' : limpio, icono: Icons.eco_rounded);
}

/// Separa "Porque buscas X: evidencia técnica" en el motivo legible y su fuente.
({String motivo, String fuente}) _explicacion(String texto) {
  final i = texto.indexOf(':');
  if (i < 0) return (motivo: texto.trim(), fuente: '');
  return (motivo: texto.substring(0, i).trim(), fuente: texto.substring(i + 1).trim());
}

/// Tarjeta de un lugar recomendado por WELLTUR.
class WellnessPoiCard extends StatelessWidget {
  final WellnessDestination destination;
  final VoidCallback? onTap;

  /// Se avisa antes de abrir el mapa (para registrar el interés en el lugar).
  final VoidCallback? onComoLlegar;

  const WellnessPoiCard({super.key, required this.destination, this.onTap, this.onComoLlegar});

  Future<void> _comoLlegar() async {
    final lat = destination.lat, lon = destination.lon;
    if (lat == null || lon == null) return;
    onComoLlegar?.call();
    await launchUrl(Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lon'),
        mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final acento = WellturPalette.acento(context);
    final sobreAcento = WellturPalette.sobreAcento(context);
    final d = destination;
    final cat = _categoria(d.categoriaWellness);
    final exp = _explicacion(d.explicacion);
    final lugar = [if (d.municipio.isNotEmpty) d.municipio, if (d.estado.isNotEmpty) d.estado].join(', ');
    final (colorCoincidencia, textoCoincidencia) = switch (d.coincidencia) {
      'alta' => (acento, 'Coincidencia alta'),
      'media' => (WellturPalette.terracotaProfunda, 'Coincidencia media'),
      _ => (scheme.onSurfaceVariant, 'Coincidencia baja'),
    };
    final tieneImagen = (d.imageUrl ?? '').startsWith('http');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Material(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(24),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: scheme.outlineVariant.withValues(alpha: .6)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // ── Encabezado: imagen o color de la categoría ───────────────
              SizedBox(height: 104, child: Stack(fit: StackFit.expand, children: [
                if (tieneImagen)
                  ImagenRed(url: d.imageUrl!, fit: BoxFit.cover,
                    errorWidget: (context) => const SizedBox.shrink())
                else
                  DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(
                    colors: [acento.withValues(alpha: .22), acento.withValues(alpha: .06)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight))),
                if (tieneImagen)
                  const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(
                    colors: [Color(0x66000000), Color(0x11000000)], begin: Alignment.bottomCenter, end: Alignment.topCenter))),
                if (!tieneImagen)
                  Positioned(right: -10, bottom: -18, child: Icon(cat.icono, size: 120, color: acento.withValues(alpha: .13))),
                Positioned(left: 16, top: 14, child: _pastilla('#${d.rank}', acento, sobreAcento, solida: true)),
                Positioned(right: 14, top: 14, child: _pastilla(textoCoincidencia, colorCoincidencia, sobreAcento,
                  solida: d.coincidencia == 'alta', fondo: scheme.surface)),
                Positioned(left: 16, bottom: 12, child: Row(children: [
                  Container(
                    width: 34, height: 34,
                    decoration: BoxDecoration(color: acento, shape: BoxShape.circle),
                    child: Icon(cat.icono, size: 18, color: sobreAcento),
                  ),
                  const SizedBox(width: 8),
                  Text(cat.nombre, style: TextStyle(
                    fontSize: 12.5, fontWeight: FontWeight.w800,
                    color: tieneImagen ? Colors.white : acento)),
                ])),
              ])),

              Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 0), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // ── Nombre y ubicación ──────────────────────────────────
                Text(d.nombreLugar, style: TextStyle(fontFamily: 'CalSans', fontSize: 20, height: 1.15, color: scheme.onSurface)),
                if (lugar.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Row(children: [
                    Icon(Icons.place_outlined, size: 15, color: scheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Expanded(child: Text(lugar, style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant))),
                  ]),
                ],

                // ── Por qué te lo sugerimos ─────────────────────────────
                if (exp.motivo.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: acento.withValues(alpha: .08), borderRadius: BorderRadius.circular(14)),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Icon(Icons.auto_awesome_rounded, size: 17, color: acento),
                      const SizedBox(width: 8),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(exp.motivo, style: TextStyle(fontSize: 13.5, height: 1.3, fontWeight: FontWeight.w700, color: scheme.onSurface)),
                        if (exp.fuente.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(exp.fuente, maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 11, height: 1.35, color: scheme.onSurfaceVariant)),
                        ],
                      ])),
                    ]),
                  ),
                ],

                // Si no cumple todo lo pedido, se dice por qué.
                if (d.coincidencia != 'alta' && (d.motivoCoincidencia ?? '').isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Icon(Icons.info_outline_rounded, size: 15, color: colorCoincidencia),
                    const SizedBox(width: 6),
                    Expanded(child: Text(d.motivoCoincidencia!, style: TextStyle(fontSize: 12, height: 1.35, color: scheme.onSurfaceVariant))),
                  ]),
                ],

                // ── Modalidades y negocio local ─────────────────────────
                const SizedBox(height: 12),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  if (d.esMipyme) _chip(Icons.storefront_rounded, 'Negocio local', acento, relleno: true),
                  ...d.modalidades.map((w) => _chip(null, _nombresW[w] ?? w, acento)),
                  // Solo lo revisado por una persona se presenta como verificado.
                  if (d.verificado)
                    _chip(Icons.verified_rounded, 'Verificado por SMARTUR', acento, relleno: true)
                  else
                    _chip(Icons.info_outline_rounded, 'DENUE (INEGI) · por verificar', scheme.onSurfaceVariant),
                ]),
              ])),

              // ── Acciones ───────────────────────────────────────────────
              // Si no caben en una fila (pantallas angostas o letra grande), se apilan.
              Padding(padding: const EdgeInsets.fromLTRB(12, 10, 12, 12), child: OverflowBar(
                alignment: MainAxisAlignment.spaceBetween,
                overflowAlignment: OverflowBarAlignment.end,
                overflowSpacing: 6,
                children: [
                if (d.lat != null && d.lon != null)
                  TextButton.icon(
                    onPressed: _comoLlegar,
                    style: TextButton.styleFrom(foregroundColor: acento),
                    icon: const Icon(Icons.directions_rounded, size: 18),
                    label: const Text('Cómo llegar', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                if (onTap != null)
                  FilledButton.tonalIcon(
                    onPressed: onTap,
                    style: FilledButton.styleFrom(
                      backgroundColor: acento.withValues(alpha: .14), foregroundColor: acento,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                    label: const Text('Ver detalles', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
              ])),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _pastilla(String texto, Color color, Color sobre, {bool solida = false, Color? fondo}) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: solida ? color : (fondo ?? Colors.white).withValues(alpha: .92),
      borderRadius: BorderRadius.circular(20),
      border: solida ? null : Border.all(color: color.withValues(alpha: .5)),
    ),
    child: Text(texto, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: solida ? sobre : color)),
  );

  Widget _chip(IconData? icono, String texto, Color color, {bool relleno = false}) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: relleno ? color.withValues(alpha: .12) : null,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withValues(alpha: relleno ? 0 : .35)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      if (icono != null) ...[Icon(icono, size: 13, color: color), const SizedBox(width: 4)],
      Flexible(child: Text(texto, maxLines: 1, overflow: TextOverflow.ellipsis,
        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: color))),
    ]),
  );
}

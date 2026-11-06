import 'package:flutter/material.dart';
import '../../core/theme/welltur_theme.dart';
import '../../data/services/wellness_service.dart';

const _dimensionLabels = {
  'physical': 'Física', 'mental': 'Mental', 'emotional': 'Emocional',
  'spiritual': 'Espiritual', 'social': 'Social', 'environmental': 'Ambiental',
};

/// Card de destino con aprobación interna SMARTUR y dimensiones coincidentes.
class WellnessPoiCard extends StatelessWidget {
  final WellnessDestination destination;
  final VoidCallback? onTap;

  const WellnessPoiCard({
    super.key,
    required this.destination,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    // Acento de la paleta WELLTUR, legible en modo claro y oscuro.
    final accent = WellturPalette.acento(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: scheme.outlineVariant.withValues(alpha: 0.5),
          ),
          boxShadow: [
            BoxShadow(
              color: scheme.shadow.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Rank badge
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '#${destination.rank}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: accent,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          destination.nombreLugar,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: scheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${destination.municipio.isNotEmpty ? destination.municipio : destination.estado}${destination.categoriaWellness.isNotEmpty ? ' · ${destination.categoriaWellness.replaceAll('_', ' ')}' : ''}',
                          style: TextStyle(
                            fontSize: 12,
                            color: scheme.onSurface.withValues(alpha: 0.55),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Share of the user's selected dimensions represented by this place.
                  if (destination.matchPct > 0) Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${destination.matchPct.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        color: accent,
                        ),
                      ),
                      Text(
                        'dimensiones coincidentes',
                        style: TextStyle(
                          fontSize: 10,
                          color: scheme.onSurface.withValues(alpha: 0.45),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── Wellness validated badge ────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Wrap(spacing: 6, runSpacing: 6, children: [Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: accent.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_outlined, size: 12, color: accent),
                    const SizedBox(width: 4),
                    Text(
                      'Aprobado por SMARTUR',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: accent,
                      ),
                    ),
                  ],
                ),
              ),
              if (destination.esMipyme)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.storefront_outlined, size: 12, color: accent),
                    const SizedBox(width: 4),
                    Text('Negocio local (MiPyME)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: accent)),
                  ]),
                ),
              ]),
            ),

            // Lugares que no cumplen todo lo pedido: se dice el nivel y por qué.
            if (destination.coincidencia != 'alta')
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Icon(Icons.info_outline_rounded, size: 14, color: scheme.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Expanded(child: Text(
                    'Coincidencia ${destination.coincidencia}'
                    '${destination.motivoCoincidencia != null ? ': ${destination.motivoCoincidencia}' : ''}',
                    style: TextStyle(fontSize: 11, height: 1.35, fontWeight: FontWeight.w600, color: scheme.onSurfaceVariant),
                  )),
                ]),
              ),

            if (destination.explicacion.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: Text(
                  destination.explicacion,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurface.withValues(alpha: 0.75)),
                ),
              ),

            if (destination.wellnessDimensions.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Wrap(spacing: 6, runSpacing: 6, children: destination.wellnessDimensions.map((dimension) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(color: accent.withValues(alpha: .09), borderRadius: BorderRadius.circular(14)),
                  child: Text(_dimensionLabels[dimension] ?? dimension,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: accent)),
                )).toList()),
              ),

            // ── Description ─────────────────────────────────────────
            if (destination.descripcionBienestar.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: Text(
                  destination.descripcionBienestar,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    fontStyle: FontStyle.italic,
                    color: scheme.onSurface.withValues(alpha: 0.55),
                  ),
                ),
              ),

            if (onTap != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Text('Ver detalles', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: accent)),
                    const SizedBox(width: 3),
                    Icon(Icons.chevron_right_rounded, size: 17, color: accent),
                  ]),
                ),
              ),

            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../data/services/wellness_service.dart';

/// Colores y labels para cada modo de viaje (nunca mostrar nombre técnico interno)
const _modoColors = {
  'modo_calma':        Color(0xFF10B981),  // verde-esmeralda
  'modo_restauracion': Color(0xFF3B82F6),  // azul
  'modo_equilibrio':   Color(0xFF8B5CF6),  // lavanda
};

const _modoLabels = {
  'modo_calma':        'Modo Calma',
  'modo_restauracion': 'Modo Restauración',
  'modo_equilibrio':   'Modo Equilibrio',
};

const _modoIcons = {
  'modo_calma':        Icons.spa_outlined,
  'modo_restauracion': Icons.water_outlined,
  'modo_equilibrio':   Icons.self_improvement_outlined,
};

/// Card de destino wellness con badge de validación, barras de dimensiones
/// y chip de modo de viaje compatible.
class WellnessPoiCard extends StatelessWidget {
  final WellnessDestination destination;
  final String modoViaje;
  final VoidCallback? onTap;

  const WellnessPoiCard({
    super.key,
    required this.destination,
    required this.modoViaje,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final modoColor = _modoColors[modoViaje] ?? const Color(0xFF10B981);
    final modoLabel = _modoLabels[modoViaje] ?? modoViaje;
    final modoIcon  = _modoIcons[modoViaje] ?? Icons.spa_outlined;

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
                      color: modoColor.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '#${destination.rank}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: modoColor,
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
                          '${destination.estado}${destination.categoriaWellness.isNotEmpty ? ' · ${destination.categoriaWellness.replaceAll('_', ' ')}' : ''}',
                          style: TextStyle(
                            fontSize: 12,
                            color: scheme.onSurface.withValues(alpha: 0.55),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Match percentage
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${destination.matchPct.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: modoColor,
                        ),
                      ),
                      Text(
                        'compatibilidad',
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
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF22C55E).withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified_outlined, size: 12, color: Color(0xFF22C55E)),
                    const SizedBox(width: 4),
                    const Text(
                      'Lugar de Bienestar Validado',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF22C55E),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Dimension bars ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                children: [
                  _DimensionBar(
                    label: 'Tranquilidad',
                    icon: Icons.nature_outlined,
                    value: destination.nivelAislamiento,
                    color: modoColor,
                  ),
                  const SizedBox(height: 6),
                  _DimensionBar(
                    label: 'Relajación',
                    icon: Icons.water_drop_outlined,
                    value: destination.restauracionPasiva,
                    color: modoColor,
                  ),
                  const SizedBox(height: 6),
                  _DimensionBar(
                    label: 'Ritmo suave',
                    icon: Icons.nights_stay_outlined,
                    value: 1.0 - destination.demandaFisica,
                    color: modoColor,
                  ),
                ],
              ),
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

            // ── Modo viaje chip ─────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: modoColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(modoIcon, size: 12, color: modoColor),
                        const SizedBox(width: 5),
                        Text(
                          'Ideal para $modoLabel',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: modoColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DimensionBar extends StatelessWidget {
  final String label;
  final IconData icon;
  final double value;
  final Color color;

  const _DimensionBar({
    required this.label,
    required this.icon,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pct = (value * 100).toInt();

    return Row(
      children: [
        Icon(icon, size: 14, color: color.withValues(alpha: 0.7)),
        const SizedBox(width: 8),
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: scheme.onSurface.withValues(alpha: 0.65),
            ),
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value.clamp(0.0, 1.0),
              backgroundColor: color.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 32,
          child: Text(
            '$pct%',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ),
      ],
    );
  }
}

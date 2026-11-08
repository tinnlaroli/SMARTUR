import 'package:flutter/material.dart';

/// Piezas compartidas de los cuestionarios "una pregunta por pantalla"
/// (preferencias de SMARTUR, mismo lenguaje visual que Welltur).

/// Opción de una tarjeta: clave guardada, título visible, icono y detalle opcional.
typedef OpcionPremium = ({String key, String title, IconData icon, String? subtitle});

/// Barra de avance segmentada: un tramo por paso; el actual va a la mitad.
class BarraPasosPremium extends StatelessWidget {
  final int pasos;
  final int actual; // 1..pasos
  final Color acento;
  const BarraPasosPremium({super.key, required this.pasos, required this.actual, required this.acento});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(children: List.generate(pasos, (i) {
      final valor = i + 1 < actual ? 1.0 : (i + 1 == actual ? .5 : 0.0);
      return Expanded(child: Container(
        height: 5,
        margin: EdgeInsets.only(right: i == pasos - 1 ? 0 : 6),
        decoration: BoxDecoration(color: scheme.outlineVariant.withValues(alpha: .6), borderRadius: BorderRadius.circular(4)),
        child: Align(alignment: Alignment.centerLeft, child: AnimatedFractionallySizedBox(
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeOutCubic,
          widthFactor: valor,
          child: Container(decoration: BoxDecoration(color: acento, borderRadius: BorderRadius.circular(4))),
        )),
      ));
    }));
  }
}

/// Tarjeta seleccionable: icono en círculo, marca de elegida y animación suave.
class TarjetaPremium extends StatelessWidget {
  final OpcionPremium opcion;
  final bool seleccionada;
  final Color acento;
  final VoidCallback onTap;

  /// Horizontal (icono a la izquierda), para listas de una columna.
  final bool horizontal;
  final double altoMin;

  const TarjetaPremium({
    super.key,
    required this.opcion,
    required this.seleccionada,
    required this.acento,
    required this.onTap,
    this.horizontal = false,
    this.altoMin = 112,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final sel = seleccionada;
    final sobreAcento = ThemeData.estimateBrightnessForColor(acento) == Brightness.dark ? Colors.white : Colors.black;
    final icono = AnimatedContainer(
      duration: const Duration(milliseconds: 240),
      width: 40, height: 40,
      decoration: BoxDecoration(color: sel ? acento : acento.withValues(alpha: .12), shape: BoxShape.circle),
      child: Icon(opcion.icon, size: 21, color: sel ? sobreAcento : acento),
    );
    final marca = AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
      child: sel
          ? Icon(Icons.check_circle_rounded, key: const ValueKey('si'), color: acento, size: 24)
          : const SizedBox(key: ValueKey('no'), width: 24, height: 24),
    );
    final titulo = Text(opcion.title, style: TextStyle(
      fontFamily: 'Outfit', fontSize: 14.5, height: 1.2, fontWeight: FontWeight.w700, color: scheme.onSurface));
    final detalle = opcion.subtitle == null
        ? null
        : Text(opcion.subtitle!, style: TextStyle(fontFamily: 'Outfit', fontSize: 12, height: 1.3, color: scheme.onSurfaceVariant));

    return Semantics(button: true, selected: sel, label: opcion.title, child: GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: sel ? 1.0 : .985,
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOutBack,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          // Sin detalle, tarjetas más bajas: caben más opciones sin desplazar.
          constraints: BoxConstraints(minHeight: horizontal ? 64 : (opcion.subtitle == null ? altoMin - 22 : altoMin)),
          padding: horizontal ? const EdgeInsets.fromLTRB(12, 12, 14, 12) : const EdgeInsets.fromLTRB(14, 14, 12, 14),
          decoration: BoxDecoration(
            gradient: sel
                ? LinearGradient(colors: [acento.withValues(alpha: .22), acento.withValues(alpha: .06)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight)
                : null,
            color: sel ? null : scheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? acento : scheme.outlineVariant.withValues(alpha: .7), width: sel ? 1.8 : 1),
          ),
          child: horizontal
              ? Row(children: [
                  icono,
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                    titulo,
                    if (detalle != null) ...[const SizedBox(height: 3), detalle],
                  ])),
                  const SizedBox(width: 8),
                  marca,
                ])
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [icono, const Spacer(), marca]),
                  const SizedBox(height: 12),
                  titulo,
                  if (detalle != null) ...[const SizedBox(height: 4), detalle],
                ]),
        ),
      ),
    ));
  }
}

/// Rejilla de tarjetas: 2 columnas en teléfono, 3 en pantallas anchas, o 1 fija.
class RejillaPremium extends StatelessWidget {
  final List<OpcionPremium> opciones;
  final bool Function(String key) elegida;
  final ValueChanged<String> onTap;
  final Color acento;
  final int? columnas;
  const RejillaPremium({super.key, required this.opciones, required this.elegida, required this.onTap,
    required this.acento, this.columnas});

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, c) {
    final n = columnas ?? (c.maxWidth >= 560 ? 3 : 2);
    final ancho = (c.maxWidth - 10 * (n - 1)) / n;
    return Wrap(spacing: 10, runSpacing: 10, children: [
      for (final o in opciones)
        SizedBox(width: ancho, child: TarjetaPremium(
          opcion: o,
          seleccionada: elegida(o.key),
          acento: acento,
          horizontal: n == 1,
          onTap: () => onTap(o.key),
        )),
    ]);
  });
}

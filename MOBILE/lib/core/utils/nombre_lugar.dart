/// Nombre presentable de un lugar.
///
/// El DENUE (INEGI) registra muchos negocios sin razón comercial como
/// "Comercio al por menor en tiendas de artesanías Sin Nombre" o "Cafeteria Sin Nombre".
/// Se muestra la actividad sin la coletilla: "Tienda de artesanías", "Cafetería".
String nombreLugar(String nombre) {
  final limpio = nombre.trim();
  final sinNombre = RegExp(r'\s*\bsin\s+nombre\b\.?\s*$', caseSensitive: false);
  if (!sinNombre.hasMatch(limpio)) return limpio;
  var base = limpio.replaceFirst(sinNombre, '').trim();
  base = base.replaceFirst(RegExp(r'^comercio\s+al\s+por\s+menor\s+(en|de)\s+', caseSensitive: false), '');
  base = base.replaceFirst(RegExp(r'^tiendas\b', caseSensitive: false), 'Tienda');
  if (base.isEmpty) return 'Negocio local';
  // Acentos frecuentes que el DENUE omite.
  const acentos = {
    'cafeteria': 'cafetería', 'artesanias': 'artesanías', 'pension': 'pensión',
    'panaderia': 'panadería', 'cocina economica': 'cocina económica', 'neveria': 'nevería',
  };
  var texto = base.toLowerCase();
  acentos.forEach((sin, con) => texto = texto.replaceAll(sin, con));
  return texto[0].toUpperCase() + texto.substring(1);
}

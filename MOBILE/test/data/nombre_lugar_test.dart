import 'package:flutter_test/flutter_test.dart';
import 'package:smartur/core/utils/nombre_lugar.dart';

void main() {
  test('quita "Sin Nombre" del DENUE y deja la actividad', () {
    expect(nombreLugar('Comercio Al Por Menor en Tiendas de Artesanías Sin Nombre'), 'Tienda de artesanías');
    expect(nombreLugar('Cafeteria Sin Nombre'), 'Cafetería');
    expect(nombreLugar('Pension Sin Nombre'), 'Pensión');
    expect(nombreLugar('Sin Nombre'), 'Negocio local');
  });
  test('los nombres reales no cambian', () {
    expect(nombreLugar('Aramy Spa'), 'Aramy Spa');
    expect(nombreLugar('Mujeres de la Niebla'), 'Mujeres de la Niebla');
  });
}

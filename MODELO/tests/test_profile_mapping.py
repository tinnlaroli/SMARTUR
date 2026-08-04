"""
Tests de regresión del mapeo perfil-móvil → contexto del modelo.

Cubre el bug encontrado en la revisión end-to-end: varias opciones del
cuestionario de la app (Historia, Arte, Fotografía, Deportes, Bienestar,
Nightlife) NO se mapeaban a ningún tipo de turismo y se caían en silencio,
dejando tiposTurismo vacío; y travel_type ('Familiar'/'Romántico') no
coincidía con lo que preference_match_score espera ('familia'/'pareja'),
matando el bono de grupo para usuarios reales.
"""
import poi_repository as pr
from context_encoder import TOURISM_TYPES


# Las 10 opciones de interés reales del onboarding (step2_interests_screen.dart)
MOBILE_INTERESTS = [
    'Cultura', 'Gastronomía', 'Aventura', 'Naturaleza', 'Historia',
    'Fotografía', 'Deportes', 'Bienestar', 'Arte', 'Nightlife',
]

# Las 6 opciones de travel_type reales del onboarding
MOBILE_TRAVEL_TYPES = [
    'Mochilero', 'Familiar', 'Lujo', 'Aventura', 'Romántico', 'De negocios',
]


def _resolve_interest(label: str):
    return pr._INTEREST_MAP.get(label.lower().strip())


def test_todas_las_opciones_de_interes_mapean():
    """Ninguna opción del cuestionario debe caerse en silencio."""
    for label in MOBILE_INTERESTS:
        mapped = _resolve_interest(label)
        assert mapped is not None, f"Interés '{label}' no mapea a ningún tipo"
        assert mapped in TOURISM_TYPES, f"'{label}' -> '{mapped}' no es un TOURISM_TYPE válido"


def test_nocturno_es_tipo_valido():
    assert 'nocturno' in TOURISM_TYPES
    assert _resolve_interest('Nightlife') == 'nocturno'


def test_interes_cultural_agrupa_historia_y_arte():
    assert _resolve_interest('Historia') == 'cultural'
    assert _resolve_interest('Arte') == 'cultural'


def test_perfil_solo_intereses_antes_rotos_no_queda_vacio():
    """El caso que motivó el arreglo: un perfil de Historia+Arte+Fotografía
    antes producía tiposTurismo=[]. Ahora debe producir señal."""
    interests = ['Historia', 'Arte', 'Fotografía']
    tipos = []
    for i in interests:
        m = _resolve_interest(i)
        if m and m not in tipos:
            tipos.append(m)
    assert tipos, "tiposTurismo quedó vacío — la señal de preferencia está muerta"
    assert 'cultural' in tipos


def test_travel_type_familiar_y_romantico_activan_grupo():
    """El bono de grupo solo se dispara con 'familia'/'pareja'."""
    assert pr._TRAVEL_GROUP_MAP.get('familiar') == 'familia'
    assert pr._TRAVEL_GROUP_MAP.get('romántico') == 'pareja'
    assert pr._TRAVEL_GROUP_MAP.get('romantico') == 'pareja'


def test_travel_type_valores_semilla_pasan_de_largo():
    """Valores ya correctos (solo/pareja/familia/amigos) no deben romperse:
    el fallback los deja pasar."""
    for g in ('solo', 'pareja', 'familia', 'amigos'):
        assert pr._TRAVEL_GROUP_MAP.get(g, g) == g


def test_lujo_y_negocios_no_activan_bono_falso():
    """Lujo/De negocios no deben mapearse a pareja/familia (evita bono falso)."""
    assert pr._TRAVEL_GROUP_MAP.get('lujo') not in ('familia', 'pareja')
    assert pr._TRAVEL_GROUP_MAP.get('de negocios') not in ('familia', 'pareja')

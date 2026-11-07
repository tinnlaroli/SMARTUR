import random

from etapa_b import MIN_PARA_ESTIMAR, evaluar


def _sesiones(n, efecto=0.0, seed=1):
    """Sesiones de prueba: con estrés alto, la persona abre más lugares con W1 si efecto > 0."""
    rnd = random.Random(seed)
    salida = []
    for i in range(n):
        pss = rnd.uniform(5, 38)
        items = []
        for pos in range(1, 6):
            mods = rnd.sample(["W1", "W2", "W3", "W4", "W5", "W6", "W7"], 2)
            p = 0.3 + (efecto * (pss - 18.6) / 20 if "W1" in mods else 0)
            items.append({"modalidades": ",".join(mods), "posicion": pos,
                          "abierto": rnd.random() < max(0.02, min(0.98, p)), "elegido": False, "calificacion": None})
        salida.append({"session_id": i, "user_id": i, "pss10_total": pss, "motivos": ["M1"],
                       "modalidades_pedidas": ["W1"], "satisfaccion": rnd.randint(2, 5), "items": items})
    return salida


def test_pocas_sesiones_solo_descriptivos():
    r = evaluar(_sesiones(MIN_PARA_ESTIMAR - 1), meta=200)
    assert r["estado"] == "insuficiente"
    assert r["lista_para_promover"] is False
    assert r["faltan"] == 200 - (MIN_PARA_ESTIMAR - 1)


def test_nunca_promueve_antes_de_la_meta():
    r = evaluar(_sesiones(120, efecto=0.6), meta=200)
    assert r["estado"] == "evaluado"
    assert r["lista_para_promover"] is False
    assert "faltan" in r["mensaje"]


def test_detecta_efecto_real_del_estres():
    r = evaluar(_sesiones(400, efecto=0.6), meta=200)
    assert r["or_estres_por_modalidad"]["W1"] > 1.2
    assert r["lista_para_promover"] is True


def test_sin_efecto_no_promueve():
    r = evaluar(_sesiones(400, efecto=0.0, seed=7), meta=200)
    assert r["lista_para_promover"] is False

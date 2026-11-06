import unittest

from welltur_ranker_v2 import combinar_pesos, pesos_modelo, recomendar

ARTEFACTO = {
    "modelo": "welltur_preferencias_v1",
    "fuente": "prueba",
    "estres": {"media": 50.0, "de": 20.0},
    "tipos": {
        "pref_caminatas": {"intercepto": 0.4, "beta_estres_z": 0.0},
        "pref_relajacion": {"intercepto": -0.3, "beta_estres_z": 1.2},
    },
    "pref_a_w": {
        "pref_caminatas": {"W2": 2, "W3": 2},
        "pref_relajacion": {"W4": 2, "W1": 1},
    },
}


def lugar(lugar_id, nombre, modalidades, *, categoria="Naturaleza", mipyme=False, esfuerzo=0.0,
          estado="Veracruz", aprobado=True):
    return {
        "id_destino": lugar_id,
        "nombre_lugar": nombre,
        "estado": estado,
        "categoria_wellness": categoria,
        "is_wellness": True,
        "wellness_status": "approved" if aprobado else "pending",
        "wellness_modalities": modalidades,
        "wellness_mw_evidence": {w: f"Evidencia revisada para {w}." for w in modalidades},
        "demanda_fisica": esfuerzo,
        "es_mipyme": mipyme,
    }


class WelltuRankerV2Tests(unittest.TestCase):
    def test_estres_alto_sube_peso_de_mente_cuerpo(self):
        bajo = pesos_modelo(ARTEFACTO, 20)
        alto = pesos_modelo(ARTEFACTO, 80)
        self.assertGreater(alto["W4"], bajo["W4"])
        self.assertLess(alto["W2"], bajo["W2"])
        self.assertAlmostEqual(sum(alto.values()), 1.0)

    def test_sin_estres_usa_popularidad_y_sin_modalidades_solo_modelo(self):
        self.assertEqual(combinar_pesos(None, [], ARTEFACTO), pesos_modelo(ARTEFACTO, 50.0))

    def test_preferencia_declarada_pesa_mas_que_el_modelo(self):
        pesos = combinar_pesos(50, ["W5"], ARTEFACTO)
        self.assertEqual(max(pesos, key=pesos.get), "W5")

    def test_estres_cambia_el_orden(self):
        destinos = [lugar("poi:1", "Sendero", ["W2", "W3"]), lugar("poi:2", "Temazcal", ["W4", "W1"], categoria="Spa")]
        bajo = recomendar(destinos, {"estres_0_100": 10}, top_n=2, artefacto=ARTEFACTO)
        alto = recomendar(destinos, {"estres_0_100": 95}, top_n=2, artefacto=ARTEFACTO)
        self.assertEqual(bajo["destinations"][0]["id_destino"], "poi:1")
        self.assertEqual(alto["destinations"][0]["id_destino"], "poi:2")
        self.assertTrue(alto["destinations"][0]["explicacion"].startswith("Porque buscas"))

    def test_cuota_mipyme_y_tope_por_categoria(self):
        destinos = [lugar(f"poi:{i}", f"Bosque {i}", ["W2", "W3"]) for i in range(5)]
        destinos += [lugar("service:1", "Café de olla", ["W5", "W1"], categoria="Gastronomia", mipyme=True),
                     lugar("service:2", "Posada", ["W1"], categoria="Hospedaje", mipyme=True)]
        res = recomendar(destinos, {}, top_n=5, artefacto=ARTEFACTO)
        categorias = [d["categoria_wellness"] for d in res["destinations"]]
        self.assertEqual(res["mipyme_in_top"], 2)
        self.assertLessEqual(categorias.count("Naturaleza"), 3)
        self.assertEqual(len(res["destinations"]), 5)

    def test_filtros_duros(self):
        destinos = [lugar("poi:1", "Pico", ["W3"], esfuerzo=1.0), lugar("poi:2", "Pendiente", ["W1"], aprobado=False),
                    lugar("poi:3", "Lejos", ["W1"], estado="Puebla"), lugar("poi:4", "Mirador", ["W2"])]
        res = recomendar(destinos, {"max_effort": 2, "region_filter": "veracruz"}, artefacto=ARTEFACTO)
        ids = [d["id_destino"] for d in res["destinations"]]
        # Lo que cumple todo va primero; lo no aprobado nunca aparece.
        self.assertEqual(ids[0], "poi:4")
        self.assertNotIn("poi:2", ids)
        self.assertEqual(res["candidates"], 1)
        self.assertEqual(res["destinations"][0]["coincidencia"], "alta")

    def test_nunca_vacio_relaja_con_aviso_y_motivo(self):
        destinos = [lugar("poi:1", "Pico", ["W3"], esfuerzo=1.0), lugar("poi:3", "Lejos", ["W1"], estado="Puebla")]
        res = recomendar(destinos, {"max_effort": 1, "region_filter": "veracruz"}, artefacto=ARTEFACTO)
        por_id = {d["id_destino"]: d for d in res["destinations"]}
        self.assertEqual(set(por_id), {"poi:1", "poi:3"})
        self.assertEqual(res["candidates"], 0)
        self.assertIsNotNone(res["aviso_coincidencia"])
        self.assertEqual(por_id["poi:1"]["coincidencia"], "baja")
        self.assertIn("esfuerzo", por_id["poi:1"]["motivo_coincidencia"])
        self.assertIn("zona", por_id["poi:3"]["motivo_coincidencia"])
        # Relajar el esfuerzo va antes que salir de la región.
        self.assertLess(por_id["poi:1"]["rank"], por_id["poi:3"]["rank"])

    def test_modalidad_no_elegida_es_coincidencia_media_y_va_despues(self):
        destinos = [lugar("poi:1", "Mirador", ["W1"]), lugar("poi:2", "Cocina", ["W5"])]
        res = recomendar(destinos, {"modality_preferences": ["W5"]}, artefacto=ARTEFACTO)
        self.assertEqual([d["id_destino"] for d in res["destinations"]], ["poi:2", "poi:1"])
        self.assertEqual([d["coincidencia"] for d in res["destinations"]], ["alta", "media"])
        # "media" ya cumple todos los filtros: no lleva aviso de menor relación.
        self.assertIsNone(res["aviso_coincidencia"])

    def test_pss10_se_equipara_con_normas(self):
        from welltur_ranker_v2 import estres_desde_pss10
        artefacto = {**ARTEFACTO, "estres": {"media": 50.0, "de": 20.0},
                     "equivalencia_pss10": {"media": 18.0, "de": 8.0}}
        self.assertEqual(estres_desde_pss10(18.0, artefacto), 50.0)  # en la media de las normas
        self.assertEqual(estres_desde_pss10(26.0, artefacto), 70.0)  # +1 DE
        self.assertEqual(estres_desde_pss10(40.0, artefacto), 100.0)  # recortado a 0-100
        sin_normas = {**ARTEFACTO, "estres": {"media": 50.0, "de": 20.0}}
        self.assertEqual(estres_desde_pss10(20.0, sin_normas), 50.0)  # proporcional

    def test_municipio_filtrado_respeta_categoria_y_no_repite_nombres(self):
        destinos = [lugar(f"service:{i}", "Café 88", ["W5", "W1"], categoria="Gastronomia", mipyme=True) for i in range(2)]
        destinos += [lugar(f"service:{i + 5}", f"Fonda {i}", ["W5", "W1"], categoria="Gastronomia", mipyme=True) for i in range(3)]
        destinos.append(lugar("poi:9", "Museo comunitario", ["W6"], categoria="Cultura"))
        for d in destinos:
            d["municipio"] = "Coscomatepec de Bravo"
        res = recomendar(destinos, {"region_filter": "Coscomatepec"}, top_n=3, artefacto={**ARTEFACTO, "pref_a_w": {
            "pref_caminatas": {"W5": 2, "W1": 1}, "pref_relajacion": {"W6": 1}}})
        nombres = [d["nombre_lugar"] for d in res["destinations"]]
        self.assertEqual(len(nombres), len(set(nombres)))
        self.assertIn("Museo comunitario", nombres)

    def test_valida_entradas(self):
        with self.assertRaises(ValueError):
            recomendar([], {"estres_0_100": 140}, artefacto=ARTEFACTO)
        with self.assertRaises(ValueError):
            recomendar([], {"modality_preferences": ["W9"]}, artefacto=ARTEFACTO)


if __name__ == "__main__":
    unittest.main()


class FormularioUnicoTests(unittest.TestCase):
    """PSS-10 + motivos M + modalidades W en una sola solicitud (ranker v3)."""

    def test_motivo_sin_modalidades_prioriza_su_modalidad_principal(self):
        destinos = [lugar("a", "Café", ["W5"], mipyme=True), lugar("b", "Temazcal", ["W4"], mipyme=True),
                    lugar("c", "Hotel", ["W1"], mipyme=True)]
        res = recomendar(destinos, {"motive_priorities": ["M9"]}, top_n=3, artefacto=ARTEFACTO)
        self.assertEqual(res["destinations"][0]["id_destino"], "b")
        self.assertEqual(res["destinations"][0]["coincidencia"], "alta")
        self.assertEqual(res["motivos_usados"], ["M9"])

    def test_motivos_y_modalidades_se_combinan(self):
        solo_w = combinar_pesos(None, ["W5"], ARTEFACTO)
        con_m = combinar_pesos(None, ["W5"], ARTEFACTO, motivos=["M1"])
        self.assertGreater(con_m["W1"], solo_w["W1"])
        self.assertAlmostEqual(sum(con_m.values()), 1.0, places=6)

    def test_pss10_por_items_aplica_modelo_de_afrontamiento_acotado(self):
        destinos = [lugar("a", "Hotel", ["W1"], mipyme=True), lugar("b", "Café", ["W5"], mipyme=True)]
        alto = [4, 4, 4, 0, 0, 4, 0, 0, 4, 4]
        res = recomendar(destinos, {"pss10_total": 40, "pss10_items": alto, "modality_preferences": ["W5"]},
                         top_n=2, artefacto=ARTEFACTO)
        self.assertIsNotNone(res["afinidad_afrontamiento"])
        self.assertEqual(set(res["afinidad_afrontamiento"]),
                         {"descanso_pasivo", "convivencia", "actividad_pasatiempo", "espiritualidad"})
        # El ajuste está acotado: nunca cambia un peso más de lo permitido.
        self.assertAlmostEqual(sum(res["weights"].values()), 1.0, places=3)

    def test_pss10_items_invalidos(self):
        for items in ([5] * 10, [1] * 9, [None, None, None, 1, 1, 1, 1, 1, 1, 1]):
            with self.assertRaises(ValueError):
                recomendar([], {"pss10_items": items}, artefacto=ARTEFACTO)
        with self.assertRaises(ValueError):
            recomendar([], {"motive_priorities": ["M10"]}, artefacto=ARTEFACTO)

    def test_motivo_etiquetado_en_lugar_cuenta_como_alta(self):
        nacional = lugar("n", "Spa nacional", ["W7"], mipyme=False)
        nacional["wellness_motives"] = ["M1"]
        res = recomendar([nacional], {"motive_priorities": ["M1"], "modality_preferences": ["W3"]},
                         top_n=1, artefacto=ARTEFACTO)
        self.assertEqual(res["destinations"][0]["coincidencia"], "alta")

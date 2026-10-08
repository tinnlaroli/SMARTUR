import unittest

from wellness_mw_ranker import recommend_from_mw_preferences


def place(place_id, name, motives, modalities, *, effort=0.0, accessible=True,
          status="approved", reviewed=True, evidence=None):
    tags = set(motives + modalities)
    return {
        "id_destino": place_id,
        "nombre_lugar": name,
        "estado": "Veracruz",
        "categoria_wellness": "Naturaleza",
        "is_wellness": True,
        "wellness_status": status,
        "wellness_mw_reviewed_at": "2026-10-08" if reviewed else None,
        "wellness_motives": motives,
        "wellness_modalities": modalities,
        "wellness_mw_evidence": evidence or {tag: f"Evidencia revisada para {tag}." for tag in tags},
        "demanda_fisica": effort,
        "is_accessible": accessible,
    }


class WellnessMWRankerTests(unittest.TestCase):
    def test_respects_priority_order_and_keeps_m_and_w_explanations_separate(self):
        destinations = [
            place("poi:1", "Aventura", ["M2"], ["W2"]),
            place("poi:2", "Pausa", ["M1"], ["W1"]),
        ]
        result = recommend_from_mw_preferences(
            destinations,
            {"motive_priorities": ["M1", "M2"], "modality_preferences": ["W1"]},
        )
        self.assertEqual([item["id_destino"] for item in result["destinations"]], ["poi:2", "poi:1"])
        self.assertEqual(result["destinations"][0]["matched_M"], ["M1"])
        self.assertEqual(result["destinations"][0]["matched_W"], ["W1"])
        self.assertEqual(result["algorithm"], "explicit_mw_content_baseline_v1")
        self.assertEqual(result["ml_status"], "not_trained_on_real_traveler_feedback")

    def test_unapproved_unreviewed_and_unsupported_tags_are_not_recommended(self):
        destinations = [
            place("poi:1", "Aprobado", ["M1"], [], reviewed=True),
            place("poi:2", "Pendiente", ["M1"], [], status="pending"),
            place("poi:3", "Sin revisión M/W", ["M1"], [], reviewed=False),
            place("poi:4", "Sin evidencia", ["M1"], [], evidence={"M1": ""}),
        ]
        result = recommend_from_mw_preferences(destinations, {"motive_priorities": ["M1"]})
        self.assertEqual([item["id_destino"] for item in result["destinations"]], ["poi:1"])

    def test_accessibility_effort_and_region_are_hard_filters(self):
        destinations = [
            place("poi:1", "Accesible", ["M1"], [], effort=0.0, accessible=True),
            place("poi:2", "No accesible", ["M1"], [], effort=0.0, accessible=False),
            place("poi:3", "Esfuerzo alto", ["M1"], [], effort=1.0, accessible=True),
            {**place("poi:4", "Otro estado", ["M1"], [], effort=0.0), "estado": "Puebla"},
        ]
        result = recommend_from_mw_preferences(destinations, {
            "motive_priorities": ["M1"], "needs_accessible": True,
            "max_effort": 1, "region_filter": "Veracruz",
        })
        self.assertEqual([item["id_destino"] for item in result["destinations"]], ["poi:1"])

    def test_invalid_or_empty_preferences_are_rejected(self):
        for preferences in (
            {"motive_priorities": ["M1", "M1"]},
            {"motive_priorities": ["M10"]},
            {"modality_preferences": ["W8"]},
            {"motive_priorities": ["M1", "M2", "M3", "M4"]},
            {"motive_priorities": ["M1"], "max_effort": 0},
            {},
        ):
            with self.subTest(preferences=preferences), self.assertRaises(ValueError):
                recommend_from_mw_preferences([], preferences)


if __name__ == "__main__":
    unittest.main()

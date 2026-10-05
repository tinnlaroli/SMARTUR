import pytest

from wellness_preference_ranker import recommend_from_preferences


def prefs(dimensions=("mental",), activity="moderate", region=None):
    return {
        "wellness_dimensions": list(dimensions),
        "activity_level": activity,
        "region_filter": region,
    }


def catalog():
    return [
        {
            "id_destino": "poi:1", "nombre_lugar": "Bosque", "estado": "Veracruz",
            "wellness_dimensions": ["mental", "environmental"], "demanda_fisica": 0.2,
        },
        {
            "id_destino": "poi:2", "nombre_lugar": "Temazcal", "estado": "Veracruz",
            "wellness_dimensions": ["physical"], "demanda_fisica": 0.5,
        },
        {
            "id_destino": "poi:3", "nombre_lugar": "Museo", "estado": "Puebla",
            "wellness_dimensions": ["mental"], "demanda_fisica": 0.5,
        },
    ]


def test_rank_prioritizes_requested_dimension_and_activity_fit():
    results = recommend_from_preferences(catalog(), prefs(activity="low", region="Veracruz"), top_n=3)

    assert [row["id_destino"] for row in results] == ["poi:1"]
    assert results[0]["match_pct"] == 100.0
    assert results[0]["wellness_dimensions"] == ["mental"]


def test_region_filter_is_accent_and_case_insensitive():
    data = catalog()
    data[0]["estado"] = "VERACRÚZ"

    results = recommend_from_preferences(data, prefs(region="veracruz"), top_n=10)

    assert [row["id_destino"] for row in results] == ["poi:1"]


def test_returns_empty_when_no_candidate_matches_region_or_has_dimensions():
    results = recommend_from_preferences(catalog(), prefs(region="Oaxaca"), top_n=3)
    assert results == []


@pytest.mark.parametrize("dimensions", [[], ["clinical"], ["mental", "clinical"]])
def test_rejects_invalid_preference_dimensions(dimensions):
    with pytest.raises(ValueError):
        recommend_from_preferences(catalog(), prefs(dimensions=dimensions))


def test_activity_changes_order_without_claiming_probability():
    results = recommend_from_preferences(catalog(), prefs(("physical",), "high"), top_n=3)

    assert results[0]["id_destino"] == "poi:2"
    assert results[0]["match_pct"] == 100.0
    assert 0 <= results[0]["match_pct"] <= 100


def test_preference_overlap_has_priority_and_effort_only_breaks_ties():
    destinations = [
        {
            "id_destino": "poi:low", "nombre_lugar": "Low effort", "estado": "Veracruz",
            "wellness_dimensions": ["mental"], "demanda_fisica": 0.1,
        },
        {
            "id_destino": "poi:high", "nombre_lugar": "High effort", "estado": "Veracruz",
            "wellness_dimensions": ["mental"], "demanda_fisica": 0.9,
        },
        {
            "id_destino": "poi:partial", "nombre_lugar": "Partial match", "estado": "Veracruz",
            "wellness_dimensions": ["physical"], "demanda_fisica": 0.5,
        },
        {
            "id_destino": "poi:full", "nombre_lugar": "Full match", "estado": "Veracruz",
            "wellness_dimensions": ["mental", "physical"], "demanda_fisica": 0.1,
        },
    ]

    results = recommend_from_preferences(
        destinations,
        prefs(dimensions=("mental", "physical"), activity="high"),
        top_n=4,
    )

    assert [row["id_destino"] for row in results] == ["poi:full", "poi:high", "poi:partial", "poi:low"]
    assert [row["match_pct"] for row in results] == [100.0, 50.0, 50.0, 50.0]
    assert [row["demanda_fisica"] for row in results] == [0.0, 1.0, 0.5, 0.0]
    assert all("beneficio_optimo_pct" not in row for row in results)

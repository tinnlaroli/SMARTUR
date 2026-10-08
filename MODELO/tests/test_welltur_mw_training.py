import unittest

import numpy as np

from train_welltur_mw import OPT_IN_FEEDBACK_QUERY, TAG_ORDER, _feature, _labels_from_rows, _pairs, _session_groups, train


class WellturMWTrainingTests(unittest.TestCase):
    def test_feedback_query_excludes_seed_and_demo_accounts(self):
        self.assertIn("u.is_seeded = FALSE", OPT_IN_FEEDBACK_QUERY)
        self.assertIn("u.email NOT ILIKE '%@smartur.demo'", OPT_IN_FEEDBACK_QUERY)
    def test_pairwise_features_encode_user_priorities_and_place_tags(self):
        profile = {"motive_priorities": ["M1", "M2"], "modality_preferences": ["W2"]}
        preferred = {"motive_tags": ["M1"], "modality_tags": ["W2"]}
        other = {"motive_tags": ["M2"], "modality_tags": []}
        delta = _feature(profile, preferred) - _feature(profile, other)
        self.assertEqual(len(TAG_ORDER), 16)
        self.assertEqual(delta[TAG_ORDER.index("M1")], 3)
        self.assertEqual(delta[TAG_ORDER.index("M2")], -2)
        self.assertEqual(delta[TAG_ORDER.index("W2")], 3)

    def test_only_explicit_positive_negative_feedback_becomes_pairwise_labels(self):
        rows = [
            {"session_id": 1, "user_id": 4, "item_id": "poi:1", "event_type": "saved",
             "motive_priorities": ["M1"], "modality_preferences": ["W1"],
             "motive_tags_snapshot": ["M1"], "modality_tags_snapshot": ["W1"]},
            {"session_id": 1, "user_id": 4, "item_id": "poi:2", "event_type": "rated", "rating": 1,
             "motive_priorities": ["M1"], "modality_preferences": ["W1"],
             "motive_tags_snapshot": ["M1"], "modality_tags_snapshot": []},
            {"session_id": 1, "user_id": 4, "item_id": "poi:3", "event_type": "rated", "rating": 3,
             "motive_priorities": ["M1"], "modality_preferences": ["W1"],
             "motive_tags_snapshot": ["M1"], "modality_tags_snapshot": ["W1"]},
        ]
        labels = _labels_from_rows(rows)
        self.assertEqual(labels[(1, "poi:1")]["label"], 1)
        self.assertEqual(labels[(1, "poi:2")]["label"], 0)
        self.assertNotIn((1, "poi:3"), labels)
        x, y = _pairs(_session_groups(labels), {4})
        self.assertEqual(x.shape, (2, len(TAG_ORDER)))
        self.assertEqual(y.tolist(), [1, 0])
        self.assertTrue(np.any(x[0]))

    def test_training_abstains_below_user_minimum_and_does_not_promote_synthetic_small_samples(self):
        rows = []
        for user_id in range(5):
            for item_id, event in (("poi:1", "saved"), ("poi:2", "dismissed")):
                rows.append({
                    "session_id": user_id + 1, "user_id": user_id + 1, "item_id": item_id,
                    "event_type": event, "rating": None,
                    "motive_priorities": ["M1"], "modality_preferences": ["W1"],
                    "motive_tags_snapshot": ["M1"], "modality_tags_snapshot": ["W1"],
                })
        result = train(rows, min_users=50, min_pairs=10)
        self.assertEqual(result["status"], "insufficient_data")
        self.assertFalse(result["promoted"])
        self.assertNotIn("weights", result)


if __name__ == "__main__":
    unittest.main()

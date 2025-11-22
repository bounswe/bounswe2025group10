

from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
@override_settings(
    CARBON_FACTORS={
        "pet_bottle_500ml": 0.04,          # kg CO2e per bottle
        "aluminum_can_12oz": 0.17,         # kg CO2e per can
        "glass_beer_bottle_12oz": 0.30,    # kg CO2e per glass bottle
    },
    CARBON_DECIMALS=3,
)
class LocalCarbonFromJsonViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.user = User.objects.create_user(
            email="basar@example.com",
            username="basar",
            password="test1234"
        )

        # Log in the test client
        self.client.force_login(self.user)


        self.url = "/carbon/estimate/"

    def test_happy_path_with_matched_and_unmatched_items(self):
        payload = {
            "items": [
                {"item_name": "bottle", "count": 2},
                {"item_name": "can", "count": 3},
                {"item_name": "glass_bottle", "count": 1},
                {"item_name": "unknown_item", "count": 5},
            ]
        }

        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        # Top-level keys
        self.assertIn("items", data)
        self.assertIn("total_kgco2e", data)
        self.assertIn("unmatched", data)

        # Check unmatched
        self.assertListEqual(data["unmatched"], ["unknown_item"])

        # Check matched items length
        self.assertEqual(len(data["items"]), 3)

        # Use a helper dict keyed by item_name
        items_by_name = {item["item_name"]: item for item in data["items"]}

        # bottle → pet_bottle_500ml, 2 * 0.04 = 0.08
        bottle = items_by_name["bottle"]
        self.assertEqual(bottle["matched_factor_key"], "pet_bottle_500ml")
        self.assertEqual(bottle["count"], 2.0)
        self.assertEqual(bottle["factor_kgco2e_per_unit"], 0.04)
        self.assertEqual(bottle["subtotal_kgco2e"], 0.08)

        # can → aluminum_can_12oz, 3 * 0.17 = 0.51
        can = items_by_name["can"]
        self.assertEqual(can["matched_factor_key"], "aluminum_can_12oz")
        self.assertEqual(can["count"], 3.0)
        self.assertEqual(can["factor_kgco2e_per_unit"], 0.17)
        self.assertEqual(can["subtotal_kgco2e"], 0.51)

        # glass_bottle → glass_beer_bottle_12oz, 1 * 0.30 = 0.30
        glass = items_by_name["glass_bottle"]
        self.assertEqual(glass["matched_factor_key"], "glass_beer_bottle_12oz")
        self.assertEqual(glass["count"], 1.0)
        self.assertEqual(glass["factor_kgco2e_per_unit"], 0.30)
        self.assertEqual(glass["subtotal_kgco2e"], 0.30)

        # Total: 0.08 + 0.51 + 0.30 = 0.89
        self.assertEqual(data["total_kgco2e"], 0.89)

    def test_items_must_be_non_empty_list(self):
        # items missing
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.data["detail"])

        # items not a list
        response = self.client.post(self.url, {"items": {}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # items empty list
        response = self.client.post(self.url, {"items": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_count_must_be_numeric_and_non_negative(self):
        # non-numeric
        response = self.client.post(
            self.url,
            {"items": [{"item_name": "bottle", "count": "not-a-number"}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Row 1", response.data["detail"])

        # negative
        response = self.client.post(
            self.url,
            {"items": [{"item_name": "bottle", "count": -1}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("≥ 0", response.data["detail"])




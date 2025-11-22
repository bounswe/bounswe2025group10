from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List

from django.conf import settings  # ✅ use Django settings correctly
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


def _round_kg(x: float) -> float:
    p = getattr(settings, "CARBON_DECIMALS", 6)
    return float(Decimal(str(x)).quantize(Decimal(f"1e-{p}"), rounding=ROUND_HALF_UP))


# Map incoming item names to the .gov-backed factor keys you keep in settings.CARBON_FACTORS
# Feel free to extend this with Turkish aliases etc.
FACTOR_ALIASES: Dict[str, str] = {
    "bottle": "pet_bottle_500ml",           # NIH/NEMS range 0.034–0.046 kg CO2e (fabrication stage)
    "pet_bottle": "pet_bottle_500ml",
    "pet_bottle_500ml": "pet_bottle_500ml",

    "can": "aluminum_can_12oz",             # Derived from EPA WARM v16 + EPA avg can mass
    "aluminum_can": "aluminum_can_12oz",
    "aluminium_can": "aluminum_can_12oz",
    "aluminum_can_12oz": "aluminum_can_12oz",

    "glass_bottle": "glass_beer_bottle_12oz",  # Derived from EPA WARM v16 + EPA bottle mass
    "beer_bottle": "glass_beer_bottle_12oz",
    "glass_beer_bottle_12oz": "glass_beer_bottle_12oz",
}


class LocalCarbonFromJsonView(APIView):
    """
    POST /carbon/estimate/
    Body:
      {
        "items": [
          {"item_name": "bottle", "count": 2},
          {"item_name": "can", "count": 3}
        ]
      }

    Notes:
    - Factors are taken from settings.CARBON_FACTORS (floats, kg CO2e per ITEM).
    - We allow user-friendly names via FACTOR_ALIASES → canonical keys.
    """

    def post(self, request):
        # 1) Load factors from settings
        factors: Dict[str, float] = getattr(settings, "CARBON_FACTORS", {})
        if not factors:
            return Response(
                {"detail": "CARBON_FACTORS not configured in Django settings."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 2) Basic body validation
        body = request.data or {}
        rows: List[Dict[str, Any]] = body.get("items", [])
        if not isinstance(rows, list) or not rows:
            return Response(
                {"detail": "'items' must be a non-empty list of {item_name, count}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3) Iterate & compute
        results = []
        total = 0.0
        unmatched = []

        for idx, row in enumerate(rows, start=1):
            raw_name = str(row.get("item_name", "")).strip()
            name = raw_name.lower()

            # count must be numeric and >= 0
            try:
                count = float(row.get("count", 0))
            except Exception:
                return Response(
                    {"detail": f"Row {idx}: 'count' must be numeric."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if count < 0:
                return Response(
                    {"detail": f"Row {idx}: 'count' must be \u2265 0."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Resolve alias → canonical factor key
            canonical = FACTOR_ALIASES.get(name, name)

            # Factor lookup
            if canonical not in factors:
                unmatched.append(raw_name or f"(empty at row {idx})")
                continue

            per = float(factors[canonical])          # kg CO2e per item
            sub = per * count
            total += sub

            results.append({
                "item_name": raw_name,               # as sent by client
                "matched_factor_key": canonical,     # which factor was used
                "count": _round_kg(count),
                "factor_kgco2e_per_unit": _round_kg(per),
                "subtotal_kgco2e": _round_kg(sub),
            })

        # 4) Build response
        resp = {
            "items": results,
            "total_kgco2e": _round_kg(total),
        }
        if unmatched:
            resp["unmatched"] = sorted(set(unmatched))

        return Response(resp, status=status.HTTP_200_OK)

CARBON_FACTORS = {
    # kg CO2e per item, production/manufacturing stage
    "pet_bottle_500ml": 0.034,   # lower end of NIH/NEMS range (fabrication only)
    "pet_bottle_500ml_max": 0.046,  # upper end (fabrication only)
    "aluminum_can_12oz": 0.0687,    # derived from EPA WARM v16 + EPA can mass
    "glass_beer_bottle_12oz": 0.138 # derived from EPA WARM v16 + EPA bottle mass
}
CARBON_DECIMALS = 6
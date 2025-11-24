import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { useRecyclingCenters } from "../hooks/useRecyclingCenters";

export default function RecyclingCenters() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  // Fetch data from API
  const {
    cities,
    districts,
    centers,
    citiesLoading,
    districtsLoading,
    centersLoading,
    selectedCity,
    selectedDistrict,
    handleCityChange: onCityChange,
    handleDistrictChange: onDistrictChange,
  } = useRecyclingCenters();

  const loading = citiesLoading || districtsLoading || centersLoading;

  const handleCityChange = (e) => {
    onCityChange(e.target.value);
  };

  const handleDistrictChange = (e) => {
    onDistrictChange(e.target.value);
  };

  // Get waste type icon
  const getWasteTypeIcon = (type) => {
    const icons = {
      paper: "📄",
      plastic: "♻️",
      glass: "🍾",
      metal: "🔩",
      electronic: "📱",
      battery: "🔋",
      oil_fats: "🛢️",
      organic: "🌿",
      textile: "👕",
      medicine: "💊",
      tire: "⚙️",
      bulky: "📦",
      wood: "🪵",
      fluorescent: "💡",
      accumulator: "🔋",
      construction: "🏗️",
      hazardous: "⚠️",
      cable: "🔌",
      it_equipment: "💻"
    };
    return icons[type] || "♻️";
  };

  return (
    <Navbar active="recycling">
      <motion.main
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Hero Image and Title */}
        <div className="relative mb-8 rounded-xl overflow-hidden">
          <img
            src="/assets/recycling-center.jpeg"
            alt="Recycling Center"
            className="w-full h-[33rem] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30 flex items-start justify-center pt-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
              {t('recyclingCenters.title', 'Recycling Centers')}
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* City Dropdown */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: currentTheme.text }}
            >
              {t('recyclingCenters.selectCity', 'Select City')}
            </label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full rounded-lg border px-4 py-3 text-sm"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border,
                color: currentTheme.text
              }}
            >
              <option value="">{t('recyclingCenters.chooseCity', 'Choose a city...')}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: currentTheme.text }}
            >
              {t('recyclingCenters.selectDistrict', 'Select District')}
            </label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedCity}
              className="w-full rounded-lg border px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border,
                color: currentTheme.text
              }}
            >
              <option value="">{t('recyclingCenters.chooseDistrict', 'Choose a district...')}</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
              {t('recyclingCenters.loading', 'Loading...')}
            </div>
          </div>
        ) : selectedCity && selectedDistrict && centers.length > 0 ? (
          <div className="space-y-6">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: currentTheme.text }}
            >
              {t('recyclingCenters.centersIn', 'Centers in')} {selectedDistrict}, {selectedCity}
            </h2>
            {centers.map((center, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border shadow-md p-6"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border
                }}
              >
                {/* Address */}
                <div className="mb-4">
                  <h3
                    className="text-[5px] font-semibold mb-2 uppercase tracking-wider"
                    style={{ color: currentTheme.secondary, opacity: 0.8 }}
                  >
                    {t('recyclingCenters.address', 'Address')}
                  </h3>
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: currentTheme.text }}
                  >
                    {center.adres}
                  </p>
                </div>

                {/* Additional Info */}
                <div className="mb-4">
                  <h3
                    className="text-[5px] font-semibold mb-2 uppercase tracking-wider"
                    style={{ color: currentTheme.secondary, opacity: 0.8 }}
                  >
                    {t('recyclingCenters.additionalInfo', 'Additional Information')}
                  </h3>
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: currentTheme.text, opacity: 0.85 }}
                  >
                    {center.not}
                  </p>
                </div>

                {/* Accepted Waste Types */}
                <div>
                  <h3
                    className="text-[5px] font-semibold mb-3 uppercase tracking-wider"
                    style={{ color: currentTheme.secondary, opacity: 0.8 }}
                  >
                    {t('recyclingCenters.acceptedTypes', 'Accepted Waste Types')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {center.turler.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: currentTheme.secondary + '15',
                          color: currentTheme.secondary
                        }}
                      >
                        <span>{getWasteTypeIcon(type)}</span>
                        <span>{t(`recyclingCenters.wasteTypes.${type}`, type)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : selectedCity && selectedDistrict ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
              {t('recyclingCenters.noCenters', 'No recycling centers found for the selected location.')}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
              {t('recyclingCenters.selectLocation', 'Please select a city and district to view recycling centers.')}
            </div>
          </div>
        )}
      </motion.main>
    </Navbar>
  );
}

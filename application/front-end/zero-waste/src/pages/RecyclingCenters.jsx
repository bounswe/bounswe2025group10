import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { useRecyclingCenters } from "../hooks/useRecyclingCenters";

// TODO: Remove this after backend is ready - keeping for testing
// Set to true when backend endpoints are ready
const USE_API = false;

// Recycling center data
const recyclingCentersData = [
  {
    il: "Istanbul",
    merkezler: [
      {
        ilce: "Sultangazi",
        adres: "Esentepe Mah. Kucuk San. Sit. 2951 Sokak 9.Blok No:28/1 Sultangazi / Istanbul",
        not: "Elektronik Atik Toplama Merkezi",
        turler: ["electronic"]
      },
      {
        ilce: "Beylikduzu",
        adres: "Beylikduzu 1. Sinif Atik Getirme Merkezi",
        not: "Kagit, plastik, cam, metal, atik piller ve elektrikli-elektronik esyalar kabul ediliyor.",
        turler: ["paper","plastic","glass","metal","battery","electronic"]
      },
      {
        ilce: "Atasehir",
        adres: "Barbaros Mah. Sebboy Sok. No:4 PK:34746 Atasehir / Istanbul",
        not: "Elektronik atik toplama kutusu talebi hizmeti mevcut.",
        turler: ["electronic","battery"]
      }
    ]
  },
  {
    il: "Ankara",
    merkezler: [
      {
        ilce: "Cankaya (Birlik Mah.)",
        adres: "451. Cadde (Fen Isleri Kampusu) Cankaya / Ankara",
        not: "Cankaya Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","metal","glass","textile","battery","electronic","medicine","oil_fats","tire","bulky"]
      },
      {
        ilce: "Cankaya (Cayyolu)",
        adres: "Alacaatli Cad. 2889/1 Sok. Cankaya / Ankara",
        not: "Cankaya Belediyesi 2. Atik Getirme Merkezi",
        turler: ["paper","plastic","metal","glass","textile","battery","electronic","medicine","oil_fats","tire","bulky"]
      },
      {
        ilce: "Mamak",
        adres: "Huseyingazi Mah. Mamak Cad. No:181 Mamak / Ankara",
        not: "Mamak Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","metal","glass","wood","textile","electronic","battery","fluorescent","accumulator","medicine","oil_fats","tire"]
      },
      {
        ilce: "Yenimahalle (Ivedik OSB)",
        adres: "Hurdacilar Sitesi B-7 Blok No:341 Yenimahalle / Ankara",
        not: "TBT Elektronik Geri Donusum",
        turler: ["electronic","metal","plastic"]
      },
      {
        ilce: "Kecioren",
        adres: "Yozgat Bulvari No:99A Kecioren / Ankara",
        not: "Kecioren Belediyesi Atik Getirme Merkezi",
        turler: ["paper","plastic","metal","glass","battery","electronic","oil_fats","tire","textile"]
      }
    ]
  },
  {
    il: "Izmir",
    merkezler: [
      {
        ilce: "Karsiyaka",
        adres: "Mavisehir, Zubeyde Hanim, Bahcelievler, Ornekköy mahallelerinde seyyar atik getirme merkezleri / Izmir",
        not: "Elektrikli ve elektronik esya atiklari seyyar merkezlerde toplanıyor.",
        turler: ["electronic","paper","plastic","metal","glass","battery"]
      },
      {
        ilce: "Buca",
        adres: "Buca Belediyesi Atik Toplama Merkezi",
        not: "Plastik, cam, metal, ahsap, elektronik atiklar kabul ediliyor.",
        turler: ["plastic","glass","metal","wood","electronic"]
      }
    ]
  },
  {
    il: "Bursa",
    merkezler: [
      {
        ilce: "Nilufer",
        adres: "Alaaddinbey Mah. 611. Sok. Nilufer / Bursa",
        not: "Nilufer Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","metal","glass","textile","wood","electronic","battery","accumulator","oil_fats","tire","medicine","bulky"]
      },
      {
        ilce: "Osmangazi",
        adres: "Demirtas Cumhuriyet Mah. Osmangazi / Bursa",
        not: "Osmangazi Belediyesi Atik Getirme Merkezi",
        turler: ["paper","plastic","glass","metal","electronic","battery"]
      },
      {
        ilce: "Yildirim",
        adres: "Ahmet Taner Kislali Meydani No:2 Yildirim / Bursa",
        not: "Belediye hizmet binasinda atik getirme noktasi",
        turler: ["electronic","battery","paper","plastic","glass"]
      },
      {
        ilce: "Nilufer (Bursa OSB)",
        adres: "Hasanaga OSB 9. Cad. No:12 Nilufer / Bursa",
        not: "Benli Geri Donusum Fabrikasi",
        turler: ["plastic","textile","paper","metal","wood"]
      },
      {
        ilce: "Inegol",
        adres: "Organize Sanayi Bolgesi, Inegol / Bursa",
        not: "Inegol Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","glass","metal","electronic","battery","oil_fats","tire","textile","wood"]
      }
    ]
  },
  {
    il: "Antalya",
    merkezler: [
      {
        ilce: "Konyaalti",
        adres: "Zumrut Mah. Cumhuriyet Cad. Konyaalti / Antalya",
        not: "Konyaalti Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","metal","glass","textile","battery","electronic","medicine","oil_fats","tire","organic"]
      },
      {
        ilce: "Muratpasa",
        adres: "Yuksekalan Mah. Adnan Menderes Bulv. No:20 Muratpasa / Antalya",
        not: "Atik Yonetimi Sube Mudurlugu",
        turler: ["paper","plastic","glass","metal","electronic","oil_fats","battery"]
      },
      {
        ilce: "Kepez (Kizilli)",
        adres: "Kizilli Mah. Karaoz Sok. No:127 Kepez / Antalya",
        not: "Buyuksehir Entegre Atik Degerlendirme Tesisi",
        turler: ["organic","paper","plastic","glass","metal"]
      },
      {
        ilce: "Manavgat",
        adres: "Sanayi Mah. 2058 Sok. No:4 Manavgat / Antalya",
        not: "1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","glass","metal","textile","battery","accumulator","oil_fats","electronic","fluorescent","tire","wood","medicine","bulky"]
      },
      {
        ilce: "Dosemealti",
        adres: "Komurcular OSB Mah. Azizoglu Sok. No:89 Dosemealti / Antalya",
        not: "SBC Geri Donusum A.S.",
        turler: ["electronic","metal","hazardous"]
      }
    ]
  },
  {
    il: "Adana",
    merkezler: [
      {
        ilce: "Seyhan",
        adres: "Yesiloba Mah. Seyhan / Adana",
        not: "Adana'nin ilk 1. sinif atik getirme merkezi",
        turler: ["electronic","battery","plastic","paper","metal","glass","textile","medicine","oil_fats","tire","bulky"]
      },
      {
        ilce: "Seyhan",
        adres: "Doseme Mah. Turhan Cemal Beriker Bulv. No:57 Seyhan / Adana",
        not: "Seyhan Belediyesi Atik Getirme Merkezi",
        turler: ["glass","paper","plastic","metal","textile","battery","electronic","medicine","oil_fats","tire"]
      },
      {
        ilce: "Yuregir",
        adres: "Atakent Mah. 2874 Sok. No:31 Yuregir / Adana",
        not: "Katkisan Geri Donusum",
        turler: ["electronic","battery","cable","it_equipment"]
      },
      {
        ilce: "Cukurova",
        adres: "Turkmenbasi Bulv. No:61 Cukurova / Adana",
        not: "Belediye hizmet binasinda atik toplama noktasi",
        turler: ["oil_fats","battery","accumulator","medicine"]
      },
      {
        ilce: "Saricam",
        adres: "Yesil Cevre Sanayi Sitesi, Saricam / Adana",
        not: "Ozel geri donusum tesisi",
        turler: ["electronic","metal","plastic","hazardous"]
      }
    ]
  },
  {
    il: "Gaziantep",
    merkezler: [
      {
        ilce: "Sehitkamil",
        adres: "Aydinlar Mah. 1. Sinif Atik Getirme Merkezi Sehitkamil / Gaziantep",
        not: "Hane ve isyerlerinden atik kabulu icin kurulan merkez",
        turler: ["electronic","paper","plastic","glass","metal","battery","oil_fats","textile"]
      }
    ]
  },
  {
    il: "Aydin",
    merkezler: [
      {
        ilce: "Efeler (Merkez)",
        adres: "Belediye Hizmet Binasi yani, Cumhuriyet Mah. Efeler / Aydin",
        not: "Atik Market ve 1. Sinif Atik Getirme Merkezi",
        turler: ["paper","plastic","glass","metal","electronic","battery","oil_fats","textile"]
      },
      {
        ilce: "Efeler (Ovaeymir)",
        adres: "Ovaeymir Mah. 199 Ada 1 Parsel Efeler / Aydin",
        not: "Buyuksehir Atik Getirme Merkezi",
        turler: ["paper","plastic","glass","metal","electronic","battery","accumulator","medicine","oil_fats"]
      },
      {
        ilce: "Kusadasi",
        adres: "Davutlar Mah. Atik Getirme Merkezi Kusadasi / Aydin",
        not: "Lisansli merkez; 16 kategoride atik ayristirma",
        turler: ["paper","plastic","glass","metal","textile","electronic","battery","accumulator","oil_fats","tire","wood","construction"]
      },
      {
        ilce: "Incirliova",
        adres: "Organize Sanayi Bolgesi, Incirliova / Aydin",
        not: "Aydin Hurdaci - ozel geri donusum merkezi",
        turler: ["metal","plastic","paper","glass","electronic"]
      },
      {
        ilce: "Didim",
        adres: "Sanayi Bolgesi, Gecici Atik Toplama Noktasi Didim / Aydin",
        not: "Mobil atik getirme ve bitkisel atik yag konteynerleri",
        turler: ["paper","plastic","glass","metal","oil_fats","battery","electronic"]
      }
    ]
  }
];

export default function RecyclingCenters() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  // API-based data fetching
  const apiData = useRecyclingCenters();

  // Hardcoded fallback
  const [selectedCityLocal, setSelectedCityLocal] = useState("");
  const [selectedDistrictLocal, setSelectedDistrictLocal] = useState("");

  const citiesLocal = useMemo(() => {
    return recyclingCentersData.map(item => item.il);
  }, []);

  const districtsLocal = useMemo(() => {
    if (!selectedCityLocal) return [];
    const cityData = recyclingCentersData.find(item => item.il === selectedCityLocal);
    return cityData ? cityData.merkezler.map(merkez => merkez.ilce) : [];
  }, [selectedCityLocal]);

  const centersLocal = useMemo(() => {
    if (!selectedCityLocal || !selectedDistrictLocal) return [];
    const cityData = recyclingCentersData.find(item => item.il === selectedCityLocal);
    if (!cityData) return [];
    return cityData.merkezler.filter(merkez => merkez.ilce === selectedDistrictLocal);
  }, [selectedCityLocal, selectedDistrictLocal]);

  const handleCityChangeLocal = (e) => {
    setSelectedCityLocal(e.target.value);
    setSelectedDistrictLocal("");
  };

  const handleDistrictChangeLocal = (e) => {
    setSelectedDistrictLocal(e.target.value);
  };

  // Choose between API and hardcoded data based on USE_API flag
  const cities = USE_API ? apiData.cities : citiesLocal;
  const districts = USE_API ? apiData.districts : districtsLocal;
  const centers = USE_API ? apiData.centers : centersLocal;
  const selectedCity = USE_API ? apiData.selectedCity : selectedCityLocal;
  const selectedDistrict = USE_API ? apiData.selectedDistrict : selectedDistrictLocal;
  const loading = USE_API ? (apiData.citiesLoading || apiData.districtsLoading || apiData.centersLoading) : false;

  const handleCityChange = (e) => {
    if (USE_API) {
      apiData.handleCityChange(e.target.value);
    } else {
      handleCityChangeLocal(e);
    }
  };

  const handleDistrictChange = (e) => {
    if (USE_API) {
      apiData.handleDistrictChange(e.target.value);
    } else {
      handleDistrictChangeLocal(e);
    }
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

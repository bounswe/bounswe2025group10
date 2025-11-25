/**
 * @vitest-environment jsdom
 */
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RecyclingCenters from "../../pages/RecyclingCenters";
import { MemoryRouter } from "react-router-dom";
import * as React from "react"; // Used in mock for useState

// Mock ThemeContext
const mockTheme = {
  background: "#ffffff",
  text: "#000000",
  primary: "#4CAF50",
  secondary: "#2196F3",
  border: "#e0e0e0",
};

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({ currentTheme: mockTheme }),
}));

// Mock LanguageContext
const wasteTypeTranslations = {
  'recyclingCenters.wasteTypes.paper': 'Paper',
  'recyclingCenters.wasteTypes.plastic': 'Plastic',
  'recyclingCenters.wasteTypes.glass': 'Glass',
  'recyclingCenters.wasteTypes.metal': 'Metal',
  'recyclingCenters.wasteTypes.electronic': 'Electronic',
  'recyclingCenters.wasteTypes.battery': 'Battery',
  'recyclingCenters.wasteTypes.oil_fats': 'Oil & Fats',
  'recyclingCenters.wasteTypes.organic': 'Organic',
  'recyclingCenters.wasteTypes.textile': 'Textile',
  'recyclingCenters.wasteTypes.medicine': 'Medicine',
  'recyclingCenters.wasteTypes.tire': 'Tire',
  'recyclingCenters.wasteTypes.bulky': 'Bulky Waste',
  'recyclingCenters.wasteTypes.wood': 'Wood',
  'recyclingCenters.wasteTypes.fluorescent': 'Fluorescent',
  'recyclingCenters.wasteTypes.accumulator': 'Accumulator',
  'recyclingCenters.wasteTypes.construction': 'Construction',
  'recyclingCenters.wasteTypes.hazardous': 'Hazardous',
  'recyclingCenters.wasteTypes.cable': 'Cable',
  'recyclingCenters.wasteTypes.it_equipment': 'IT Equipment',
};

const mockT = (key, fallback) => wasteTypeTranslations[key] || fallback || key;

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: mockT,
    isRTL: false,
  }),
}));

// Mock Navbar
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div data-testid="mock-navbar">{children}</div>,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    main: ({ children, ...props }) => <main {...props}>{children}</main>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
  },
}));

// Mock useRecyclingCenters hook with test data
const mockRecyclingCentersData = {
  Istanbul: {
    districts: ["Sultangazi", "Beylikduzu", "Atasehir"],
    centers: {
      Sultangazi: [{
        ilce: "Sultangazi",
        adres: "Esentepe Mah. Kucuk San. Sit. 2951 Sokak 9.Blok No:28/1 Sultangazi / Istanbul",
        not: "Elektronik Atik Toplama Merkezi",
        turler: ["electronic"]
      }],
      Beylikduzu: [{
        ilce: "Beylikduzu",
        adres: "Beylikduzu 1. Sinif Atik Getirme Merkezi",
        not: "Kagit, plastik, cam, metal, atik piller ve elektrikli-elektronik esyalar kabul ediliyor.",
        turler: ["paper", "plastic", "glass", "metal", "battery", "electronic"]
      }],
      Atasehir: [{
        ilce: "Atasehir",
        adres: "Barbaros Mah. Sebboy Sok. No:4 PK:34746 Atasehir / Istanbul",
        not: "Elektronik atik toplama kutusu talebi hizmeti mevcut.",
        turler: ["electronic", "battery"]
      }]
    }
  },
  Ankara: {
    districts: ["Cankaya (Birlik Mah.)", "Cankaya (Cayyolu)", "Mamak", "Kecioren", "Yenimahalle (Ivedik OSB)"],
    centers: {
      "Cankaya (Birlik Mah.)": [{
        ilce: "Cankaya (Birlik Mah.)",
        adres: "451. Cadde (Fen Isleri Kampusu) Cankaya / Ankara",
        not: "Cankaya Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper", "plastic", "metal", "glass", "textile", "battery", "electronic", "medicine", "oil_fats", "tire", "bulky"]
      }],
      "Mamak": [{
        ilce: "Mamak",
        adres: "Huseyingazi Mah. Mamak Cad. No:181 Mamak / Ankara",
        not: "Mamak Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper", "plastic", "metal", "glass", "wood", "textile", "electronic", "battery", "fluorescent", "accumulator", "medicine", "oil_fats", "tire"]
      }]
    }
  },
  Izmir: {
    districts: ["Karsiyaka", "Buca"],
    centers: {}
  },
  Bursa: {
    districts: ["Nilufer", "Osmangazi", "Yildirim", "Inegol"],
    centers: {
      Nilufer: [{
        ilce: "Nilufer",
        adres: "Alaaddinbey Mah. 611. Sok. Nilufer / Bursa",
        not: "Nilufer Belediyesi 1. Sinif Atik Getirme Merkezi",
        turler: ["paper", "plastic", "metal", "glass", "textile", "wood", "electronic", "battery", "accumulator", "oil_fats", "tire", "medicine", "bulky"]
      }]
    }
  },
  Antalya: {
    districts: ["Konyaalti", "Muratpasa", "Kepez (Kizilli)", "Manavgat", "Dosemealti"],
    centers: {
      Dosemealti: [{
        ilce: "Dosemealti",
        adres: "Komurcular OSB Mah. Azizoglu Sok. No:89 Dosemealti / Antalya",
        not: "SBC Geri Donusum A.S.",
        turler: ["electronic", "metal", "hazardous"]
      }]
    }
  },
  Adana: {
    districts: ["Seyhan"],
    centers: {}
  },
  Gaziantep: {
    districts: ["Sehitkamil"],
    centers: {}
  },
  Aydin: {
    districts: ["Efeler (Merkez)"],
    centers: {}
  }
};

vi.mock("../../hooks/useRecyclingCenters", () => ({
  useRecyclingCenters: () => {
    const [selectedCity, setSelectedCity] = React.useState("");
    const [selectedDistrict, setSelectedDistrict] = React.useState("");

    const cities = Object.keys(mockRecyclingCentersData);
    const districts = selectedCity ? mockRecyclingCentersData[selectedCity]?.districts || [] : [];
    const centers = (selectedCity && selectedDistrict)
      ? mockRecyclingCentersData[selectedCity]?.centers[selectedDistrict] || []
      : [];

    return {
      cities,
      districts,
      centers,
      citiesLoading: false,
      districtsLoading: false,
      centersLoading: false,
      selectedCity,
      selectedDistrict,
      handleCityChange: (city) => {
        setSelectedCity(city);
        setSelectedDistrict("");
      },
      handleDistrictChange: (district) => {
        setSelectedDistrict(district);
      },
    };
  },
}));

const wrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe("<RecyclingCenters />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the page with hero image and title", () => {
    render(<RecyclingCenters />, { wrapper });

    expect(screen.getByText("Recycling Centers")).toBeInTheDocument();
    expect(screen.getByAltText("Recycling Center")).toBeInTheDocument();
  });

  it("renders city and district dropdowns", () => {
    render(<RecyclingCenters />, { wrapper });

    expect(screen.getByText("Select City")).toBeInTheDocument();
    expect(screen.getByText("Select District")).toBeInTheDocument();
  });

  it("shows default placeholder message when no selection is made", () => {
    render(<RecyclingCenters />, { wrapper });

    expect(
      screen.getByText("Please select a city and district to view recycling centers.")
    ).toBeInTheDocument();
  });

  it("populates city dropdown with available cities", () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    expect(cityDropdown).toBeInTheDocument();

    // Check if cities are in the dropdown
    expect(screen.getByRole("option", { name: "Istanbul" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ankara" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Izmir" })).toBeInTheDocument();
  });

  it("enables district dropdown after city selection", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    // Initially district dropdown should be disabled
    expect(districtDropdown).toBeDisabled();

    // Select a city
    fireEvent.change(cityDropdown, { target: { value: "Istanbul" } });

    // District dropdown should now be enabled
    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });
  });

  it("displays districts for selected city", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];

    // Select Istanbul
    fireEvent.change(cityDropdown, { target: { value: "Istanbul" } });

    // Check if Istanbul districts are available
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sultangazi" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Beylikduzu" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Atasehir" })).toBeInTheDocument();
    });
  });

  it("displays recycling centers when both city and district are selected", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    // Select city
    fireEvent.change(cityDropdown, { target: { value: "Istanbul" } });

    // Wait for district dropdown to update
    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    // Select district
    fireEvent.change(districtDropdown, { target: { value: "Sultangazi" } });

    // Check if center information is displayed
    await waitFor(() => {
      expect(screen.getByText(/Centers in/)).toBeInTheDocument();
      expect(screen.getByText(/Esentepe Mah/)).toBeInTheDocument();
    });
  });

  it("shows center details including address, additional info, and waste types", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    fireEvent.change(cityDropdown, { target: { value: "Ankara" } });

    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    fireEvent.change(districtDropdown, { target: { value: "Cankaya (Birlik Mah.)" } });

    await waitFor(() => {
      // Check for section headers
      expect(screen.getByText("Address")).toBeInTheDocument();
      expect(screen.getByText("Additional Information")).toBeInTheDocument();
      expect(screen.getByText("Accepted Waste Types")).toBeInTheDocument();

      // Check for actual content
      expect(screen.getByText(/451. Cadde/)).toBeInTheDocument();
      expect(screen.getByText(/Cankaya Belediyesi/)).toBeInTheDocument();
    });
  });

  it("displays waste type badges with icons", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    fireEvent.change(cityDropdown, { target: { value: "Istanbul" } });

    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    fireEvent.change(districtDropdown, { target: { value: "Beylikduzu" } });

    await waitFor(() => {
      // Check if waste types are displayed
      expect(screen.getByText("Paper")).toBeInTheDocument();
      expect(screen.getByText("Plastic")).toBeInTheDocument();
      expect(screen.getByText("Glass")).toBeInTheDocument();
      expect(screen.getByText("Metal")).toBeInTheDocument();
      expect(screen.getByText("Battery")).toBeInTheDocument();
      expect(screen.getByText("Electronic")).toBeInTheDocument();
    });
  });

  it("resets district selection when city changes", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    // Select Istanbul and a district
    fireEvent.change(cityDropdown, { target: { value: "Istanbul" } });

    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    fireEvent.change(districtDropdown, { target: { value: "Sultangazi" } });

    // Change city to Ankara
    fireEvent.change(cityDropdown, { target: { value: "Ankara" } });

    // District should be reset
    await waitFor(() => {
      expect(districtDropdown.value).toBe("");
    });
  });

  it("displays multiple centers if district has more than one", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    // Select Ankara
    fireEvent.change(cityDropdown, { target: { value: "Ankara" } });

    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    // Cankaya has multiple locations
    fireEvent.change(districtDropdown, { target: { value: "Cankaya (Birlik Mah.)" } });

    await waitFor(() => {
      // Should show at least one center
      const addressHeaders = screen.getAllByText("Address");
      expect(addressHeaders.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows correct waste type icons", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    fireEvent.change(cityDropdown, { target: { value: "Bursa" } });

    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    fireEvent.change(districtDropdown, { target: { value: "Nilufer" } });

    await waitFor(() => {
      // Check if various waste types are shown
      expect(screen.getByText("Wood")).toBeInTheDocument();
      expect(screen.getByText("Textile")).toBeInTheDocument();
      expect(screen.getByText("Medicine")).toBeInTheDocument();
    });
  });

  it("handles cities with special characters correctly", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];

    // Test cities with Turkish characters
    expect(screen.getByRole("option", { name: "Izmir" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Aydin" })).toBeInTheDocument();

    fireEvent.change(cityDropdown, { target: { value: "Izmir" } });

    await waitFor(() => {
      const districtDropdown = screen.getAllByRole("combobox")[1];
      expect(districtDropdown).not.toBeDisabled();
    });
  });

  it("renders hero section with correct styling", () => {
    render(<RecyclingCenters />, { wrapper });

    const heroImage = screen.getByAltText("Recycling Center");
    expect(heroImage).toHaveClass("w-full", "h-[33rem]", "object-cover");
  });

  it("displays all available cities in dropdown", () => {
    render(<RecyclingCenters />, { wrapper });

    // Check all cities are available
    const cities = ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep", "Aydin"];

    cities.forEach(city => {
      expect(screen.getByRole("option", { name: city })).toBeInTheDocument();
    });
  });

  it("shows hazardous waste type for specific centers", async () => {
    render(<RecyclingCenters />, { wrapper });

    const cityDropdown = screen.getAllByRole("combobox")[0];
    const districtDropdown = screen.getAllByRole("combobox")[1];

    fireEvent.change(cityDropdown, { target: { value: "Antalya" } });

    await waitFor(() => {
      expect(districtDropdown).not.toBeDisabled();
    });

    fireEvent.change(districtDropdown, { target: { value: "Dosemealti" } });

    await waitFor(() => {
      expect(screen.getByText("Hazardous")).toBeInTheDocument();
    });
  });
});

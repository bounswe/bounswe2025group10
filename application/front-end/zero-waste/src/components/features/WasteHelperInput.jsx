import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";

const UNIT_CONVERSIONS = {
    PLASTIC: [
        { labelKey: "plasticBottle", grams: 25 },
        { labelKey: "plasticBag", grams: 5 },
        { labelKey: "plasticCup", grams: 3 },
    ],
    PAPER: [
        { labelKey: "paperSheet", grams: 5 },
        { labelKey: "notebook", grams: 80 },
    ],
    GLASS: [
        { labelKey: "glassBottle", grams: 200 },
        { labelKey: "glassJar", grams: 150 },
    ],
    METAL: [
        { labelKey: "aluminumCan", grams: 15 },
        { labelKey: "metalSpoon", grams: 30 },
    ],
    ELECTRONIC: [
        { labelKey: "phoneCharger", grams: 100 },
        { labelKey: "usbCable", grams: 30 },
    ],
    "OIL&FATS": [
        { labelKey: "cookingOil", grams: 14 },
        { labelKey: "butterWrapper", grams: 1 },
    ],
    ORGANIC: [
        { labelKey: "bananaPeel", grams: 25 },
        { labelKey: "appleCore", grams: 20 },
        { labelKey: "foodScraps", grams: 50 },
    ],
};

const CustomDropdown = ({ value, onChange, options, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentTheme } = useTheme();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
            <div
                className="w-full px-3 py-2 border rounded-md cursor-pointer flex items-center justify-between text-sm"
                style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption?.label || placeholder}</span>
                <span className={`ml-2 text-xs ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </div>
            {isOpen && !disabled && (
                <div
                    className="absolute z-10 w-full mt-1 border rounded-md max-h-60 overflow-auto"
                    style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border
                    }}
                >
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`px-3 py-2 cursor-pointer text-sm ${value === option.value ? "font-semibold" : ""
                                }`}
                            style={{
                                backgroundColor: value === option.value ? currentTheme.hover : 'transparent',
                                color: currentTheme.text
                            }}
                            onClick={() => {
                                onChange({ target: { value: option.value } });
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function WasteHelperInput({ onSubmit, isLoading }) {
    const { currentTheme } = useTheme();
    const { t } = useLanguage();

    const [wasteType, setWasteType] = useState("");
    const [method, setMethod] = useState(""); // "grams" or "unit"
    const [quantity, setQuantity] = useState(""); // raw quantity input (grams or count)
    const [unitOption, setUnitOption] = useState(""); // selected unit labelKey

    // Calculate grams for display when in unit mode
    const calculatedGrams = method === "unit" && unitOption && quantity && wasteType
        ? (() => {
            const conv = UNIT_CONVERSIONS[wasteType]?.find(u => u.labelKey === unitOption);
            return conv ? conv.grams * parseInt(quantity) : "";
        })()
        : "";

    const handleAdd = () => {
        if (!wasteType || !method) return;

        let gramsToSend = 0;

        if (method === "grams") {
            gramsToSend = parseInt(quantity);
        } else if (method === "unit") {
            if (!unitOption || !quantity) return;
            const conv = UNIT_CONVERSIONS[wasteType].find(
                (u) => u.labelKey === unitOption
            );
            if (conv) {
                gramsToSend = conv.grams * parseInt(quantity);
            }
        }

        if (gramsToSend <= 0 || isNaN(gramsToSend)) return;

        onSubmit({
            waste_type: wasteType,
            amount: gramsToSend,
        });

        // Reset
        setWasteType("");
        setMethod("");
        setQuantity("");
        setUnitOption("");
    };

    // Memoized dropdown options
    const wasteTypeOptions = [
        { value: "", label: t("wasteHelper.selectType") },
        { value: "PLASTIC", label: t("mainPage.wasteTypes.plastic") },
        { value: "PAPER", label: t("mainPage.wasteTypes.paper") },
        { value: "GLASS", label: t("mainPage.wasteTypes.glass") },
        { value: "METAL", label: t("mainPage.wasteTypes.metal") },
        { value: "ELECTRONIC", label: t("mainPage.wasteTypes.electronic") },
        { value: "OIL&FATS", label: t("mainPage.wasteTypes.oilFats") },
        { value: "ORGANIC", label: t("mainPage.wasteTypes.organic") },
    ];

    const methodOptions = [
        { value: "", label: t("wasteHelper.selectMethod") },
        { value: "grams", label: t("wasteHelper.methods.grams") },
        { value: "unit", label: t("wasteHelper.methods.unit") },
    ];

    const unitOptions = wasteType && UNIT_CONVERSIONS[wasteType]
        ? [
            { value: "", label: t("wasteHelper.chooseItem") },
            ...UNIT_CONVERSIONS[wasteType].map(item => ({
                value: item.labelKey,
                label: `${t(`wasteHelper.items.${item.labelKey}`)} (${item.grams}g)`
            }))
        ]
        : [];

    // Determine disabled states
    const isMethodDisabled = !wasteType;
    const isGramsInputDisabled = !wasteType || method !== "grams";
    const isUnitTypeDisabled = !wasteType || method !== "unit";
    const isUnitCountDisabled = !wasteType || method !== "unit" || !unitOption;
    const isAddDisabled = isLoading || !wasteType || !method || !quantity || (method === "unit" && !unitOption);

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6 items-end">
            {/* Waste Type */}
            <div className="w-full">
                <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                >
                    {t("wasteHelper.wasteType")}
                </label>
                <CustomDropdown
                    value={wasteType}
                    onChange={(e) => {
                        setWasteType(e.target.value);
                        setMethod("");
                        setUnitOption("");
                        setQuantity("");
                    }}
                    options={wasteTypeOptions}
                    placeholder={t("wasteHelper.selectType")}
                />
            </div>

            {/* Method Selector */}
            <div className="w-full">
                <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                >
                    {t("wasteHelper.measurementMethod")}
                </label>
                <CustomDropdown
                    value={method}
                    onChange={(e) => {
                        setMethod(e.target.value);
                        setQuantity("");
                        setUnitOption("");
                    }}
                    options={methodOptions}
                    placeholder={t("wasteHelper.selectMethod")}
                    disabled={isMethodDisabled}
                />
            </div>

            {/* Item Type */}
            <div className="w-full">
                <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                >
                    {t("wasteHelper.itemType")}
                </label>
                <CustomDropdown
                    value={unitOption}
                    onChange={(e) => setUnitOption(e.target.value)}
                    options={unitOptions}
                    placeholder={t("wasteHelper.chooseItem")}
                    disabled={isUnitTypeDisabled}
                />
            </div>

            {/* Item Count */}
            <div className="w-full">
                <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                >
                    {t("wasteHelper.itemCount")}
                </label>
                <input
                    type="number"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 text-sm ${isUnitCountDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text,
                        '--tw-ring-color': currentTheme.secondary
                    }}
                    value={method === "unit" ? quantity : ""}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 2"
                    min="1"
                    disabled={isUnitCountDisabled}
                />
            </div>

            {/* Grams Input */}
            <div className="w-full">
                <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.text }}
                >
                    {t("wasteHelper.quantityGrams")}
                </label>
                <input
                    type="number"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 text-sm ${isGramsInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        color: currentTheme.text,
                        '--tw-ring-color': currentTheme.secondary
                    }}
                    value={method === "grams" ? quantity : (calculatedGrams || "")}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 500"
                    min="1"
                    disabled={isGramsInputDisabled}
                    readOnly={method === "unit"}
                />
            </div>

            {/* Add Button */}
            <div className="w-full">
                <button
                    className="w-full py-2 rounded-md font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: currentTheme.secondary,
                        color: currentTheme.background
                    }}
                    onClick={handleAdd}
                    disabled={isAddDisabled}
                >
                    {isLoading ? t("common.adding") : t("wasteHelper.add")}
                </button>
            </div>
        </div>
    );
}

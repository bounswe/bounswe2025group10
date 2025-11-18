import React, { useState } from "react";

const UNIT_CONVERSIONS = {
  PLASTIC: [
    { label: "Plastic Bottle (1 pc)", grams: 25 },
    { label: "Plastic Bag (1 pc)", grams: 5 },
    { label: "Plastic Cup (1 pc)", grams: 3 },
  ],
  PAPER: [
    { label: "Paper Sheet (A4, 1 pc)", grams: 5 },
    { label: "Notebook (1 pc)", grams: 80 },
  ],
  GLASS: [
    { label: "Glass Bottle (1 pc)", grams: 200 },
    { label: "Glass Jar (1 pc)", grams: 150 },
  ],
  METAL: [
    { label: "Aluminum Can (1 pc)", grams: 15 },
    { label: "Metal Spoon (1 pc)", grams: 30 },
  ],
  ELECTRONIC: [
    { label: "Phone Charger (1 pc)", grams: 100 },
    { label: "USB Cable (1 pc)", grams: 30 },
  ],
  "OIL&FATS": [
    { label: "Used Cooking Oil (1 tablespoon)", grams: 14 },
    { label: "Butter Wrapper (1 pc)", grams: 1 },
  ],
  ORGANIC: [
    { label: "Banana Peel (1 pc)", grams: 25 },
    { label: "Apple Core (1 pc)", grams: 20 },
    { label: "Food Scraps (1 handful)", grams: 50 },
  ],
};

export default function WasteHelperInput({ onSubmit }) {
  const [wasteType, setWasteType] = useState("");
  const [method, setMethod] = useState(""); // "grams" or "unit"
  const [quantity, setQuantity] = useState(""); // raw quantity input
  const [unitOption, setUnitOption] = useState(""); // selected unit

  const handleAdd = () => {
    if (!wasteType || !method) return;

    let gramsToSend = 0;

    if (method === "grams") {
      gramsToSend = parseInt(quantity);
    } else if (method === "unit") {
      if (!unitOption || !quantity) return;
      const conv = UNIT_CONVERSIONS[wasteType].find(
        (u) => u.label === unitOption
      );
      gramsToSend = conv.grains ?? conv.grams * quantity;
    }

    if (gramsToSend <= 0) return;

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

  return (
    <div className="card p-3">
      <h4>Add Waste</h4>

      {/* Waste Type */}
      <label>Waste Type</label>
      <select
        className="form-select mb-2"
        value={wasteType}
        onChange={(e) => setWasteType(e.target.value)}
      >
        <option value="">Select type</option>
        <option value="PLASTIC">Plastic</option>
        <option value="PAPER">Paper</option>
        <option value="GLASS">Glass</option>
        <option value="METAL">Metal</option>
        <option value="ELECTRONIC">Electronic</option>
        <option value="OIL&FATS">Oil & Fats</option>
        <option value="ORGANIC">Organic</option>
      </select>

      {/* Method selector */}
      {wasteType && (
        <>
          <label>Measurement Method</label>
          <select
            className="form-select mb-2"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">Select method</option>
            <option value="grams">Enter Grams</option>
            <option value="unit">Select by Item</option>
          </select>
        </>
      )}

      {/* GRAMS INPUT */}
      {method === "grams" && (
        <>
          <label>Quantity (grams)</label>
          <input
            className="form-control mb-2"
            type="number"
            placeholder="e.g., 500"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </>
      )}

      {/* UNIT INPUT (dropdown + qty) */}
      {method === "unit" && wasteType && (
        <>
          <label>Item Type</label>
          <select
            className="form-select mb-2"
            value={unitOption}
            onChange={(e) => setUnitOption(e.target.value)}
          >
            <option value="">Choose Item</option>
            {UNIT_CONVERSIONS[wasteType].map((item) => (
              <option key={item.label} value={item.label}>
                {item.label} ({item.grams}g)
              </option>
            ))}
          </select>

          <label>How many?</label>
          <input
            className="form-control mb-2"
            type="number"
            placeholder="e.g., 2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </>
      )}

      <button className="btn btn-success mt-2" onClick={handleAdd}>
        Add
      </button>
    </div>
  );
}

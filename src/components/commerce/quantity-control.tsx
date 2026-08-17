"use client";

import { Minus, Plus } from "lucide-react";

type QuantityControlProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
};

export function QuantityControl({ value, min = 1, max, onChange, label }: QuantityControlProps) {
  return (
    <div className="quantity-control" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={16} aria-hidden="true" />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

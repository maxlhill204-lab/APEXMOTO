export type SizeChartRow = {
  size: string;
  minCm: number;
  maxCm: number;
};

export type SizeChart = {
  productId: string;
  manufacturer: string;
  verified: boolean;
  rows: SizeChartRow[];
};

const orzRallyRows: SizeChartRow[] = [
  { size: "S", minCm: 53, maxCm: 54 },
  { size: "M", minCm: 55, maxCm: 56 },
  { size: "L", minCm: 57, maxCm: 58 },
  { size: "XL", minCm: 59, maxCm: 60 },
  { size: "XXL", minCm: 61, maxCm: 62 },
];

// Measurements are transcribed from the ORZ product sheet supplied by the owner.
export const sizeCharts: SizeChart[] = [
  {
    productId: "helmet-matte-black",
    manufacturer: "ORZ Rally Helmet",
    verified: true,
    rows: orzRallyRows,
  },
];

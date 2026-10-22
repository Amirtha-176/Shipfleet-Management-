export interface ICycloneStorm {
  id: string;
  name: string;
  classification: 'Super Typhoon' | 'Severe Tropical Cyclone' | 'Extratropical Gale' | 'Tropical Storm' | 'Hurricane';
  category: number; // 1-5 or 0 for gale
  center: [number, number]; // [lat, lng]
  headingDeg: number;
  speedKnots: number;
  maxWindKnots: number;
  centralPressureHpa: number;
  galeRadiusNm: number;
  forecastTrack: [number, number][];
  advisory: string;
  status: 'Critical Alert' | 'Active Warning' | 'Developing Watch';
}

export interface IWaveZone {
  id: string;
  name: string;
  polygon: [number, number][];
  center: [number, number];
  waveHeightMeters: number;
  wavePeriodSec: number;
  swellDirectionDeg: number;
  seaStateText: 'Calm' | 'Slight' | 'Moderate' | 'Rough' | 'Very Rough' | 'High' | 'Phenomenal';
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface IWindVector {
  id: string;
  position: [number, number];
  directionDeg: number;
  speedKnots: number;
  beaufortScale: number;
  gustKnots: number;
  name: string;
}

export const ACTIVE_STORMS: ICycloneStorm[] = [
  {
    id: 'storm-malakas',
    name: 'Super Typhoon MALAKAS',
    classification: 'Super Typhoon',
    category: 4,
    center: [17.8, 131.5],
    headingDeg: 315,
    speedKnots: 14,
    maxWindKnots: 130,
    centralPressureHpa: 932,
    galeRadiusNm: 250,
    forecastTrack: [
      [17.8, 131.5],
      [19.4, 129.8],
      [21.2, 128.2],
      [23.5, 127.1],
      [26.2, 127.8]
    ],
    advisory: 'Catastrophic seas exceeding 9.5m. Extreme wind gusts over 150 kts. All vessels in Philippine Sea & Luzon Strait maintain 300 NM avoidance margin.',
    status: 'Critical Alert'
  },
  {
    id: 'storm-einar',
    name: 'North Atlantic Cyclone EINAR',
    classification: 'Extratropical Gale',
    category: 3,
    center: [52.4, -29.2],
    headingDeg: 70,
    speedKnots: 22,
    maxWindKnots: 80,
    centralPressureHpa: 954,
    galeRadiusNm: 320,
    forecastTrack: [
      [52.4, -29.2],
      [54.1, -24.8],
      [56.3, -19.5],
      [58.0, -12.4]
    ],
    advisory: 'Violent North Atlantic storm depression with mountain wave heights (8-10m). Container vessels on Great Circle Route reroute south of 45°N.',
    status: 'Critical Alert'
  },
  {
    id: 'storm-gamane',
    name: 'Tropical Cyclone GAMANE',
    classification: 'Severe Tropical Cyclone',
    category: 3,
    center: [-13.9, 51.8],
    headingDeg: 215,
    speedKnots: 9,
    maxWindKnots: 95,
    centralPressureHpa: 962,
    galeRadiusNm: 190,
    forecastTrack: [
      [-13.9, 51.8],
      [-15.2, 50.4],
      [-16.8, 49.2],
      [-18.5, 48.6]
    ],
    advisory: 'Hazardous swell along northern Madagascar & Mozambique Channel entrance. Bunker and feeder routes on standby.',
    status: 'Active Warning'
  },
  {
    id: 'storm-boreas',
    name: 'Norwegian Sea Gale BOREAS',
    classification: 'Extratropical Gale',
    category: 1,
    center: [65.8, 5.5],
    headingDeg: 45,
    speedKnots: 18,
    maxWindKnots: 55,
    centralPressureHpa: 976,
    galeRadiusNm: 150,
    forecastTrack: [
      [65.8, 5.5],
      [67.4, 9.2],
      [69.1, 14.0]
    ],
    advisory: 'Gale Force 9 with severe freezing sea spray. Tankers and bulk carriers navigating Lofoten corridor exercise extreme caution.',
    status: 'Active Warning'
  },
  {
    id: 'storm-florence',
    name: 'Tropical Storm TALIA',
    classification: 'Tropical Storm',
    category: 1,
    center: [14.2, -107.5],
    headingDeg: 285,
    speedKnots: 12,
    maxWindKnots: 50,
    centralPressureHpa: 994,
    galeRadiusNm: 120,
    forecastTrack: [
      [14.2, -107.5],
      [15.1, -110.2],
      [16.0, -113.1]
    ],
    advisory: 'Tropical depression organizing off western Mexico. Sea swells 3.5m–4.5m affecting trans-Pacific westbound lanes.',
    status: 'Developing Watch'
  }
];

export const WAVE_HEIGHT_ZONES: IWaveZone[] = [
  {
    id: 'wave-natl-high',
    name: 'North Atlantic Storm Zone',
    polygon: [
      [47, -45],
      [58, -40],
      [60, -15],
      [50, -18],
      [46, -32]
    ],
    center: [53, -28],
    waveHeightMeters: 8.4,
    wavePeriodSec: 11.2,
    swellDirectionDeg: 250,
    seaStateText: 'Phenomenal',
    riskLevel: 'extreme'
  },
  {
    id: 'wave-npac-rough',
    name: 'North Pacific Roaring Belt',
    polygon: [
      [42, 155],
      [52, 160],
      [53, -165],
      [43, -160]
    ],
    center: [48, 178],
    waveHeightMeters: 6.2,
    wavePeriodSec: 9.8,
    swellDirectionDeg: 280,
    seaStateText: 'High',
    riskLevel: 'high'
  },
  {
    id: 'wave-wpac-typhoon',
    name: 'Philippine Sea Typhoon Swell',
    polygon: [
      [13, 126],
      [22, 127],
      [22, 137],
      [13, 136]
    ],
    center: [17.5, 131],
    waveHeightMeters: 7.9,
    wavePeriodSec: 12.5,
    swellDirectionDeg: 140,
    seaStateText: 'Phenomenal',
    riskLevel: 'extreme'
  },
  {
    id: 'wave-roaring-forties',
    name: 'Southern Ocean Westerlies Swell',
    polygon: [
      [-42, 20],
      [-52, 25],
      [-51, 80],
      [-41, 75]
    ],
    center: [-46, 50],
    waveHeightMeters: 6.8,
    wavePeriodSec: 13.0,
    swellDirectionDeg: 260,
    seaStateText: 'Very Rough',
    riskLevel: 'high'
  },
  {
    id: 'wave-med-moderate',
    name: 'Central Mediterranean Basin',
    polygon: [
      [34, 11],
      [38, 12],
      [37, 20],
      [33, 19]
    ],
    center: [35.5, 15.5],
    waveHeightMeters: 1.8,
    wavePeriodSec: 6.2,
    swellDirectionDeg: 310,
    seaStateText: 'Moderate',
    riskLevel: 'moderate'
  },
  {
    id: 'wave-arabian-sea',
    name: 'Arabian Sea Shipping Corridor',
    polygon: [
      [12, 54],
      [21, 57],
      [19, 68],
      [11, 65]
    ],
    center: [15.5, 61],
    waveHeightMeters: 2.3,
    wavePeriodSec: 7.1,
    swellDirectionDeg: 215,
    seaStateText: 'Moderate',
    riskLevel: 'moderate'
  },
  {
    id: 'wave-south-china',
    name: 'South China Sea Main Line',
    polygon: [
      [7, 107],
      [17, 111],
      [16, 118],
      [6, 114]
    ],
    center: [12, 112.5],
    waveHeightMeters: 2.8,
    wavePeriodSec: 7.6,
    swellDirectionDeg: 45,
    seaStateText: 'Moderate',
    riskLevel: 'moderate'
  },
  {
    id: 'wave-caribbean',
    name: 'Caribbean Sea Passages',
    polygon: [
      [11, -80],
      [18, -78],
      [17, -65],
      [10, -68]
    ],
    center: [14.5, -73],
    waveHeightMeters: 1.6,
    wavePeriodSec: 6.0,
    swellDirectionDeg: 85,
    seaStateText: 'Slight',
    riskLevel: 'low'
  }
];

export const GLOBAL_WIND_VECTORS: IWindVector[] = [
  { id: 'w1', position: [52, -30], directionDeg: 245, speedKnots: 46, beaufortScale: 9, gustKnots: 58, name: 'North Atlantic Gale Stream' },
  { id: 'w2', position: [48, -15], directionDeg: 260, speedKnots: 34, beaufortScale: 7, gustKnots: 42, name: 'Bay of Biscay Approach' },
  { id: 'w3', position: [28, -40], directionDeg: 75, speedKnots: 20, beaufortScale: 5, gustKnots: 25, name: 'Northeast Trade Winds' },
  { id: 'w4', position: [5, -30], directionDeg: 120, speedKnots: 11, beaufortScale: 3, gustKnots: 14, name: 'Equatorial Doldrums' },
  { id: 'w5', position: [-25, -20], directionDeg: 140, speedKnots: 22, beaufortScale: 6, gustKnots: 28, name: 'Southeast Atlantic Trades' },
  { id: 'w6', position: [-46, 30], directionDeg: 275, speedKnots: 48, beaufortScale: 9, gustKnots: 62, name: 'Roaring Forties Jet' },
  { id: 'w7', position: [18, 132], directionDeg: 320, speedKnots: 75, beaufortScale: 11, gustKnots: 110, name: 'Typhoon Outer Gale Band' },
  { id: 'w8', position: [34, 142], directionDeg: 210, speedKnots: 24, beaufortScale: 6, gustKnots: 30, name: 'Kuroshio Coastal Winds' },
  { id: 'w9', position: [45, 170], directionDeg: 280, speedKnots: 38, beaufortScale: 8, gustKnots: 48, name: 'North Pacific Great Circle' },
  { id: 'w10', position: [22, -155], directionDeg: 70, speedKnots: 18, beaufortScale: 5, gustKnots: 22, name: 'Hawaiian Trade Winds' },
  { id: 'w11', position: [14, 60], directionDeg: 225, speedKnots: 21, beaufortScale: 5, gustKnots: 26, name: 'Arabian Sea Monsoon Flow' },
  { id: 'w12', position: [10, 112], directionDeg: 55, speedKnots: 23, beaufortScale: 6, gustKnots: 29, name: 'South China Sea Monsoon' },
  { id: 'w13', position: [36, 16], directionDeg: 310, speedKnots: 16, beaufortScale: 4, gustKnots: 21, name: 'Mediterranean Mistral Swell' },
  { id: 'w14', position: [66, 6], directionDeg: 45, speedKnots: 35, beaufortScale: 8, gustKnots: 45, name: 'Norwegian Sea Arctic Front' },
  { id: 'w15', position: [-14, 53], directionDeg: 200, speedKnots: 52, beaufortScale: 10, gustKnots: 68, name: 'Cyclone Gamane Core' },
  { id: 'w16', position: [14, -108], directionDeg: 290, speedKnots: 32, beaufortScale: 7, gustKnots: 40, name: 'East Pacific Tropical Stream' }
];

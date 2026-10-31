import { NetworkThresholds, ThresholdConfig, TowerDefinition } from '../domain/types';

function stripWrappingQuotes(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

export const ENV_CONFIG = {
  DEMO_ORG_ID: stripWrappingQuotes(import.meta.env.VITE_DEMO_ORG_ID) || 'ORG-001',
  SIM_INTERVAL_MS: Number(import.meta.env.VITE_SIM_INTERVAL_MS) || 5000,
  GEMINI_API_KEY: stripWrappingQuotes(import.meta.env.VITE_GEMINI_API_KEY),
  GEMINI_MODEL: stripWrappingQuotes(import.meta.env.VITE_GEMINI_MODEL) || 'gemini-3.2-flash-lite',
  FIREBASE_API_KEY: stripWrappingQuotes(import.meta.env.VITE_FIREBASE_API_KEY),
  FIREBASE_AUTH_DOMAIN: stripWrappingQuotes(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  FIREBASE_PROJECT_ID: stripWrappingQuotes(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  FIREBASE_STORAGE_BUCKET: stripWrappingQuotes(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  FIREBASE_MESSAGING_SENDER_ID: stripWrappingQuotes(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  FIREBASE_APP_ID: stripWrappingQuotes(import.meta.env.VITE_FIREBASE_APP_ID),
  APPCHECK_SITE_KEY: stripWrappingQuotes(import.meta.env.VITE_APPCHECK_SITE_KEY),
};

const BASE_THRESHOLDS: NetworkThresholds = {
  latency_ms: {
    warn: 100,
    crit: 250,
    unit: 'ms',
    direction: 'higher_is_worse',
  },
  packet_loss_percent: {
    warn: 2,
    crit: 10,
    unit: '%',
    direction: 'higher_is_worse',
  },
  jitter_ms: {
    warn: 30,
    crit: 50,
    unit: 'ms',
    direction: 'higher_is_worse',
  },
  signal_strength_dbm: {
    warn: -100,
    crit: -110,
    unit: 'dBm',
    direction: 'lower_is_worse',
  },
  availability_percent: {
    warn: 98,
    crit: 95,
    unit: '%',
    direction: 'lower_is_worse',
    strictInequality: true, // < 98 is warning, < 95 is critical per Schema.md §5 & Testing.md T-04
  },
};

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  '4G': { ...BASE_THRESHOLDS },
  '5G': { ...BASE_THRESHOLDS },
};

// 20 Simulated Towers: DHK-101 .. DHK-120 (14 x 4G, 6 x 5G)
// DHK-104 is the primary demo incident tower; DHK-101 is the comparison tower.
export const TOWER_REGISTRY: TowerDefinition[] = [
  { tower_id: 'DHK-101', name: 'Gulshan Circle-1', region: 'Dhaka North', network_type: '4G', latitude: 23.7806, longitude: 90.4168, base_users: 1180, base_traffic_mbps: 780 },
  { tower_id: 'DHK-102', name: 'Banani Hub', region: 'Dhaka North', network_type: '5G', latitude: 23.7940, longitude: 90.4043, base_users: 1450, base_traffic_mbps: 1220 },
  { tower_id: 'DHK-103', name: 'Mohakhali Flyover', region: 'Dhaka North', network_type: '4G', latitude: 23.7778, longitude: 90.3977, base_users: 980, base_traffic_mbps: 640 },
  { tower_id: 'DHK-104', name: 'Tejgaon Industrial', region: 'Dhaka Central', network_type: '4G', latitude: 23.7639, longitude: 90.3995, base_users: 1245, base_traffic_mbps: 845 },
  { tower_id: 'DHK-105', name: 'Motijheel Commercial', region: 'Dhaka South', network_type: '5G', latitude: 23.7330, longitude: 90.4172, base_users: 1620, base_traffic_mbps: 1380 },
  { tower_id: 'DHK-106', name: 'Dhanmondi 27', region: 'Dhaka South', network_type: '4G', latitude: 23.7516, longitude: 90.3704, base_users: 1120, base_traffic_mbps: 720 },
  { tower_id: 'DHK-107', name: 'Uttara Sector-7', region: 'Dhaka North', network_type: '5G', latitude: 23.8728, longitude: 90.3984, base_users: 1390, base_traffic_mbps: 1150 },
  { tower_id: 'DHK-108', name: 'Mirpur-10 Circle', region: 'Dhaka West', network_type: '4G', latitude: 23.8069, longitude: 90.3687, base_users: 1310, base_traffic_mbps: 890 },
  { tower_id: 'DHK-109', name: 'Farmgate Square', region: 'Dhaka Central', network_type: '4G', latitude: 23.7561, longitude: 90.3872, base_users: 1290, base_traffic_mbps: 860 },
  { tower_id: 'DHK-110', name: 'Bashundhara Gate', region: 'Dhaka North', network_type: '5G', latitude: 23.8151, longitude: 90.4255, base_users: 1510, base_traffic_mbps: 1290 },
  { tower_id: 'DHK-111', name: 'Shahbagh Node', region: 'Dhaka South', network_type: '4G', latitude: 23.7389, longitude: 90.3958, base_users: 1050, base_traffic_mbps: 690 },
  { tower_id: 'DHK-112', name: 'Badda Link Road', region: 'Dhaka East', network_type: '4G', latitude: 23.7804, longitude: 90.4262, base_users: 940, base_traffic_mbps: 610 },
  { tower_id: 'DHK-113', name: 'Rampura TV Center', region: 'Dhaka East', network_type: '4G', latitude: 23.7612, longitude: 90.4219, base_users: 890, base_traffic_mbps: 580 },
  { tower_id: 'DHK-114', name: 'Mohammadpur Town', region: 'Dhaka West', network_type: '4G', latitude: 23.7658, longitude: 90.3584, base_users: 1010, base_traffic_mbps: 670 },
  { tower_id: 'DHK-115', name: 'Agargaon ICT Tower', region: 'Dhaka West', network_type: '5G', latitude: 23.7776, longitude: 90.3765, base_users: 1340, base_traffic_mbps: 1110 },
  { tower_id: 'DHK-116', name: 'Khilgaon Flyover', region: 'Dhaka East', network_type: '4G', latitude: 23.7505, longitude: 90.4267, base_users: 920, base_traffic_mbps: 605 },
  { tower_id: 'DHK-117', name: 'Jatrabari Crossing', region: 'Dhaka South', network_type: '4G', latitude: 23.7104, longitude: 90.4351, base_users: 1160, base_traffic_mbps: 760 },
  { tower_id: 'DHK-118', name: 'Paltan Core', region: 'Dhaka South', network_type: '5G', latitude: 23.7302, longitude: 90.4116, base_users: 1480, base_traffic_mbps: 1250 },
  { tower_id: 'DHK-119', name: 'Kallyanpur Bus Hub', region: 'Dhaka West', network_type: '4G', latitude: 23.7793, longitude: 90.3596, base_users: 870, base_traffic_mbps: 560 },
  { tower_id: 'DHK-120', name: 'Kuril Biswa Road', region: 'Dhaka North', network_type: '4G', latitude: 23.8219, longitude: 90.4198, base_users: 1090, base_traffic_mbps: 710 },
];

export const RING_BUFFER_SIZE = 60; // Keep last 60 samples per tower in memory
export const BASELINE_WINDOW = 12; // Mean of previous 12 samples
export const CONSECUTIVE_CRITICAL_REQUIRED = 2; // 2 consecutive critical samples trigger an incident
export const INCIDENT_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown after Resolved
export const INCIDENT_AUTO_END_MS = 90 * 1000; // 90 seconds auto-end for triggered demo degradation

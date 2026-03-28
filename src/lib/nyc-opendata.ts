// NYC Open Data (Socrata) FloodNet integration
// Datasets: https://data.cityofnewyork.us/browse?Data-Collection_Data-Collection=FloodNet+NYC

const SOCRATA_BASE = 'https://data.cityofnewyork.us/resource';

export const DATASETS = {
  floodEvents: 'aq7i-eu5q',
  sensorMetadata: 'kb2e-tjy3',
} as const;

export interface SocrataFloodEvent {
  sensor_name: string;
  sensor_id: string;
  flood_start_time: string;
  flood_end_time: string;
  max_depth_inches: string; // Socrata returns numbers as strings
  onset_time_mins: string;
  drain_time_mins: string;
  duration_mins: string;
  duration_above_4_inches_mins: string;
  duration_above_12_inches_mins: string;
  duration_above_24_inches_mins: string;
  flood_profile_depth_inches: string; // JSON array as string
  flood_profile_time_secs: string; // JSON array as string
}

export interface SocrataSensorMetadata {
  sensor_name: string;
  sensor_id: string;
  date_installed: string;
  tidally_influenced: string;
  street_name: string;
  borough: string;
  zipcode: string;
  community_board: string;
  council_district: string;
  census_tract: string;
  nta: string;
  latitude: string;
  longitude: string;
  lowest_point_height_delta_inches: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export async function fetchSocrata<T>(
  dataset: string,
  params?: Record<string, string>
): Promise<T[]> {
  const url = new URL(`${SOCRATA_BASE}/${dataset}.json`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Socrata API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

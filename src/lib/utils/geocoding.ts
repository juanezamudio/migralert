// Reverse geocoding to get city and region from coordinates
// Uses Mapbox Geocoding API

export interface GeocodingResult {
  city: string;
  region: string;
  country: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Mapbox access token not configured");
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place,region,country&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch location data");
  }

  const data = await response.json();

  let city = "Unknown";
  let region = "Unknown";
  let country = "Unknown";

  // Parse the response to extract city, region, and country
  for (const feature of data.features || []) {
    if (feature.place_type?.includes("place")) {
      city = feature.text || city;
    }
    if (feature.place_type?.includes("region")) {
      region = feature.text || region;
    }
    if (feature.place_type?.includes("country")) {
      country = feature.text || country;
    }
  }

  // If we didn't find a city, try to get it from the context
  if (city === "Unknown" && data.features?.[0]?.context) {
    for (const ctx of data.features[0].context) {
      if (ctx.id?.startsWith("place.")) {
        city = ctx.text;
      }
      if (ctx.id?.startsWith("region.")) {
        region = ctx.text;
      }
      if (ctx.id?.startsWith("country.")) {
        country = ctx.text;
      }
    }
  }

  return { city, region, country };
}

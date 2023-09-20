import * as maptilerClient from "@maptiler/client";
import HttpError from "../models/http-errors.js";

maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

export async function getCoordsForAddress(address) {
  const result = await maptilerClient.geocoding.forward(address);
  // console.log(result);
  if (result.features.length === 0) {
    throw new HttpError("Could not find location for specified address", 422);
  } else {
    const lng = result.features[0].geometry.coordinates[0];
    const lat = result.features[0].geometry.coordinates[1];
    // console.log(result.features[0].geometry);
    return {
      lat,
      lng,
    };
  }
}

import mongoose from "mongoose";

const placeShema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: "User" },
});

export const Place = mongoose.model("Place", placeShema);

import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const userShema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minLength: 5 },
  image: {
    type: String,
    deafult: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  },
  places: [{ type: mongoose.SchemaTypes.ObjectId, required: true, ref: "Place" }]
});

userShema.plugin(uniqueValidator);

export const User = mongoose.model("User", userShema);

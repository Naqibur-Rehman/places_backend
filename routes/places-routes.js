import express from "express";
import { check } from "express-validator";

import { fileUpload } from "../middleware/file-upload.js";
import {
  createPlace,
  deletePlace,
  getAllPlaces,
  getPlaceById,
  getPlacesByUserId,
  updatePlace,
} from "../controllers/places-controller.js";
import { checkAuth } from "../middleware/check-auth.js";

const router = express.Router();

// router.get('/', getAllPlaces)

router.get("/user/:uid", getPlacesByUserId);

router.get("/:pid", getPlaceById);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").notEmpty(),
    check("description").isLength({ min: 8 }),
    check("address").notEmpty(),
  ],
  createPlace
);

router.patch(
  "/:pid",
  [check("title").notEmpty(), check("description").isLength({ min: 8 })],
  updatePlace
);

router.delete("/:pid", deletePlace);

export default router;

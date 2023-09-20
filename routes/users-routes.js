import express from "express";
import { check } from "express-validator";

import { getUsers, login, signup } from "../controllers/users-controller.js";
import { fileUpload } from "../middleware/file-upload.js";

const router = express.Router();

router.get("/", getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").notEmpty(),
    check("email")
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check("password").isLength({ min: 6 })
  ],
  signup
);

router.post("/login", login);

export default router;

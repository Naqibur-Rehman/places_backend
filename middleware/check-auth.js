import jwt from "jsonwebtoken";

import HttpError from "../models/http-errors.js";

export const checkAuth = (req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
  // Authorization: "Bearer TOKEN"
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return next(new HttpError("Authentication failed!", 403));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 403));
  }
};

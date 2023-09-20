import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import HttpError from "../models/http-errors.js";
import { User } from "../models/user.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, "-password");
    if (!users) {
      return next(new HttpError("No users found", 404));
    }

    res.json({ users: users.map((user) => user.toObject({ getters: true })) });
  } catch (error) {
    return next(new HttpError("fetching users failed", 500));
  }
};

export const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid email or password", 422));
  }
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return next(
        new HttpError("User exists already, please login instead", 422)
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const createdUser = new User({
      name,
      email,
      image: req.file.path,
      password: hashedPassword,
      places: [],
    });

    await createdUser.save();

    const token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res
      .status(201)
      .json({ user: createdUser.id, email: createdUser.email, token: token });
  } catch (error) {
    return next(new HttpError("Signing up failed", 500));
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return next(new HttpError("Invalid eamail", 401));
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isValidPassword) {
      return next(new HttpError("Invalid Password", 401));
    }

    const token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
    });
  } catch (error) {
    return next(new HttpError("Login failed", 500));
  }
};

import mongoose from "mongoose";
import { validationResult } from "express-validator";
import fs from "fs";

import HttpError from "../models/http-errors.js";
import { getCoordsForAddress } from "../utils/location.js";
import { Place } from "../models/place.js";
import { User } from "../models/user.js";

export const getAllPlaces = async (req, res, next) => {
  try {
    const places = await Place.find();
    if (!places) {
      return next(new HttpError("No places found", 404));
    }

    res.status(200).json({
      places: places.map((place) => place.toObject({ getters: true })),
    });
  } catch (err) {
    return next(new HttpError("Could not retrieve places", 500));
  }
};

export const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Could not find a place", 500);
    return next(error);
  }

  if (!place) {
    return next(new Error("Coud not find the place for given place id", 404));
  }

  res.json({ place: place.toObject({ getters: true }) });
};

export const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    return next(
      new HttpError("Fetching places failed, please try again later.", 500)
    );
  }
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError("Could not find places for given user id", 404));
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

export const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates = {
    lat: 40.784474,
    lng: -73.9871516,
  };

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId
  });

  try {
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return next(new HttpError("Could not find user for provided id", 404));
    }

    // first create the place then push the id of created place to user places property
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });
    user.places.push(createdPlace);
    await user.save({ session: session });
    await session.commitTransaction();

    res.status(201).json({ place: createdPlace });
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }
};

export const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;
  const updatedPlace = { title, description };

  let place;
  try {
    // place.title = title;
    // place.description = description;
    // await place.save()
    // OR
    place = await Place.findById(placeId);
    if (place.creator.toString() !== req.userData.userId) {
      return next(
        new HttpError("You are not allowed to edit this place.", 401)
      );
    }

    place = await Place.findByIdAndUpdate(placeId, updatedPlace);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update place", 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

export const deletePlace = async (req, res, next) => {
  try {
    const placeId = req.params.pid;
    // we can access the data of diiferent collection by using populate method if we have reference b/w collections
    const place = await Place.findById(placeId).populate("creator");
    if (!place) {
      return next(new HttpError("Could not find place for that id", 404));
    }

    if (place.creator.id !== req.userData.userId) {
      return next(
        new HttpError("You are not allowed to delete this place.", 401)
      );
    }

    const imagePath = place.image;

    // by populating we can access users collection because it's(user's) reference is stored in places  creator property
    const session = await mongoose.startSession();
    session.startTransaction();
    await Place.deleteOne({ _id: placeId }, { session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    session.commitTransaction();

    fs.unlink(imagePath, (err) => {
      console.log(err);
    });
    res.status(200).json({ message: "deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

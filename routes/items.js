import { Router } from "express";
import { randomUUID } from "crypto";
import mockItems from "../data/mockItems.js";

const router = Router();

let items = [...mockItems];

router.get("/", (req, res) => {
  const { type, location, campus, status = "active" } = req.query;

  let filtered = items;

  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }

  if (type) {
    filtered = filtered.filter((item) => item.type === type);
  }

  if (location) {
    filtered = filtered.filter(
      (item) => item.location.toLowerCase() === location.toLowerCase()
    );
  }

  if (campus) {
    filtered = filtered.filter(
      (item) => item.campus.toLowerCase() === campus.toLowerCase()
    );
  }

  return res.status(200).json({
    success: true,
    count: filtered.length,
    items: filtered,
  });
});

router.post("/", (req, res) => {
  const {
    title,
    description,
    type,
    category,
    location,
    campus,
    reportedBy,
    contactEmail,
    imageUrl = null,
  } = req.body;

  if (
    !title ||
    !description ||
    !type ||
    !category ||
    !location ||
    !campus ||
    !reportedBy ||
    !contactEmail
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Required fields: title, description, type, category, location, campus, reportedBy, contactEmail.",
    });
  }

  if (!["lost", "found"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Type must be either 'lost' or 'found'.",
    });
  }

  const now = new Date().toISOString();

  const newItem = {
    id: `item-${randomUUID().slice(0, 8)}`,
    title: title.trim(),
    description: description.trim(),
    type,
    category: category.trim(),
    location: location.trim(),
    campus: campus.trim(),
    status: "active",
    reportedBy: reportedBy.trim(),
    contactEmail: contactEmail.trim(),
    imageUrl,
    createdAt: now,
    updatedAt: now,
  };

  items.unshift(newItem);

  return res.status(201).json({
    success: true,
    message: "Item reported successfully.",
    item: newItem,
  });
});

export default router;

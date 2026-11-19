import { ObjectId } from "mongodb";
export async function addEquipment(req, res) {
  try {
    const {
      name,
      description,
      category,
      pricePerDay,
      location,
      condition,
      images,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      pricePerDay === undefined ||
      typeof location !== "string" ||
      !location.trim() ||
      typeof condition !== "string" ||
      !condition.trim()
    ) {
      return res.status(400).json({
        message: "Please provide all required equipment details.",
      });
    }

    if (!Number.isFinite(Number(pricePerDay)) || Number(pricePerDay) <= 0) {
      return res.status(400).json({
        message: "Price per day must be a positive number.",
      });
    }

    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array.",
      });
    }

    const db = req.app.locals.db;

    const newEquipment = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      pricePerDay: Number(pricePerDay),
      location: location.trim(),
      condition: condition.trim(),
      images: images || [],
      ownerId: req.user.userId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("equipment").insertOne(newEquipment);

    return res.status(201).json({
      message: "Equipment added successfully. Waiting for admin approval.",
      equipmentId: result.insertedId,
    });
  } catch (error) {
    console.error("Add equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function getAllEquipment(req, res) {
  try {
    const db = req.app.locals.db;

    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

   
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage < 1 ||
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1
    ) {
      return res.status(400).json({
        message: "Page and limit must be positive integers.",
      });
    }

   
    if (
      (minPrice !== undefined &&
        (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
      (maxPrice !== undefined &&
        (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0))
    ) {
      return res.status(400).json({
        message: "Invalid price range.",
      });
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        message: "Minimum price cannot exceed maximum price.",
      });
    }

   
    const filter = {
      status: "approved",
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

   
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerDay = {};

      if (minPrice !== undefined) {
        filter.pricePerDay.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.pricePerDay.$lte = Number(maxPrice);
      }
    }


    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") {
      sortOption = { pricePerDay: 1 };
    } else if (sort === "price_desc") {
      sortOption = { pricePerDay: -1 };
    }

  
    const currentPage = parsedPage;
    const itemsPerPage = Math.min(50, parsedLimit);
    const skip = (currentPage - 1) * itemsPerPage;

    const equipmentCollection = db.collection("equipment");

    const totalEquipment = await equipmentCollection.countDocuments(filter);

    const equipment = await equipmentCollection
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(itemsPerPage)
      .toArray();

    return res.status(200).json({
      totalEquipment,
      currentPage,
      totalPages: Math.ceil(totalEquipment / itemsPerPage),
      count: equipment.length,
      equipment,
    });
  } catch (error) {
    console.error("Get equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function getEquipmentById(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    const db = req.app.locals.db;

    const equipment = await db.collection("equipment").findOne({
      _id: new ObjectId(id),
      status: "approved",
    });

    if (!equipment) {
      return res.status(404).json({
        message: "Equipment not found.",
      });
    }

    return res.status(200).json({ equipment });
  } catch (error) {
    console.error("Get equipment details error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function getMyEquipment(req, res) {
  try {
    const db = req.app.locals.db;

    const equipment = await db
      .collection("equipment")
      .find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      count: equipment.length,
      equipment,
    });
  } catch (error) {
    console.error("Get my equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function updateEquipment(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    const {
      name,
      description,
      category,
      pricePerDay,
      location,
      condition,
      images,
    } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Equipment name cannot be empty.",
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          message: "Description cannot be empty.",
        });
      }
      updates.description = description.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          message: "Invalid category.",
        });
      }
      updates.category = category.trim();
    }

    if (location !== undefined) {
      if (typeof location !== "string" || !location.trim()) {
        return res.status(400).json({
          message: "Invalid location.",
        });
      }
      updates.location = location.trim();
    }

    if (condition !== undefined) {
      if (typeof condition !== "string" || !condition.trim()) {
        return res.status(400).json({
          message: "Invalid condition.",
        });
      }
      updates.condition = condition.trim();
    }

    if (pricePerDay !== undefined) {
      if (!Number.isFinite(Number(pricePerDay)) || Number(pricePerDay) <= 0) {
        return res.status(400).json({
          message: "Price per day must be a positive number.",
        });
      }
      updates.pricePerDay = Number(pricePerDay);
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          message: "Images must be an array.",
        });
      }
      updates.images = images;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update.",
      });
    }

  
    updates.status = "pending";
    updates.updatedAt = new Date();

    const db = req.app.locals.db;

    const result = await db.collection("equipment").updateOne(
      {
        _id: new ObjectId(id),
        ownerId: req.user.userId,
      },
      {
        $set: updates,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Equipment not found or you are not its owner.",
      });
    }

    return res.status(200).json({
      message: "Equipment updated. Waiting for admin approval.",
    });
  } catch (error) {
    console.error("Update equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function deleteEquipment(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    const db = req.app.locals.db;

    const result = await db.collection("equipment").deleteOne({
      _id: new ObjectId(id),
      ownerId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Equipment not found or you are not its owner.",
      });
    }

    return res.status(200).json({
      message: "Equipment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

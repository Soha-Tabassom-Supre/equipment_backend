export async function createIndexes(db) {
 
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  await db.collection("equipment").createIndex({ ownerId: 1 });
  await db.collection("equipment").createIndex({ status: 1 });
  await db.collection("equipment").createIndex({ category: 1 });
  await db.collection("equipment").createIndex({ createdAt: -1 });

 
  await db.collection("bookings").createIndex({ customerId: 1 });
  await db.collection("bookings").createIndex({ ownerId: 1 });
  await db.collection("bookings").createIndex({ equipmentId: 1 });
  await db.collection("bookings").createIndex({ status: 1 });

 
  await db
    .collection("favorites")
    .createIndex({ customerId: 1, equipmentId: 1 }, { unique: true });

  
  await db
    .collection("payments")
    .createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true });

  await db.collection("reviews").createIndex({ equipmentId: 1 });
  await db.collection("reviews").createIndex({ customerId: 1 });
   
  await db.collection("users").createIndex(
    { googleId: 1 },
    {
      unique: true,
      sparse: true,
    },
  );
  console.log("MongoDB indexes created successfully!");
}

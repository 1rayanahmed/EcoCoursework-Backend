require("dotenv").config(); // Load environment variables
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configuration
const config = {
  PORT: 5000,
  MONGODB_URI: 'mongodb+srv://rayanasif2004:rayanis13@cluster0.xt2ft.mongodb.net/EcoMart',
};

let db;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db('EcoMart');
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}

// Signup Route
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await db.collection('Users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Create new user
    const newUser = {
      email,
      password, // Store plain text for simplicity
      firstName,
      lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('Users').insertOne(newUser);

    res.status(201).json({ success: true, message: "Account created successfully" });
  } catch (err) {
    console.error("❌ Error in /api/register:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user in the database
    const user = await db.collection('Users').findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Successful login
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Error in /api/login:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Orders Route
app.post('/api/Orders', async (req, res) => {
    try {
        const orderData = req.body;

        // Validate order data
        if (!orderData.items || !orderData.shippingInfo || !orderData.paymentMethod || !orderData.total) {
            return res.status(400).json({ success: false, message: "Incomplete order data" });
        }

        // Insert order into the database
        const result = await db.collection('Orders').insertOne(orderData);

        if (result.insertedId) { // Check if the order was successfully inserted
            res.status(201).json({ success: true, message: "Order created successfully", orderId: result.insertedId });
        } else {
            res.status(500).json({ success: false, message: "Failed to create order" });
        }
    } catch (err) {
        console.error("❌ Error in /api/Orders:", err);
        res.status(500).json({ success: false, message: "Failed to create order", error: err.message });
    }
});

// Start Server
connectToDatabase().then(() => {
  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  });
});


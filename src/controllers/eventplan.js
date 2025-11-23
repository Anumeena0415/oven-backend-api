const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const homeModle = require("../models/homeScreen");
const coustomerEventModel = require("../models/customer");
const serviceModle = require("../models/service");

// ---------- Multer Configuration ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ---------- Nodemailer Configuration ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates (needed for some SMTP servers)
  },
  // Connection pool settings for better reliability
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  rateDelta: 1000,
  rateLimit: 5,
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email configuration error:", error.message);
  } else {
    console.log("✅ Nodemailer email service is ready");
  }
});

const SENDER_EMAIL = process.env.SMTP_USER || "password@oveventz.com";

// ---------- Controller Functions ----------
const eventplan = async (req, res) => {
  try {
    const data = await coustomerEventModel.create(req.body);
    res.status(200).json({ success: true, message: "Event added", data });
  } catch (err) {
    console.error("eventplan error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const showAllEvent = async (req, res) => {
  try {
    const data = await coustomerEventModel.find({});
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateClient = async (req, res) => {
  try {
    const updated = await coustomerEventModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- Email: Booking Approved ----------
const sendEmailApproved = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer ID is required" 
      });
    }

    const customer = await coustomerEventModel.findById(id);
    if (!customer) {
      console.log(`❌ Customer not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Validate customer email
    if (!customer.email) {
      console.error(`❌ Customer found but no email field: ${JSON.stringify(customer)}`);
      return res.status(400).json({ 
        success: false, 
        message: "Customer email not found" 
      });
    }

    const customerName = customer.name || customer.customerName || "Valued Customer";

    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #4f46e5;">Hi ${customerName},</h2>
        <p>Your event booking has been <strong>approved</strong>! 🎉</p>
        <p>We're excited to host your event. Our team will contact you soon with details.</p>
        <p>Thank you,<br><strong>oveventz Team</strong></p>
      </div>
    `;

    const mailOptions = {
      from: SENDER_EMAIL,
      to: customer.email,
      subject: "Your Booking Has Been Approved 🎉",
      html,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`❌ Email error: ${err.message}`);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send email",
          error: err.message 
        });
      }
      console.log(`✅ Approval email sent successfully to: ${customer.email}`, info.response);
      res.status(200).json({ success: true, message: "Approval email sent", data: info });
    });
  } catch (err) {
    console.error("❌ sendEmailApproved error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ 
      success: false, 
      message: "Failed to send email",
      error: err.message 
    });
  }
};

// ---------- Email: Booking Rejected ----------
const sendEmailRejected = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer ID is required" 
      });
    }

    const customer = await coustomerEventModel.findById(id);
    if (!customer) {
      console.log(`❌ Customer not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Validate customer email
    if (!customer.email) {
      console.error(`❌ Customer found but no email field: ${JSON.stringify(customer)}`);
      return res.status(400).json({ 
        success: false, 
        message: "Customer email not found" 
      });
    }

    const customerName = customer.name || customer.customerName || "Valued Customer";

    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #b91c1c;">Hi ${customerName},</h2>
        <p>We're sorry to inform you that your booking request has been <strong>rejected</strong>.</p>
        <p>Please reach out to our support team if you'd like to know more.</p>
        <p>Thank you for your interest,<br><strong>oveventz Team</strong></p>
      </div>
    `;

    const mailOptions = {
      from: SENDER_EMAIL,
      to: customer.email,
      subject: "Your Booking Request Was Rejected",
      html,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`❌ Email error: ${err.message}`);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send email",
          error: err.message 
        });
      }
      console.log(`✅ Rejection email sent successfully to: ${customer.email}`, info.response);
      res.status(200).json({ success: true, message: "Rejection email sent", data: info });
    });
  } catch (err) {
    console.error("❌ sendEmailRejected error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ 
      success: false, 
      message: "Failed to send email",
      error: err.message 
    });
  }
};

// ---------- Home Data ----------
const homeDataPost = async (req, res) => {
  try {
    const { title, desc, imageUrl } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : imageUrl || null;
    const post = await homeModle.create({ title, image, desc });
    res.status(200).json({ success: true, message: "Home data posted", data: post });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const homeDataGet = async (req, res) => {
  try {
    const data = await homeModle.find({});
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- Home Data Update ----------
const updateHomePost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Update request received for ID:", id);
    console.log("Request body:", req.body);
    console.log("Request file:", req.file ? req.file.filename : "No file");
    
    const { title, desc, imageUrl } = req.body;
    
    const updateData = {};
    if (title !== undefined && title !== null && title !== '') {
      updateData.title = title;
    }
    if (desc !== undefined && desc !== null && desc !== '') {
      updateData.desc = desc;
    }
    
    // Handle image - prefer file upload, then imageUrl, otherwise keep existing
    if (req.file) {
      // Local file upload (highest priority)
      updateData.image = `/uploads/${req.file.filename}`;
      console.log("Using uploaded file:", updateData.image);
    } else if (imageUrl !== undefined && imageUrl !== null && imageUrl.trim() !== '') {
      // Cloudinary URL or external URL from frontend
      updateData.image = imageUrl;
      console.log("Using imageUrl:", updateData.image);
    }
    // If no image provided, keep existing image (don't update it)

    console.log("Final update data:", updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided to update"
      });
    }

    const updatedPost = await homeModle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ 
        success: false, 
        message: "Post not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

// ---------- Home Data Delete ----------
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await homeModle.findByIdAndDelete(id);
    if (!deletedData)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: deletedData,
    });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- Services ----------
const addServices = async (req, res) => {
  try {
    const { title, description, image, price, rating, category } = req.body;
    const imageurl = req.file ? `/uploads/${req.file.filename}` : image || null;
    const data = await serviceModle.create({
      title,
      description,
      image: imageurl,
      price,
      rating,
      category,
    });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllServices = async (req, res) => {
  try {
    const data = await serviceModle.find();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteSeervices = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await serviceModle.findByIdAndDelete(id);
    if (!deletedData)
      return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      data: deletedData,
    });
  } catch (err) {
    console.error(" Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, price, rating, category } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (rating !== undefined) updateData.rating = parseFloat(rating);
    if (category !== undefined) updateData.category = category;
    
    // Handle image - prefer Cloudinary URL from body, fallback to file upload
    if (image !== undefined && image.trim() !== '') {
      // Cloudinary URL or external URL from frontend
      updateData.image = image;
    } else if (req.file) {
      // Local file upload (fallback)
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedService = await serviceModle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({ 
        success: false, 
        message: "Service not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (err) {
    console.error("Update service error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceModle.findById(id);
    
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: "Service not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (err) {
    console.error("Get service error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

module.exports = {
  upload,
  eventplan,
  showAllEvent,
  updateClient,
  sendEmailApproved,
  sendEmailRejected,
  homeDataPost,
  homeDataGet,
  updateHomePost,
  deletePost,
  addServices,
  getAllServices,
  deleteSeervices,
  updateService,
  getServiceById,
};

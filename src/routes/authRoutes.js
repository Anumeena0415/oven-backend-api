const express = require("express");
const router = express.Router();

const { login, register, registerCustomer, registerData, saveData ,testData} = require("../controllers/auth");
const { forgotPassword, verifyCode, resetPassword } = require("../controllers/forgotPassword");
console.log("authRoutes loaded");
router.post("/register", register);
router.post("/register/customer", registerCustomer);
router.post("/login", login);
//router.post("/save-data", saveData);
router.post("/save-data", saveData);
router.get("/registerData",registerData)
//router.get("/test",testData)

// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);


// router.get("/test", (req, res) => {
//   res.json({ success: true, message: "Auth route is working!" });
// });


module.exports = router;



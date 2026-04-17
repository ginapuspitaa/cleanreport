const express = require("express");
const multer = require("multer");
const reportController = require("../controllers/reportController");

const router = express.Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        ),
      );
    }
  },
});

// Routes
router.post("/report", upload.single("image"), reportController.createReport);
router.get("/reports", reportController.getAllReports);
router.get("/report/:id", reportController.getReportById);
router.put("/report/:id", reportController.updateReportStatus);
router.delete("/report/:id", reportController.deleteReport);

module.exports = router;

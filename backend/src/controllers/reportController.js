const Report = require("../models/Report");
const { uploadToS3, deleteFromS3 } = require("../config/aws");

// Create new report
exports.createReport = async (req, res) => {
  try {
    const { title, description, location, latitude, longitude } = req.body;

    // Validation
    if (!title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and location are required",
      });
    }

    let imageUrl = null;

    // Upload image to S3 if provided
    if (req.file) {
      try {
        imageUrl = await uploadToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
        );
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
          error: error.message,
        });
      }
    }

    // Create report in database
    const report = await Report.create({
      title,
      description,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      image_url: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      data: report,
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create report",
      error: error.message,
    });
  }
};

// Get all reports
exports.getAllReports = async (req, res) => {
  try {
    const { status } = req.query;

    let reports = await Report.findAll();

    // Filter by status if provided
    if (status) {
      reports = reports.filter((r) => r.status === status);
    }

    res.status(200).json({
      success: true,
      message: "Reports retrieved successfully",
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reports",
      error: error.message,
    });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve report",
      error: error.message,
    });
  }
};

// Update report status (admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "diproses", "selesai"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid statuses: pending, diproses, selesai",
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const updatedReport = await Report.updateStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Report status updated successfully",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update report",
      error: error.message,
    });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Delete image from S3 if exists
    if (report.image_url) {
      await deleteFromS3(report.image_url);
    }

    await Report.delete(id);

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};

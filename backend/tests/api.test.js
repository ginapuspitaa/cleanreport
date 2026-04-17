const request = require("supertest");
const express = require("express");

// Mock database and AWS for testing
jest.mock("../src/config/database", () => ({
  initializeDatabase: jest.fn().mockResolvedValue(true),
  pool: {
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([[]]), // Return empty array for SELECT
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue([[]]), // Return empty array for SELECT
    end: jest.fn(),
  },
}));

jest.mock("../src/config/aws", () => ({
  uploadToS3: jest.fn().mockResolvedValue("https://mock-s3-url.com/image.jpg"),
  deleteFromS3: jest.fn().mockResolvedValue(true),
}));

const app = require("../src/server");

describe("CleanReport API", () => {
  beforeAll(async () => {
    // Wait for database initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  afterAll(async () => {
    // Close server after tests
    if (app && app.close) {
      await new Promise((resolve) => app.close(resolve));
    }
  });
  describe("GET /", () => {
    it("should return API endpoints list", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "OK");
    });
  });

  describe("POST /api/report", () => {
    it("should create a report", async () => {
      const reportData = {
        title: "Test Report",
        description: "Test description",
        location: "Test location",
        latitude: -6.2088,
        longitude: 106.8456,
      };

      const response = await request(app).post("/api/report").send(reportData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
    });

    it("should return error for missing required fields", async () => {
      const response = await request(app).post("/api/report").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/reports", () => {
    it("should return reports list", async () => {
      const response = await request(app).get("/api/reports");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

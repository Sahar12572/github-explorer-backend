const request = require("supertest");
const app = require("./server"); // Adjust if filename is different

describe("GET /api/message", () => {
  it("should return a hello message", async () => {
    const res = await request(app).get("/api/message");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe("👋 Hello from the backend!");
  });
});

describe("GET /api/github/:username", () => {
  it("should return GitHub user data for a valid user", async () => {
    const res = await request(app).get("/api/github/torvalds"); // Linus Torvalds as example
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("login", "torvalds");
  });

  it("should return 404 for non-existent user", async () => {
    const res = await request(app).get("/api/github/nonexistentuser123456789");
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message");
  });
});

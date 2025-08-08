// server.js
const express = require("express");
const helmet = require("helmet");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config(); // optional, helps local dev with .env

const app = express();
app.use(helmet());
app.use(express.json());

// CORS: in prod set PORTFOLIO_URL to your portfolio URL (e.g. https://your-portfolio.github.io)
const allowedOrigin = process.env.PORTFOLIO_URL || "*";
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow server-to-server (curl etc)
      if (allowedOrigin === "*" || origin === allowedOrigin)
        return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.get("/api/message", (req, res) => {
  res.send("👋 Hello from the backend!");
});

const buildGithubHeaders = () => {
  const headers = { "User-Agent": "github-explorer-app" };
  if (process.env.GITHUB_TOKEN) {
    // Use your token to increase rate limits
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

app.get("/api/github/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: buildGithubHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Server error fetching from GitHub",
        error: error.message,
      });
  }
});

app.get("/api/github/:username/repos", async (req, res) => {
  const { username } = req.params;
  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: buildGithubHeaders(),
      }
    );
    if (!reposRes.ok) {
      const errorData = await reposRes.json();
      return res.status(reposRes.status).json(errorData);
    }
    const reposData = await reposRes.json();

    const repoDetails = await Promise.all(
      reposData.slice(0, 5).map(async (repo) => {
        const commitsRes = await fetch(repo.commits_url.replace("{/sha}", ""), {
          headers: buildGithubHeaders(),
        });
        const commitsData = commitsRes.ok ? await commitsRes.json() : [];
        return {
          name: repo.name,
          description: repo.description,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          commits: Array.isArray(commitsData)
            ? commitsData.slice(0, 5).map((c) => c.commit.message)
            : [],
        };
      })
    );

    res.json(repoDetails);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Server error fetching repos and commits",
        error: error.message,
      });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

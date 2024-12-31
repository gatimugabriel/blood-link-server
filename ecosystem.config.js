const { watch } = require("fs");

module.exports = {
  apps: [
    {
      name: "blood-link-server",
      script: "build/app.js",
      instances: 1,
      autorestart: true,
      // watch: ["src"],
      watch: process.env.NODE_ENV === "development",
      // ignore_watch: ["node_modules", "tmp"],
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 8080,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
    },
    {
      name: "blood-link-donation-request-worker",
      script: "build/bull/workers/donationRequest.worker.js",
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      // watch: ["src/bull"],
      watch: process.env.NODE_ENV === "development",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "blood-link-email-worker",
      script: "build/bull/workers/email.worker.js",
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      // watch: ["src/bull"],
      watch: process.env.NODE_ENV === "development",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
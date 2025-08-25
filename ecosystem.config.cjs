module.exports = {
  apps: [
    {
      name: "task-notes-server",
      script: "dist/standalone-web-server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3020,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3020,
      },
    },
  ],
};
module.exports = {
  apps: [
    {
      name: "front",
      cwd: "/home/Sistema-Gerenciamento-Gruas",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0"
      }
    }
  ]
};


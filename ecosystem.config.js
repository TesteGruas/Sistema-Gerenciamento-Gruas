const path = require("path");

/** Diretório do repositório (evita cwd fixo errado, ex.: /home/... vs /home/app/...). */
const projectRoot = path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: "front",
      cwd: projectRoot,
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};


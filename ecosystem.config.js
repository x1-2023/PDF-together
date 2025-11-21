module.exports = {
    apps: [
        {
            name: "discord-pdf-backend",
            cwd: "./backend",
            script: "src/server.ts",
            interpreter: "node",
            interpreter_args: "--loader ts-node/esm",
            env: {
                NODE_ENV: "production",
                PORT: 3001
            }
        },
        {
            name: "discord-pdf-frontend",
            cwd: "./frontend",
            script: "npm",
            args: "run preview -- --port 5173 --host",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};

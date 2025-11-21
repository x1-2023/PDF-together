module.exports = {
    apps: [
        {
            name: "discord-pdf-backend",
            cwd: "./backend",
            script: "npm",
            args: "start",
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

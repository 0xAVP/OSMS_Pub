module.exports = {
    apps: [
        {
            name: "gameserver",
            script: "./server.js",
            cwd: "/home/osms-gs1/apps/gameserver/",
            instances: "max",
            exec_mode: "cluster"
        },
        {
            name: "ssh-tunnel",
            script: "/usr/bin/ssh",

            args: "-N -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes -L 6379:127.0.0.1:6379 -L 3003:127.0.0.1:3003 osms-dbserver@144.31.139.202",
            interpreter: "none",
            autorestart: true,
            restart_delay: 3000
        }
    ]
}
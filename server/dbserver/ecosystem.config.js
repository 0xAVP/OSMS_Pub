module.exports = {
    apps: [
        {
            name: "osms-api1",
            script: "./api_server.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
        },
        {
            name: "osms-worker1",
            script: "./worker.js",

            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
        },
        {
            name: "osms-governor1",
            script: "./craftGovernor.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
        },
        {
            name: "osms-reconciler1",
            script: "./modules/reservations/reservationReconciler.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
        }
    ]
};
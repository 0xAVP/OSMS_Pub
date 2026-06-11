module.exports = {
    apps: [
        {

            name: 'exp-accrual',

            script: './worker.js',

            watch: false,

            max_memory_restart: '300M',

            autorestart: true,

            env: {
                NODE_ENV: 'dev',
            },

            env_production: {
                NODE_ENV: 'production',
            }
        }
    ]
};
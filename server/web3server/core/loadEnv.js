const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');

const result = dotenv.config({path: envPath});

if (result.error) {

    console.warn(`[dotenv] Could not find .env file at ${envPath}, relying on system environment variables.`);
} else {

}
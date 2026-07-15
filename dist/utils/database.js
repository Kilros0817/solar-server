"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        ca: fs_1.default.readFileSync(path_1.default.join(__dirname, "../../cert/global-bundle.pem")),
        rejectUnauthorized: true,
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
    min: 2,
    query_timeout: 30000,
    statement_timeout: 30000,
    application_name: 'solar-server',
});
exports.pool = pool;
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

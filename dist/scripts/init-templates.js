"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../utils/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
async function initTemplateTables() {
    try {
        console.log('Reading schema.sql...');
        const schemaPath = path_1.default.join(__dirname, '../db/schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
        console.log('Executing schema...');
        await database_1.pool.query(schema);
        console.log('Template tables initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize template tables:', error);
        process.exit(1);
    }
    finally {
        await database_1.pool.end();
        console.log('Database connection closed');
    }
}
initTemplateTables();

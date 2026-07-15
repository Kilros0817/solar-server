"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./utils/database");
const websocket_service_1 = require("./services/websocket.service");
const api_1 = __importDefault(require("./routes/api"));
const clause_1 = __importDefault(require("./routes/clause"));
const section_1 = __importDefault(require("./routes/section"));
const contract_1 = __importDefault(require("./routes/contract"));
const upload_1 = __importDefault(require("./routes/upload"));
const postgres_1 = __importDefault(require("./routes/postgres"));
const support_1 = __importDefault(require("./routes/support"));
const analysis_1 = __importDefault(require("./routes/analysis"));
dotenv_1.default.config();
const app = (0, express_1.default)();
database_1.pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    }
    else {
        console.log('Connected to PostgreSQL database');
    }
});
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['https://app.tomeblock.com', 'http://localhost:3000'],
    credentials: true,
};
app
    .use((0, cors_1.default)(corsOptions))
    .use(body_parser_1.default.urlencoded({ extended: true }))
    .use(body_parser_1.default.json())
    .use("/api", api_1.default)
    .use("/clause", clause_1.default)
    .use("/section", section_1.default)
    .use("/contract", contract_1.default)
    .use("/upload", upload_1.default)
    .use("/support", support_1.default)
    .use("/postgres", postgres_1.default)
    .use("/analysis", analysis_1.default);
const httpServer = (0, http_1.createServer)(app);
const io = (0, websocket_service_1.initializeWebSocketServer)(httpServer);
console.log('Starting Redis subscriber...');
(0, websocket_service_1.startRedisSubscriber)()
    .then(() => {
    console.log('Redis subscriber started successfully');
})
    .catch((error) => {
    console.error('Failed to start Redis subscriber:', error);
});
httpServer.listen(8085, () => {
    console.log("the server is running on port 8085");
    console.log("WebSocket server initialized");
});

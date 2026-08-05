import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import missionRoutes from './Routes/missionRoutes.js';
import authRoutes from './Routes/authRoutes.js';
import { isAuthenticated } from './Middlewares/authMiddleware.js';
import { startGraphQLServer } from './graphql/index.js';
import questRoutes from './Routes/questRoute.js'
import trackerRoutes from './Routes/trackerRoutes.js';
import { addSkills } from './seeds/addSkills.js';
import { addEquipments } from './seeds/addEquipment.js';
import skillRoutes from './Routes/skillRoutes.js'
import equimentRoutes from './Routes/equimentRoutes.js'
import rankRoutes from './Routes/rankRoutes.js';
import sidequestRoutes from './Routes/sidequestRoutes.js';
import titleRoutes from './Routes/titleRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import assistantRoutes from './Routes/assistantRoutes.js';
import './events/eventLogger.js';  // Activate event logging
import { initSocket } from './socket/socketManager.js';
import './workers/notificationWorker.js';  // Socket.io push (stays in Node.js)

const app=express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Initialize WebSocket server
initSocket(httpServer);
 

// Middleware
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// When behind a proxy (e.g., Render), enable trust proxy for secure cookies
if (isProd) {
    app.set('trust proxy', 1);
}


//routes
app.get('/', (req, res) => {
    res.send('Welcome to the server!');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "system2-server",
        timestamp: new Date().toISOString()
    });
});
app.use('/rank', isAuthenticated, rankRoutes);
app.use('/mission',isAuthenticated,missionRoutes);
app.use('/auth',authRoutes);
app.use('/quest',isAuthenticated,questRoutes);
app.use('/tracker',isAuthenticated,trackerRoutes);
app.use('/skill',isAuthenticated,skillRoutes);
app.use('/inventory',isAuthenticated,equimentRoutes);
app.use('/sidequest', isAuthenticated, sidequestRoutes);
app.use('/titles', isAuthenticated, titleRoutes);
app.use('/user', isAuthenticated, userRoutes);
app.use('/assistant', isAuthenticated, assistantRoutes);

// GraphQL server
startGraphQLServer(app).catch(err => {
    console.error('Error starting GraphQL server:', err);
});

httpServer.on('error', (err) => {
    if (err?.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing process or set PORT in .env.`);
        return;
    }
    console.error('HTTP server error:', err);
});

(async () => {
    await connectDB();
    // addEquipments();
    // addSkills();
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();
export default app;
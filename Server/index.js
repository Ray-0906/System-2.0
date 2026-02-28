import express from 'express';
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
const app=express();
 

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

// GraphQL server
startGraphQLServer(app).catch(err => {
    console.error('Error starting GraphQL server:', err);
});

app.listen(3000, () => {
    connectDB();
    // addEquipments();
    // addSkills();
    console.log('Server is running on port 3000');
});
export default app;
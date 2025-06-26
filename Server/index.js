import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { conectDB } from './config/db.js';
import missionRoutes from './Routes/missionRoutes.js';
import authRoutes from './Routes/authRoutes.js';
import passport from 'passport';
import session from 'express-session';
import { isAuthenticated } from './Middlewares/authMiddleware.js';
import './config/passport.js'
import { startGraphQLServer } from './graphql/index.js';
import questRoutes from './Routes/questRoute.js'
import trackerRoutes from './Routes/trackerRoutes.js';
import { addSkills } from './addjs.js';
import { addEquipments } from './addEqui.js';
import skillRoutes from './Routes/skillRoutes.js'
import equimentRoutes from './Routes/equimentRoutes.js'
import { evaluateRankAscension } from './Controllers/equimentController.js';
const app=express();
 

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());



//routes
app.get('/', (req, res) => {
    res.send('Welcome to the server!');
});
app.get('/user/rankAscension', isAuthenticated, evaluateRankAscension);
app.use('/mission',isAuthenticated,missionRoutes);
app.use('/auth',authRoutes);
app.use('/quest',isAuthenticated,questRoutes);
app.use('/tracker',isAuthenticated,trackerRoutes);
app.use('/skill',isAuthenticated,skillRoutes);
app.use('/inventory',isAuthenticated,equimentRoutes);

// GraphQL server
startGraphQLServer(app).catch(err => {
    console.error('Error starting GraphQL server:', err);
});

app.listen(3000, () => {
    conectDB();
    // addEquipments();
    // addSkills();
    console.log('Server is running on port 3000');
});
export default app;
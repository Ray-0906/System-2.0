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
import sidequestRoutes from './Routes/sidequestRoutes.js';
const app=express();
 

// Middleware
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// When behind a proxy (e.g., Render), enable trust proxy for secure cookies
if (isProd) {
    app.set('trust proxy', 1);
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax'
    }
}));

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
app.use('/sidequest', isAuthenticated, sidequestRoutes);

app.post('/set-cookie', (req, res) => {
    res.cookie('token', req.body.token, {
    httpOnly: true,
    secure: isProd, // true over HTTPS in production
    sameSite: isProd ? 'none' : 'lax'
    });
    res.status(200).send('Cookie set');
});

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
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
app.use('/mission',isAuthenticated,missionRoutes);
app.use('/auth',authRoutes);
app.use('/quest',isAuthenticated,questRoutes);
app.use('/tracker',isAuthenticated,trackerRoutes);

// GraphQL server
startGraphQLServer(app).catch(err => {
    console.error('Error starting GraphQL server:', err);
});

app.listen(3000, () => {
    conectDB();
    console.log('Server is running on port 3000');
});
export default app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const distributeDailyIncome = require('./utils/dailyMinerIncome');
const http = require('http');
const { Server } = require("socket.io");

// Routes
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require("./routes/user.routes");
const walletRoutes = require("./routes/wallet.routes");
const unlockMiners = require('./utils/unlockMiner');
const transferMiningEarnings = require('./utils/monthlyMinerIncome');
const app = express();

//setup morgan logger
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// const nebuluxModel = require('./models/nebulux.model');

// const createNebuluxCoin = async () => {
//     try {
//         const existingCoin = await nebuluxModel.findOne({ name: 'Nebulux' });
//         if (!existingCoin) {
//             const newCoin = new nebuluxModel({
//                 icon: 'https://ik.imagekit.io/anubhavmaithil24/qMiner-miners/Nebulux%20Coin.png', // Replace with actual icon URL
//                 name: 'Nebulux',
//                 price: 0.1, // Initial price
//                 supply: 1000000000, // Total supply
//                 sold: 0,
//                 estdValue: 150,
//             });
//             await newCoin.save();
//             console.log("Nebulux coin created successfully.");
//         } else {
//             console.log("Nebulux coin already exists.");
//         }
//     } catch (error) {
//         console.error("Error creating Nebulux coin:", error);
//     }
// }

// createNebuluxCoin()


// Schedule the function to run daily at midnight
cron.schedule('0 0 * * *', async () => {
    console.log("Running daily income distribution...");
    try {
        await distributeDailyIncome();
    } catch (error) {
        console.error("Error in daily income distribution:", error);
    }

    console.log("Running daily unlock task...");
    try {
        await unlockMiners();
    } catch (error) {
        console.error("Error in daily unlock task:", error);
    }
});

cron.schedule('0 0 1 * *', async () => {
    console.log('🚀 Running monthly transferMiningEarnings cron...');
    await transferMiningEarnings();
});

// Security middleware
// This middleware sets HTTP headers to secure the app by setting various Content Security Policies.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"], // Allows scripts to be loaded from the same origin and inline scripts
            "img-src": ["'self'", "data:", "https:"], // Allows images from the same origin, data URLs, and HTTPS URLs
        },
    },
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Enable CORS - Must be before routes
app.use(cors({
    origin: ['http://localhost:6073', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Body parser
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// app.use('/', viewRoutes);
// app.use('/public', publicRoutes);
app.get('/', (req, res) => {
    console.log('Hello World');
    res.status(200).json({ message: 'Hello World' });
});
app.use('/api/admin', adminRoutes);
app.use("/api/user", userRoutes);
app.use('/api/wallet',walletRoutes);
// Error handling
app.use(errorHandler);
// require("./utils/dailyCron")
// Start server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Socket.io Setup
var io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
    // console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
        // console.log("User disconnected:", socket.id);
    });
});
app.set("io", io);

const os = require('os');

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (!iface.internal && iface.family === 'IPv4') {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
};

server.listen(PORT, () => {
    const ip = getLocalIP();
    console.log(`Server running on port ${PORT}`);
    console.log(`   🌐  Local:   http://localhost:${PORT}`);
    console.log(`   🖥️  Network: http://${ip}:${PORT}`);
});
server.on('error', onError);
server.on('listening', onListening);

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.log(err)
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});



function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string'
        ? 'Pipe ' + PORT
        : 'PORT ' + PORT;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}


function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
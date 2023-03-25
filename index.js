const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const dashboard = require('./routes/dashboard');
const connectDB = require('./config/db');
const morgan = require('morgan');
app.use(express.static(path.join(__dirname, 'layers')));
require('dotenv').config();
app.use(morgan('dev'));

// app.use(express.json())

// const corsOpts = {
//   origin: "*",

//   methods: ["GET", "POST","PUT"],

//   allowedHeaders: ["Content-Type"],
// };

// app.use(cors(corsOpts));
app.use(cors());
app.options('*', cors());
connectDB();
// app.use(bodyParser.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.json({ limit: '100mb', extended: true }));
app.use(dashboard);
app.listen(process.env.PORT, () => {
  console.log(`app is runing on 5000 ${process.env.PORT}`);
});

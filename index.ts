import dotenv from 'dotenv';
dotenv.config();
import { createConnection } from 'typeorm';
import { createServer } from './server';
import connection from './src/helpers/Connection';
var cloudinary = require('cloudinary').v2;
import RequestStatsMiddleware from './src/middleware/RequestStatsMiddleware'

createConnection()
  .then(() => connection.clear())
  .then(async () => {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });

    const app = createServer();

    const port = process.env.PORT;

    const server = app.listen(port, () => {
      console.log(`Server has started at http://localhost:${port}`);
    });

    RequestStatsMiddleware(server)
  });

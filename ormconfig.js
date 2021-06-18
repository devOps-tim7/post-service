postgressConnectionStringParser = require('pg-connection-string');

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  const connectionOptions = postgressConnectionStringParser.parse(databaseUrl);
  module.exports = {
    type: 'postgres',
    host: connectionOptions.host,
    port: connectionOptions.port,
    username: connectionOptions.user,
    password: connectionOptions.password,
    database: connectionOptions.database,
    entities: ['src/models/*.ts', 'src/models/*.js'],
    logging: false,
    synchronize: true,
    bigNumberStrings: false,
    extra: {
      ssl: { rejectUnauthorized: false },
    },
  };
} else {
  module.exports = {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    entities: ['src/models/*.ts', 'src/models/*.js'],
    logging: false,
    synchronize: true,
    bigNumberStrings: false,
  };
}

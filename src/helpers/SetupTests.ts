import connection from '../helpers/Connection';

global.beforeAll(async () => {
  await connection.create();
});

global.afterAll(async () => {
  await connection.close();
});

import { createConnection, getConnection } from 'typeorm';

const connection = {
  async create() {
    await createConnection();
  },

  async close() {
    await getConnection().close();
  },

  async clear() {
    const connection = getConnection();
    const entities = connection.entityMetadatas;
    return Promise.all(
      entities.map((entity) => {
        const repository = connection.getRepository(entity.name);
        return repository.query(`DELETE FROM ${entity.tableName}`);
      })
    );
  },
};
export default connection;

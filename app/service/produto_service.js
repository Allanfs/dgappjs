const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();
const logger = require('../../config/logger');

const tb = `dg.tb_produto`;

module.exports = function(db) {
  return {
    async buscarTodos() {
      return await db
        .query(sqlgen.select(tb, '*').sql)
        .then((data) => {
          logger.info(`${data.rowCount} produtos encontrados`);
          if (data.rowCount === 0) {
            return null;
          }
          return data.rows;
        })
        .catch((e) => {
          logger.error(`erro ao realizar consulta dos produtos`);
          return null;
        });
    },

    async buscarPorID(id) {
      const consulta = sqlgen.select(tb, '*', { id_produto: id });
      return await db
        .query(consulta.sql, consulta.values)
        .then((data) => {
          if (data.rowCount === 0) {
            logger.info(`nenhum produto encontrado com id [${id}]`);
            return null;
          }
          logger.info(`produto encontrado [${data.rows[0].nome}]`);
          return data.rows[0];
        })
        .catch((e) => {
          logger.error(`erro ao realizar consulta dos produtos`);
          return null;
        });
    }
  };
};

const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();
const logger = require('../../config/logger');
const tb = `dg.tb_recheio`;

module.exports = (db) => {
  return {
    async buscarTodos() {
      const consulta = sqlgen.select(tb, '*');
      return db.query(consulta.sql).then((data) => {
        if (data.rowCount === 0) {
          logger.info(`nenhum recheio encontrado`);
          return null;
        }
        logger.info(`${data.rowCount} recheios encontrados`);
        return data.rows;
      });
    },
    async buscarPorId(id) {
      const consulta = sqlgen.select(tb, '*', { id_recheio: id });
      return db.query(consulta.sql, consulta.values).then((data) => {
        if (data.rowCount === 0) {
          logger.info(`nenhum recheio encontrado`);
          return null;
        }
        return data.rows[0];
      });
    }
  };
};

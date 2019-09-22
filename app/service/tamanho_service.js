const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();
const logger = require('../../config/logger');
const tb = `dg.tb_tamanho`;

module.exports = (db) => {
  return {
    async buscarTodos() {
      const consulta = sqlgen.select(tb, '*');
      return db.query(consulta.sql).then((data) => {
        if (data.rowCount === 0) {
          logger.info(`nenhum tamanho encontrado`);
          return null;
        }
        logger.info(`${data.rowCount} tamanhos encontrados`);
        return data.rows;
      });
    },
    async buscarPorId(id) {
      const consulta = sqlgen.select(tb, '*', { id_tamanho: id });
      return db.query(consulta.sql, consulta.values).then((data) => {
        if (data.rowCount === 0) {
          logger.info(`nenhum tamanho encontrado`);
          return null;
        }
        return data.rows[0];
      });
    }
  };
};

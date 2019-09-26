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
    },
    async buscarPorSabor(id) {
      const consulta = sqlgen.select(tb, '*', { id_sabor: id });
      logger.info(`buscar todos os recheios do sabor [${id}]`);
      return await db
        .query(consulta.sql, consulta.values)
        .then((data) => {
          if (data.rowCount === 0) {
            logger.info(`nenhum recheio encontrado para o sabor [${id}]`);
            return null;
          } else {
            logger.info(
              `[${dara.rowCount}] recheios encontrados para o sabor [${id}]`
            );
            return data.rows;
          }
        })
        .catch((e) => {
          logger.error(`falha ao obter os recheios do sabor [${id}]`);
          logger.debug(e);
          return null;
        });
    }
  };
};

const logger = require('../../config/logger');
const service = require('../service/tamanho_service');
module.exports = (app, db) => {
  const tamanhoService = service(db);
  app.get('/tamanhos', async (req, res) => {
    logger.info(`buscar todos os tamanhos`);
    const tamanhos = await tamanhoService.buscarTodos();
    if (!tamanhos) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(tamanhos);
  });
};

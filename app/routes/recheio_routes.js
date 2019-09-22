const logger = require('../../config/logger');
const service = require('../service/recheio_service');
module.exports = (app, db) => {
  const recheioService = service(db);
  app.get('/recheios', async (req, res) => {
    logger.info(`buscar todos os recheios`);
    const recheios = await recheioService.buscarTodos();
    if (!recheios) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(recheios);
  });
};

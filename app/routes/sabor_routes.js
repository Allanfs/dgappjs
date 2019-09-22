const sService = require('../service/sabor_service');
const logger = require('../../config/logger');

module.exports = (app, db) => {
  app.get('/sabores', async (req, res) => {
    const saborService = sService(db);

    const sabores = await saborService.obterTodos();

    if (!sabores) {
      logger.info(`nenhum sabor cadastrado`);
      res.status(204).send(null);
      return;
    }

    logger.info(`${sabores.length} sabores encontrados`);

    res.status(200).send(sabores);
    return;
  });

  app.get('/sabores/:id', async (req, res) => {
    const saborService = sService(db);
    const id = req.params.id;

    let sabor;
    try {
      sabor = await saborService.obterSaborPorId(id);
    } catch (error) {
      switch (error) {
        case `sabor não encontrado`:
          res.status(404).send(`sabor inexistente`);
          return;

        default:
          logger.error(error);
          res.status(500).send();
          return;
      }
    }

    res.status(200).send(sabor);
    return;
  });
};

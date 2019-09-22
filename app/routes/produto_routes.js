const logger = require('../../config/logger');
const pService = require('../service/produto_service');
module.exports = (app, db) => {
  const produtoService = pService(db);
  app.get('/produtos', async (req, res) => {
    logger.info(`buscar todos os produtos`);
    const produtos = await produtoService.buscarTodos();
    if (!produtos) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(produtos);
  });
};

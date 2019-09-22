const clienteRoutes = require('./cliente_routes');
const pedidoRoutes = require('./pedido_routes');
const saborRoutes = require('./sabor_routes');
const produtoRoutes = require('./produto_routes');

module.exports = function(app, db) {
  clienteRoutes(app, db),
    pedidoRoutes(app, db),
    saborRoutes(app, db),
    produtoRoutes(app, db);
};

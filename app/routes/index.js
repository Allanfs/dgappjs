const clienteRoutes = require('./cliente_routes');
const pedidoRoutes = require('./pedido_routes');
const saborRoutes = require('./sabor_routes');
const produtoRoutes = require('./produto_routes');
const tamanhoRoutes = require('./tamanho_routes');
const recheioRoutes = require('./recheio_routes');

module.exports = function(app, db) {
  clienteRoutes(app, db),
    pedidoRoutes(app, db),
    saborRoutes(app, db),
    produtoRoutes(app, db),
    tamanhoRoutes(app, db),
    recheioRoutes(app, db);
};

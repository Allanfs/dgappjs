const clienteRoutes = require('./cliente_routes')
const pedidoRoutes = require('./pedido_routes')

module.exports = function(app, db){
  clienteRoutes(app, db),
  pedidoRoutes(app, db)
}
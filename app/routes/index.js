const clienteRoutes = require('./cliente_routes')

module.exports = function(app, db){
  clienteRoutes(app, db)
}
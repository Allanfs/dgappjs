const express = require('express');
const {Pool, Client} = require('pg');
const db = require('./config/db')
const bodyParser = require('body-parser');

const client = new Client({
  connectionString:db.url,
  ssl: true
})

const app = express();
const port = 8080;

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

client.connect()
.then( () => {
  require('./app/routes')(app, client);
  app.listen(port, () => {
    console.log("Conectado com sucesso!")
  })

}).catch( e => {
  console.log(`Falha ao conectar com banco de dados!${e}`);
  client.end();
})


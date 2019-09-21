const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const db = require('./config/db');
const bodyParser = require('body-parser');

/* ----------------------------------------------------------------- */

const app = express();
const port = 8080;

const client = new Client({
  connectionString: db.url,
  ssl: true
});

/* ----------------------------------------------------------------- */

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

/* ----------------------------------------------------------------- */

client
  .connect()
  .then(() => {
    require('./app/routes')(app, client);
    app.listen(port, () => {
      console.log('Conectado com sucesso!');
    });
  })
  .catch((e) => {
    console.log(`Falha ao conectar com banco de dados!${e}`);
    client.end();
  });

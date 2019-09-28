const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const logger = require('./config/logger');
/* ----------------------------------------------------------------- */

const app = express();
const port = process.env.PORT || 8080;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
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
      logger.info('conectado com sucesso');
    });
  })
  .catch((e) => {
    logger.error(`falha ao conectar com banco de dados!${e}`);
    client.end();
  });

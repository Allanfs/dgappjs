const SqlGenerator = require('sql-generator');
const logger = require('../../config/logger');

const sqlgen = new SqlGenerator();
const clienteService = require('../service/cliente_sevice');

module.exports = function(app, db) {
  const cService = clienteService(db);

  app.get('/clientes', (req, res) => {
    logger.info('Consultando todos os clientes');
    db.query(qGetClientes)
      .then((r) => {
        res.status(200);
        res.type('application/json');
        res.send(r.rows);
      })
      .catch((e) => {
        logger.error('Deu erro! =(', e);
        res.type('application/json');
        res.send(e);
      });
  });

  app.get('/clientes/:id', async (req, res) => {
    const id = req.params.id;

    if (isNaN(id) || id <= 0) {
      res.status(400).send('ID inválido');
      return;
    }

    let consulta = qGetClientes.text;
    let cliente;

    consulta += ` WHERE id_cliente = ${id}`;

    await db
      .query(consulta)
      .then(({ rows }) => (cliente = rows[0]))
      .catch((err) => logger.error(err));

    if (cliente === null || cliente === undefined) {
      res.status(404).send(null);
    }

    res.send(cliente);
    return;
  });

  app.get('/clientes/telefone/:telefone([0-9]+)', async (req, res) => {
    let telefoneStr = req.params.telefone;
    logger.info(`buscar cliente pelo numero de telefone [${telefoneStr}]`);

    switch (telefoneStr.length) {
      case 8: // 32356050
        logger.info('consultando um telefone fixo');
        break;
      case 9: // 996185444
        logger.info('consultando um celular');
        break;

      default:
        res.status(400).send('telefone inválido');
        return;
    }

    let clienteEncontrado;
    await cService
      .buscarPorTelefone(telefoneStr)
      .then((cliente) => {
        if (cliente !== null) {
          logger.info(`encontrado cliente [${cliente.id_cliente}]`);
          clienteEncontrado = cliente;
        } else {
          logger.info(`nenhum cliente encontrado`);
          clienteEncontrado = null;
        }
      })
      .catch((e) => {
        logger.error(`falha ao consultar cliente. ${e}`);
        res.sendStatus(500);
      });

    if (!clienteEncontrado) {
      res.sendStatus(404);
      return;
    }

    await cService
      .buscarTelefoneDoCliente(clienteEncontrado.id_cliente)
      .then((telefone) => (clienteEncontrado.telefone = telefone))
      .catch((e) => {
        logger.error(
          `falha ao encontrar telefone do cliente [${clienteEncontrado.id_cliente}]`
        );
        res.sendStatus(500);
      });
    await cService
      .buscarEnderecoDoCliente(clienteEncontrado.id_cliente)
      .then((endereco) => (clienteEncontrado.endereco = endereco))
      .catch((e) => {
        logger.error(
          `falha ao encontrar telefone do cliente [${clienteEncontrado.id_cliente}]`
        );
        res.sendStatus(500);
      });

    res.status(200).send(clienteEncontrado);
  });

  app.get('/clientes/cpf/:cpf([0-9]{11})', (req, res) => {
    let cpfStr = req.params.cpf;
    logger.info(`buscar cliente pelo cpf`);

    cService
      .buscarPorCpf(cpfStr)
      .then((cliente) => {
        if (cliente !== null) {
          logger.info(`encontrado cliente [${cliente.id_cliente}]`);
          res.status(200).send(cliente);
        } else {
          logger.info(`nenhum cliente encontrado`);
          res.status(404).send(null);
        }
      })
      .catch((e) => {
        logger.error(`falha ao consultar cliente.`);
        logger.debug(`erro: ${e}`);
        res.sendStatus(500);
      });
  });

  app.post('/clientes', async (req, res) => {
    const b = req.body;
    logger.info(`cadastrar um novo cliente`);

    let dadosCliente = [b.nome, b.cpf, b.instagram, b.email, b.data_nascimento];
    let dadosTelefone = [
      b.telefone.ddd,
      b.telefone.numero,
      b.telefone.whatsapp,
      b.telefone.observacao
    ];
    let dadosEndereco = [
      b.endereco.rua,
      b.endereco.bairro,
      b.endereco.complemento,
      b.endereco.numero
    ];

    try {
      await db.query('BEGIN');

      // INSERIR CLIENTE
      let novoCliente;
      try {
        novoCliente = await cService.cadastrarCliente(b);
      } catch (error) {
        logger.error(`falha ao cadastrar cliente`);
        logger.debug(`erro: ${error}`);

        await db.query('ROLLBACK');
        logger.info('ROLLBACK transação');
        res.status(500).send(`falha ao cadastrar cliente`);
        return;
      }
      const idCliente = novoCliente.id_cliente;

      if (idCliente === -1) {
        return;
      }

      dadosTelefone.push(idCliente);
      dadosEndereco.push(idCliente);

      // INSERIR TELEFONE
      await db.query(qInsertTelefone, dadosTelefone);

      // INSERIR ENDEREÇO
      await db.query(qInsertEndereco, dadosEndereco);
    } catch (ex) {
      logger.error(`falha na transação`);
      logger.debug(`erro: ${ex}`);
      await db.query('ROLLBACK');
      logger.info('ROLLBACK transação');
    }
    await db.query('COMMIT');
    logger.info('COMMIT transação');
    res.status(201).send('ok');
  });

  app.delete('/clientes/:id', async (req, res) => {
    const id = req.params.id;
    const param = [id];

    const existe = await db
      .query(`select true from dg.tb_cliente where id_cliente = $1`, param)
      .then((r) => {
        if (r.rowCount === 0) {
          return false;
        }
        return true;
      })
      .catch((er) => logger.error(er));

    if (!existe) {
      logger.info('Não existe cliente com esse id');
      res.status(200).send('OK');
      return;
    }

    await db.query('BEGIN');
    logger.info('transação para exclusão: iniciada');
    logger.info('remover cliente de id', id);
    try {
      await db.query('DELETE FROM dg.tb_telefone where id_cliente = $1', param);
      await db.query('DELETE FROM dg.tb_endereco where id_cliente = $1', param);
      await db.query('DELETE FROM dg.tb_cliente where id_cliente = $1', param);
    } catch (ex) {
      await db.query('ROLLBACK');
      res.status(500).send(`Falha ao realizar transação ${ex}`);
      return;
    }

    await db.query('COMMIT');
    logger.info('exclusão realizada com sucesso!');

    res.status(200).send('OK');
    return;
  });

  app.patch('/clientes/:id', async (req, res) => {
    res.status(501).send('Rota não implementada');
  });
};

const qGetClientes = {
  name: 'get-clientes',
  text: sqlgen.select('dg.tb_cliente').sql
};

const qInsertTelefone = {
  name: 'insert-telefone',
  text: sqlgen.insert('dg.tb_telefone', {
    ddd: '$1',
    numero: '$2',
    whatsapp: '$3',
    observacao: '$4',
    id_cliente: '$5'
  }).sql
};

const qInsertCliente = {
  name: 'insert-cliente',
  text: sqlgen.insert('dg.tb_cliente', {
    nome: '$1',
    cpf: '$2',
    instagram: '$3',
    email: '$4',
    data_nascimento: '$5::DATE'
  }).sql
};

const qInsertEndereco = {
  name: 'insert-endereco',
  text: sqlgen.insert('dg.tb_endereco', {
    rua: '$1',
    bairro: '$2',
    complemento: '$3',
    numero: '$4',
    id_cliente: '$5'
  }).sql
};

const qUpdateCliente = {
  text: sqlgen.update(
    'dg.tb_endereco',
    { id_cliente: '$1' },
    {
      rua: '$1',
      bairro: '$2',
      complemento: '$3',
      numero: '$4',
      id_cliente: '$5'
    }
  ).sql
};

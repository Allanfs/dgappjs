const SqlGenerator = require('sql-generator');

const sqlgen = new SqlGenerator();
const clienteService = require('../service/cliente_sevice');

module.exports = function(app, db) {
  const cService = clienteService(db);

  app.get('/clientes', (req, res) => {
    console.log('Consultando todos os clientes');
    db.query(qGetClientes)
      .then((r) => {
        console.log(r);
        res.status(200);
        res.type('application/json');
        res.send(r.rows);
      })
      .catch((e) => {
        console.log('Deu erro! =(', e);
        res.type('application/json');
        res.send(e);
      });
  });

  app.get('/clientes/:id', async (req, res) => {
    const id = req.params.id;

    if (isNaN(id) || id <= 0) {
      res.status(400);
      res.send('ID inválido');
      return;
    }

    let consulta = qGetClientes.text;
    let cliente;

    consulta += ` WHERE id_cliente = ${id}`;

    await db
      .query(consulta)
      .then(({ rows }) => (cliente = rows[0]))
      .catch((err) => console.error(err));

    if (cliente === null || cliente === undefined) {
      res.status(404);
      res.send(null);
    }

    res.send(cliente);
    return;
  });

  app.get('/clientes/telefone/:telefone([0-9]+)', async (req, res) => {
    let telefoneStr = req.params.telefone;

    switch (telefoneStr.length) {
      case 8:
        console.log('consultando um celular');
        break;
      case 9:
        console.log('consultando um telefone fixo');
        break;

      default:
        res.status(400).send('telefone inválido');
        return;
    }

    cService
      .buscarPorTelefone(telefoneStr)
      .then((cliente) => {
        if (cliente !== null) {
          console.log(`encontrado cliente [${cliente.id_cliente}]`);
          res.status(200).send(cliente);
        } else {
          console.log(`nenhum cliente encontrado`);
          res.status(404).send(null);
        }
      })
      .catch((e) => {
        console.error(`falha ao consultar cliente. ${e}`);
        res.sendStatus(500);
      });

    return;
  });

  app.get('/clientes/cpf/:cpf([0-9]{11})', (req, res) => {
    let cpfStr = req.params.cpf;

    cService
      .buscarPorCpf(cpfStr)
      .then((cliente) => {
        if (cliente !== null) {
          console.log(`encontrado cliente [${cliente.id_cliente}]`);
          res.status(200).send(cliente);
        } else {
          console.log(`nenhum cliente encontrado`);
          res.status(404).send(null);
        }
      })
      .catch((e) => {
        console.error(`falha ao consultar cliente. ${e}`);
        res.sendStatus(500);
      });
  });

  app.post('/clientes', async (req, res) => {
    const b = req.body;

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

    console.log(dadosCliente);
    try {
      await db.query('BEGIN');

      // INSERIR CLIENTE
      let novoCliente;
      try {
        novoCliente = await cService.cadastrarCliente(b);
      } catch (error) {
        console.error(error);
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
      console.log('Falha na transação', ex);
      await db.query('ROLLBACK');
    }
    await db.query('COMMIT');
    res.status(201);
    res.send('ok');
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
      .catch((er) => console.error(er));

    if (!existe) {
      console.log('Não existe cliente com esse id');
      res.status(200).send('OK');
      return;
    }

    await db.query('BEGIN');
    console.log('transação para exclusão: iniciada');
    console.log('remover cliente de id', id);
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
    console.log('exclusão realizada com sucesso!');

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

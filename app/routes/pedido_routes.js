const SqlGenerator = require('sql-generator');
const pService = require('../service/pedido_service');
const sqlgen = new SqlGenerator();

module.exports = function(app, db) {
  const tb = `dg.tb_pedido`;
  const pedidoService = pService(db);

  app.get('/pedidos', async (req, res) => {
    console.log('não há implementação para buscar todos os pedidos');
    res.status(501).send('Rota não implementada');

    let pedidos;
    await db
      .query(qGetPedidos)
      .then((r) => {
        pedidos = r.rows;
      })
      .catch((e) => console.error('falha na consulta', e));

    res.status(200).send(pedidos);
    return;
  });

  app.get('/pedidos/:id', async (req, res) => {
    const id = req.params.id;

    if (isNaN(id) || id <= 0) {
      res.status(400).send('ID inválido');
      return;
    }
    pedidoService
      .buscarPedidoPorID(id)
      .then((pedido) => {
        if (pedido) {
          console.log('achei!');
          res.status(200).send(pedido);
        } else {
          console.log('não achei esse pedido');
          res.sendStatus(404);
        }
      })
      .catch((e) => {
        console.log('erro ein', e);
        res.status(500).send(e);
      });

    return;
  });

  app.get('/pedidos/estado/:estado', async (req, res) => {
    const estado = req.params.estado;
    const consulta = qGetPedidos;
    let idEstado;
    switch (estado) {
      case 'aberto':
        idEstado = 1;
        break;
      case 'fechado':
        idEstado = 2;
        break;
      default:
        res.status(400).send('estado desconhecido');
        return;
    }

    consulta += ` WHERE estado = ${idEstado}`;

    const pedidos = await db
      .query(consulta)
      .then(({ rows }) => rows)
      .catch((e) => {
        console.error('falha na consulta', e);
        return [];
      });

    if (length(pedidos) <= 0) {
      console.log(`não foram encontrados pedidos no estado '${estado}'`);
      res.status(404).send(pedidos);
      return;
    }

    console.log(`${length(pedidos)} foram encontrados no estado '${estado}'`);
    res.status(200).send(pedidos);
    return;
  });

  app.get('/pedidos/cliente/:id', async (req, res) => {
    const id = req.params.id;
    const consulta = qGetPedidos;

    if (isNaN(id) || id <= 0) {
      res.status(400);
      res.send('ID inválido');
      return;
    }

    console.log(`buscar todos os pedidos do cliente de id ${id}`);

    consulta += ` WHERE id_cliente = ${id}`;
    const pedidos = await db
      .query(consulta)
      .then(({ rows }) => rows)
      .catch((e) => {
        console.error('falha ao realizar a consulta', e);
        return [];
      });

    let n = length(pedidos);
    if (n <= 0) {
      res.status(404).send('nenhum pedido encontrado');
      return;
    }

    console.log(`${n} pedidos foram encontrados para o cliente`);

    res.status(200).send(pedidos);
    return;
  });

  app.post('/pedidos', async (req, res) => {
    const pedido = req.body;

    const pedidoJaCadastrado = pedido.id_pedido ? true : false;
    // o pedido já está cadastrado(possui id)?
    if (pedidoJaCadastrado) {
      console.log('pedido informado possui um id');
      console.log('retornando 400');
      res.status(400).send('pedido informado possui id_pedido');
      return;
    }

    // cliente foi informado(possui id)?
    if (pedido.cliente) {
      if (!pedido.cliente.id_cliente) {
        console.log('não foi informado id_cliente do pedido');
        res.status('400').send('não foi informado id_cliente');
        return;
      }
    }

    // possui pelo menos um item no pedido?
    const qtdItens = pedido.itens.length;

    if (!qtdItens) {
      console.log('nenhum item foi informado no pedido');
      res.status(400).send('nenhum item informado no pedido');
      return;
    }
    console.log(`${qtdItens} itens informados`);
    pedido.subtotal = pedido.subtotal || 0;
    for (let i = 0; i < pedido.itens.length; i++) {
      const item = pedido.itens[i];

      if (!pedidoService.validarItemPedido(item)) {
        res.status(400).send(`um dos itens informados é inválido`);
        return null;
      }

      await pedidoService.calcularValorItemPedido(item).then((valor) => {
        pedido.itens[i].valor = valor;
        pedido.subtotal += valor * item.quantidade;
      });
    }

    // let subtotal = 0 // verifica se o valor de desconto é inferior ao valor do pedido
    // if(pedido.valor_desconto && !isNaN(pedido.valor_desconto)) {
    //   console.log('aplicando desconto no valor de', pedido.valor_desconto)
    //   subtotal = (parseFloat(pedido.valor_desconto)*(-1))
    //   console.log('valor do subtotal:', subtotal)
    // }
    if (pedido.valor_pago > 0) {
      if (pedido.valor_pago < pedido.subtotal || pedido.valor_pago === 0) {
        console.log('valor de pagamento inferior valor total');
        res
          .status(400)
          .send('valor de pagamento é inferior ao valor do pedido');
        return;
      }
    }
    // salva
    let pedidoRetorno;

    try {
      pedidoRetorno = await pedidoService.cadastrarPedido(pedido);
    } catch (error) {
      switch (error) {
        case 'falha ao cadastrar sabor':
          res.status(400).send(error);
          return;

        default:
          res.status(500).send(`falha ao cadastrar pedido. ${error}`);
          return;
      }
    }

    res.status(201).send(pedidoRetorno);
    return;
  });

  app.patch('/pedidos/:id', async (req, res) => {
    const idPedido = req.params.id;

    pedidoService
      .fecharPedido(idPedido)
      .then((_) => {
        res.status(202).send('pedido fechado com sucesso');
      })
      .catch((e) => {
        if (!isNaN(e)) {
          res.status(e).send();
        } else {
          res.status(200).send(e);
        }
      });

    return;
  });
};

const qGetPedidos = {
  name: 'get-pedidos',
  text: sqlgen.select(`dg.tb_pedido`, '*')
};

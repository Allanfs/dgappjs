const SqlGenerator = require('sql-generator');
const pService = require('../service/pedido_service')
const sqlgen = new SqlGenerator();


module.exports =  function(app, db){

  const pedidoService = pService(db)
  
  app.get('/pedidos', async (req, res) => {
    console.log('não há implementação para buscar todos os pedidos')
    res.status(501).send('Rota não implementada')

    let pedidos
    await db.query(qGetPedidos).then( r=> {
      pedidos = r.rows
    }).catch( e => console.error('falha na consulta', e))
    
    res.status(200).send(pedidos)
    return
  });

  app.get('/pedidos/:id', async (req, res) => {
    const id = req.params.id

    if(isNaN(id) || id <= 0) {
      res.status(400)
      res.send("ID inválido")
      return
    }
    
    const consulta = qGetPedidos
    consulta += ` WHERE id_pedido = ${id}`

    const pedido = await db.query(consulta)
    .then( r => r.rows[0])
    .catch( e => {
      console.error('falha na consulta', e)
      return {}
    })

    if (pedido === null || pedido === {} ) {
      res.status(404).send('nenhum pedido encontrado')
      return  
    }
    
    res.status(200).send(pedido)
    return
    
  })
  
  app.get('/pedidos/estado/:estado', async (req, res) => {
    const estado = req.params.estado
    const consulta = qGetPedidos
    let idEstado
    switch (estado) {
      case 'aberto':
        idEstado = 1
        break;
      case 'fechado':
          idEstado = 2
        break;
      default:
        res.status(400).send('estado desconhecido')
        return
    }

    consulta += ` WHERE estado = ${idEstado}`
    
    const pedidos = await db.query(consulta).then( ({rows}) => rows ).catch( e => {
      console.error('falha na consulta', e)
      return []
    })


    if (length(pedidos) <= 0) {
      console.log(`não foram encontrados pedidos no estado '${estado}'`)
      res.status(404).send(pedidos)
      return  
    }
    
    console.log(`${length(pedidos)} foram encontrados no estado '${estado}'`)
    res.status(200).send(pedidos)
    return
    
  })

  app.get('/pedidos/cliente/:id', async (req, res) => {
    const id = req.params.id
    const consulta = qGetPedidos
    
    if(isNaN(id) || id <= 0) {
      res.status(400)
      res.send("ID inválido")
      return
    }

    console.log(`buscar todos os pedidos do cliente de id ${id}`)

    consulta += ` WHERE id_cliente = ${id}`
    const pedidos = await db.query(consulta).then( ({rows}) => rows).catch( e => {
      console.error('falha ao realizar a consulta',e)
      return []
    })

    let n = length(pedidos)
    if (n <= 0) {
      res.status(404).send("nenhum pedido encontrado")
      return
    }

    console.log(`${n} pedidos foram encontrados para o cliente`)
    
    res.status(200).send(pedidos)
    return

  });

  app.post('/pedidos', async (req, res) => {
    const pedido = req.body

    const pedidoJaCadastrado = pedido.id_pedido ? true : false
    // o pedido já está cadastrado(possui id)? 
    if (pedidoJaCadastrado) {
      console.log('pedido informado possui um id')
      console.log('retornando 400')
      res.status(400).send('pedido informado possui id_pedido')
      return
    }

    // cliente foi informado(possui id)?
    if (pedido.cliente) {
      if(!pedido.cliente.id_cliente) {
        console.log('não foi informado id_cliente do pedido')
        res.status('400').send('não foi informado id_cliente')
        return
      }
    }

    // possui pelo menos um item no pedido?
    const qtdItens = pedido.itens.length

    if (qtdItens) {
      console.log('nenhum item foi informado no pedido')
      res.send(400).send('nenhum item informado no pedido')
      return
    }
    console.log(`${qtdItens} itens foram informados no pedido`)
    
    // if(!pedidoService.validarItemPedido())
    
    let subtotal = 0
    if(pedido.desconto && !isNaN(pedido.desconto)) {
      console.log('aplicando desconto no valor de', pedido.desconto)
      subtotal = (parseFloat(pedido.desconto)*(-1))
      console.log('valor do subtotal:', subtotal)
    }
    
    // possui informação de pagamento?

    
    // salva
    res.status(201).send(await pedidoService.cadastrarPedido(pedido))
  })
  
  app.patch('/pedidos/:id', async (req, res) => {

    const idPedido = req.params.id
    
    const data = new Date().toLocaleDateString('en-us', {year: 'numeric', month:'numeric', day:'numeric',hour:'numeric', minute:'numeric', second:'numeric'})
    const consulta = sqlgen.update('dg.tb_pedido',{id_pedido: idPedido}, {id_estado: 2, hora_fechamento: data})

    const fechou = db.query(consulta.sql, consulta.values)
    .then( (r) => {
      return true
    })
    .catch( e => {
      console.error(`falha ao fechar pedido. ${e}`)
      return false
    })
    
    if (!fechou) {
      res.status(500).send('não foi possivel fechar pedido')
      return  
    }
    
    res.status(202).send('pedido fechado com sucesso')
    return
  })
}

const qGetPedidos = {
  name: 'get-pedidos',
  text: sqlgen.select('db.tb_pedido','*')
}
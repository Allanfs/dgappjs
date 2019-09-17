const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();


module.exports = function (db) {
  return {
    validarItemPedido(itemPedido) {
      if (itemPedido === null || itemPedido === undefined){
        return false
      }
      if(!itemPedido.produto || !itemPedido.produto.id_produto){
        return false
      }
  
      if(!itemPedido.quantidade || itemPedido.quantidade <= 0){
        return false
      }
      
      if (itemPedido.pizza){
        if(!itemPedido.sabores || itemPedido.sabores.length === 0) {
          return false
        }
  
        if(!itemPedido.tamanho || !itemPedido.tamanho.id_tamanho){
          return false
        }
  
        const qtdSabores = itemPedido.sabores.length
        const qtdMax = itemPedido.tamanho.numero_max_sabores
        if(qtdSabores > qtdMax) {
          console.log(qtdSabores,"sabores foram informados, o máximo para esse tamanho é", qtdMax)
          return false
        }
  
      }
  
      return true
    },

    async cadastrarPedido(pedido){
      let idPedido

      await db.query('BEGIN')

      let consulta = sqlgen.insert('dg.tb_pedido',{
        id_estado: 1,
        id_cliente: pedido.cliente.id_cliente,
        forma_pagamento: pedido.forma_pagamento,
        valor_pago: pedido.valor_pago,
        total: pedido.total
        })
      
      let query = consulta.sql + ` RETURNING id_pedido`
        
      idPedido = await db.query(query,consulta.values)
      .then( ({rows}) => rows[0].id_pedido)
      .catch(e => {
        console.error('falha ao cadastrar pedido', e)
        return undefined
      })
      
      if (!idPedido) {
        await db.query('ROLLBACK')
        return null
      }

      for (let i = 0; i < pedido.itens.length; i++) {
        const item = pedido.itens[i];
        
        if (item.pizza) {
          console.log(`${i+1}º item informado é uma pizza`)
          consulta = sqlgen.insert('dg.tb_item_pedido',{
            quantidade: item.quantidade,
            pizza: item.pizza,
            id_produto: item.produto.id_produto,
            id_tamanho: item.tamanho.id_tamanho,
            id_pedido: idPedido
          })

        }else {
          console.log(`${i+1}º item informado é um produto`)
          consulta = sqlgen.insert('dg.tb_item_pedido',{
            quantidade: item.quantidade,
            pizza: item.pizza,
            id_produto: item.produto.id_produto,
            id_pedido: idPedido
          })
        }
        
        let query = consulta.sql + ` RETURNING id_item_pedido`
        
        let idItemPedido = await db.query(query, consulta.values)
        .then( ({rows}) => rows[0].id_item_pedido)
        .catch( e => {
          console.error(`falha ao cadastrar o ${i+1}º item,${e}` )
          return false
        })
        
        if(!idItemPedido){
          db.query('ROLLBACK')
          return null
        }

        if(item.pizza){
          for (let j = 0; j < item.sabores.length; j++) {
            console.log(`cadastrar ${j+1}º sabor do ${i+1}º item`)
            const sabor = item.sabores[j];
            let saborConsulta = sqlgen.insert('dg.tb_item_sabor_pedido',{
              id_sabor: sabor.id_sabor,
              id_item_pedido: idItemPedido
            })
  
            const inseriu = await db.query(saborConsulta.sql, saborConsulta.values)
            .then( s => {
              console.log(`sabor inserido`)
              return true
            })
            .catch( e => {
              console.error(`falha ao cadastrar o ${j+1}º sabor. ${e}`)
              return false
            })
  
            if (!inseriu) {
              await db.query('ROLLBACK')
              return null
            }
          }
        }
        

      }
      
      await db.query('COMMIT')
      
      return this.buscarPedidoCompletoPorID(idPedido)
    },

    async buscarPedidoCompletoPorID(id){

      const stmt = sqlgen.select('dg.tb_pedido', '*', {id_pedido: id})
      
      return await db.query(stmt.sql, stmt.values).then( ({rows}) => rows[0])
    }

  }
  
}
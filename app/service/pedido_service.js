const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();

module.exports = function(db) {
  return {
    async calcularValorItemPedido({ tamanho, sabores, produto, quantidade }) {
      let valor = 0;
      if (tamanho && sabores) {
        console.info('tamanho e sabores foram informados');
        const saboresEspeciais = sabores.filter((sabor) => sabor.especial);

        if (saboresEspeciais.length > 0) {
          console.info('utilizando sabores especiais');
          saboresParaVerificar = saboresEspeciais;
        } else {
          console.info('utilizando sabores tradicionais');
          saboresParaVerificar = sabores;
        }

        const maiorPreco = await this.buscarMaiorPreco(
          tamanho.id_tamanho,
          saboresParaVerificar
        );

        if (!maiorPreco) {
          console.error(`falha ao encontrar o preço para o item`);
          return 0;
        }

        valor = maiorPreco;
      } else {
        console.info('produto normal informado');
        valor = await db
          .query(
            `select preco::numeric::float8 from dg.tb_produto where id_produto = $1`,
            [produto.id_produto]
          )
          .then(({ rows }) => rows[0].preco);
      }

      return parseFloat(valor);
    },

    validarItemPedido(itemPedido) {
      if (!itemPedido) {
        console.log('item pedido não foi informado');
        return false;
      }
      if (!itemPedido.produto || !itemPedido.produto.id_produto) {
        console.log('nenhum produto foi informao');
        return false;
      }

      if (!itemPedido.quantidade || itemPedido.quantidade <= 0) {
        console.log('quantidade inválida informada');
        return false;
      }

      if (itemPedido.pizza) {
        if (!itemPedido.sabores || itemPedido.sabores.length === 0) {
          console.log('sabores da pizza não foram informados');
          return false;
        }

        if (!itemPedido.tamanho || !itemPedido.tamanho.id_tamanho) {
          console.log('tamanho da pizza não foi informado');
          return false;
        }

        const qtdSabores = itemPedido.sabores.length;
        const qtdMax = itemPedido.tamanho.numero_max_sabores;
        if (!qtdMax) {
          console.log('informações incompletas');
          return false;
        }
        console.log('quantidade max de sabores no tamanho:', qtdMax);
        if (qtdSabores > qtdMax) {
          console.log(
            qtdSabores,
            'sabores foram informados, o máximo para esse tamanho é',
            qtdMax
          );
          return false;
        }
      }
      console.log('item valido');

      return true;
    },

    async cadastrarPedido(pedido) {
      let idPedido;

      await db.query('BEGIN');

      let consulta = sqlgen.insert('dg.tb_pedido', {
        id_estado: 1,
        id_cliente: pedido.cliente.id_cliente,
        forma_pagamento: pedido.forma_pagamento,
        valor_pago: pedido.valor_pago,
        valor_desconto: pedido.valor_desconto,
        subtotal: pedido.subtotal
      });

      let query = consulta.sql + ` RETURNING id_pedido`;

      // insere na tabela pedido
      idPedido = await db
        .query(query, consulta.values)
        .then(({ rows }) => rows[0].id_pedido)
        .catch((e) => {
          db.query('ROLLBACK');
          console.error('falha ao cadastrar pedido', e);
          throw 'falha ao cadastrar pedido';
        });

      for (let i = 0; i < pedido.itens.length; i++) {
        const item = pedido.itens[i];

        if (item.pizza) {
          consulta = sqlgen.insert('dg.tb_item_pedido', {
            quantidade: item.quantidade,
            pizza: item.pizza,
            id_produto: item.produto.id_produto,
            id_tamanho: item.tamanho.id_tamanho,
            id_pedido: idPedido,
            valor: item.valor
          });
        } else {
          consulta = sqlgen.insert('dg.tb_item_pedido', {
            quantidade: item.quantidade,
            pizza: item.pizza,
            id_produto: item.produto.id_produto,
            id_pedido: idPedido
          });
        }

        let query = consulta.sql + ` RETURNING id_item_pedido`;

        // insere na tabela item_pedido
        let idItemPedido = await db
          .query(query, consulta.values)
          .then(({ rows }) => rows[0].id_item_pedido)
          .catch((e) => {
            db.query('ROLLBACK');
            console.error(`falha ao cadastrar o ${i + 1}º item,${e}`);
            throw 'falha ao cadastrar item do pedido';
          });

        // cadastra os sabores do item pizza
        if (item.pizza) {
          let q = `insert into dg.tb_item_sabor_pedido (id_sabor, id_item_pedido) values`;
          const tamanho = item.sabores.length;
          let i = 0;
          do {
            let sabor = item.sabores[i];
            let q1 = `(${sabor.id_sabor}, ${idItemPedido})`;

            if (i === 0) {
              q += ` ${q1}`;
            } else {
              q = `${q}, ${q1}`;
            }

            i++;
          } while (i < tamanho);

          const inseriu = await db
            .query(q)
            .then((s) => {
              console.log(`sabores inseridos`);
              return true;
            })
            .catch((e) => {
              db.query('ROLLBACK');
              console.error(`falha ao cadastrar os sabores. ${e}`);
              throw 'falha ao cadastrar sabor';
            });
        }
      }

      await db.query('COMMIT');

      return this.buscarPedidoCompletoPorID(idPedido);
    },

    async buscarPedidoCompletoPorID(id) {
      const stmt = sqlgen.select('dg.tb_pedido', '*', { id_pedido: id });

      return await db.query(stmt.sql, stmt.values).then(({ rows }) => rows[0]);
    },

    async buscarPrecoDoTamanhoESabor(idTamanho, idSabor) {
      const consulta = sqlgen.select('dg.tb_sabor_preco_tamanho', ['preco'], {
        id_tamanho: idTamanho,
        id_sabor: idSabor
      });

      return db
        .query(consulta.sql, consulta.values)
        .then(({ rows }) => parseFloat(rows.preco))
        .catch((e) => {
          console.error(
            `falha na consulta do preço do sabor no tamanho. Erro: ${e}\nconsulta: ${consulta}`
          );
          return null;
        });
    },

    async buscarMaiorPreco(idTamanho, sabores) {
      let ids = new Array();
      for (let i = 0; i < sabores.length; i++) {
        const sabor = sabores[i];
        ids.push(sabor.id_sabor);
      }

      const consulta = sqlgen.select(
        'dg.tb_sabor_preco_tamanho',
        ['MAX(preco)::numeric::float8'],
        { id_tamanho: idTamanho, id_sabor: { IN: ids } }
      );

      return db
        .query(consulta.sql, consulta.values)
        .then(({ rows }) => rows[0].max)
        .catch((e) => {
          console.error(`falha ao realizar consulta dos preços. Erro: ${e}`);
          return null;
        });
    }
  };
};

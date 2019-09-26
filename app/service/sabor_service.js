const service = require('./recheio_service');
const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();
const logger = require('../../config/logger');

module.exports = function(db) {
  return {
    tb: `dg.tb_sabor`,
    recheioService: service(db),

    async obterTodos() {
      let sabores;
      let saboresRetorno = new Array();
      try {
        sabores = await db
          .query(
            `select ts.id_sabor, ts.nome as "nome_sabor", r.id_recheio, r.nome as "nome_recheio", sor.posicao from dg.tb_sabor ts
          join dg.tb_sabor_ordem_recheio sor on (sor.id_sabor = ts.id_sabor)
          join dg.tb_recheio r on (sor.id_recheio = r.id_recheio) order by ts.id_sabor, sor.posicao`
          )
          .then(({ rows }) => rows)
          .catch((e) => {
            console.error(`falha ao obter todos os sabores. ${e}`);
            return null;
          });
      } catch (erro) {
        console.error(`exceção lançada ao obter os sabores. ${erro}`);
        sabores = null;
      }
      logger.info(`buscar os recheios dos sabores...`);

      let saborAnterior;
      let recheios = new Array();

      for (let i = 0; i < sabores.length; i++) {
        const sabor = sabores[i];

        if (saborAnterior) {
          if (sabor.id_sabor !== saborAnterior.id_sabor) {
            let tmp = {
              id_sabor: saborAnterior.id_sabor,
              nome: saborAnterior.nome_sabor,
              recheios
            };
            saboresRetorno.push(tmp);

            recheios = [];
          }
        }
        guardarSabor(recheios, sabor);
        saborAnterior = sabor;
      }

      // return saboresRetorno;
      /*** RESOLVE OS PREÇOS DOS TAMANHO ***/
      let precosTamanhos;
      try {
        precosTamanhos = await db
          .query(
            `select s.id_sabor, s.nome as nome_sabor, t.id_tamanho, t.nome as nome_tamanho, spt.preco::numeric from dg.tb_sabor_preco_tamanho spt
              join dg.tb_sabor s on (spt.id_sabor=s.id_sabor)
              join dg.tb_tamanho t on (spt.id_tamanho=t.id_tamanho) order by s.id_sabor, id_tamanho`
          )
          .then(({ rows }) => rows)
          .catch((e) => {
            console.error(`falha ao obter todos os precos. ${e}`);
            return null;
          });
      } catch (erro) {
        console.error(`exceção lançada ao obter os precos. ${erro}`);
        precosTamanhos = null;
      }

      let precoAnterior;
      let arrayPrecos = new Array();
      for (let i = 0; i < precosTamanhos.length; i++) {
        const precoTamanho = precosTamanhos[i];
        if (precoAnterior) {
          if (precoTamanho.id_sabor !== precoAnterior.id_sabor) {
            let tmp = {
              tamanho: {
                id_tamanho: precoAnterior.id_tamanho,
                nome: precoAnterior.nome_tamanho
              },
              preco: precoAnterior.preco
            };

            arrayPrecos.push(tmp);
            saboresRetorno[precoAnterior.id_sabor - 1].precos = arrayPrecos;
            arrayPrecos = [];
          }
        }

        arrayPrecos.push({
          tamanho: {
            id_tamanho: precoTamanho.id_tamanho,
            nome: precoTamanho.nome_tamanho
          },
          preco: precoTamanho.preco
        });
        precoAnterior = precoTamanho;
      }
      return saboresRetorno;
    },

    async obterSaborPorId(id) {
      let sabor;

      // obtem apenas as informações do sabor
      // não retorna os recheios do sabor
      sabor = await db
        .query(`SELECT * FROM ${this.tb} WHERE id_sabor = $1`, [id])
        .then(({ rows }) => rows[0])
        .catch((e) => {
          console.error(`falha ao obter sabor de id ${id}. ${e}`);
          return null;
        });

      if (!sabor) {
        throw `sabor não encontrado`;
      }

      return sabor;
    },

    async obterRecheiosDosSabores() {
      // não finalizado
      let retorno;
      let consulta = `select s.id_sabor, s.nome as snome, r.nome as rnome, sor.posicao from dg.tb_sabor_ordem_recheio sor
      join dg.tb_sabor s on (s.id_sabor = sor.id_sabor)
      join dg.tb_recheio r on (r.id_recheio = sor.id_recheio)`;

      let registros = await db
        .query(consulta)
        .then(({ rows }) => rows)
        .cathc((e) => {
          logger.error(`falha ao consultar recheios do sabor`);
          logger.debug(e);
          return null;
        });

      return registros;
    },
    async buscarRecheiosDoSabor(id) {
      // let consulta = `select s.id_sabor, s.nome as snome, r.nome as rnome, sor.posicao from dg.tb_sabor_ordem_recheio sor
      // join dg.tb_sabor s on (s.id_sabor = sor.id_sabor)
      // join dg.tb_recheio r on (r.id_recheio = sor.id_recheio)`;

      const consulta = sqlgen.select(`dg.tb_sabor_ordem_recheio`, '*', {
        id_sabor: id
      });

      return await db
        .query(consulta.sql, consulta.values)
        .then(({ rows }) => rows)
        .catch((e) => {
          logger.error(`falha ao consultar recheios do sabor`);
          logger.debug(e);
          return null;
        });
    }
  };
};

function guardarSabor(array, sabor) {
  array.push({
    id_recheio: sabor.id_recheio,
    nome: sabor.nome_recheio,
    posicao: sabor.posicao
  });
}

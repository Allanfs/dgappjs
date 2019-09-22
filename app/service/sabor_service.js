module.exports = function(db) {
  return {
    tb: `dg.tb_sabor`,

    async obterTodos() {
      let sabores;
      try {
        sabores = db
          .query(`SELECT * FROM ${this.tb}`)
          .then(({ rows }) => rows)
          .catch((e) => {
            console.error(`falha ao obter todos os sabores. ${e}`);
            return null;
          });
      } catch (erro) {
        console.error(`exceção lançada ao obter os sabores. ${erro}`);
        sabores = null;
      }

      return sabores;
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
    }
  };
};

const SqlGenerator = require('sql-generator');
const sqlgen = new SqlGenerator();

const tb = `dg.tb_cliente`;
module.exports = function(db) {
  return {
    async buscarPorTelefone(telefone) {
      const consulta = `SELECT * FROM ${tb} c JOIN dg.tb_telefone t ON (t.id_cliente = c.id_cliente) WHERE t.numero = $1`;

      let retorno = await db.query(consulta, [telefone]);

      if (retorno.rowCount === 0) {
        return null;
      }
      return retorno.rows[0];
    },

    async buscarPorCpf(cpf) {
      const consulta = `SELECT * FROM ${tb} WHERE cpf = $1`;
      let retorno = await db.query(consulta, [cpf]);

      if (retorno.rowCount === 0) {
        return null;
      }
      return retorno.rows[0];
    },

    async cadastrarCliente(cliente) {
      const consulta = sqlgen.insert('dg.tb_cliente', {
        nome: '$1',
        cpf: '$2',
        instagram: '$3',
        email: '$4',
        data_nascimento: '$5::DATE'
      }).sql;

      let dados = [
        cliente.nome,
        cliente.cpf,
        cliente.instagram,
        cliente.email,
        cliente.data_nascimento
      ];

      let clienteCadastrado;
      await db
        .query(consulta + ` RETURNING *`, dados)
        .then(({ rows }) => (clienteCadastrado = rows[0]))
        .catch((e) => {
          console.error(`falha ao cadastrar cliente ${e}`);
          throw 'falha ao cadastrar cliente';
        });

      return clienteCadastrado;
    },

    async buscarTelefoneDoCliente(id) {
      const consulta = `SELECT * FROM db.tb_telefone WHERE id_cliente = $1`;
      let retorne = db
        .query(consulta, [id])
        .then(({ rows }) => {
          console.log(`encontrado [${id}]`);
          return rows[0];
        })
        .catch((e) => {
          console.error(`falha ao encontrar telefone [${id}] ${e}`);
          return null;
        });
      return retorne;
    },
    async buscarEnderecoDoCliente(id) {
      const consulta = `SELECT * FROM db.tb_endereco WHERE id_cliente = $1`;
      let retorne = db
        .query(consulta, [id])
        .then(({ rows }) => {
          console.log(`encontrado [${id}]`);
          return rows[0];
        })
        .catch((e) => {
          console.error(`falha ao encontrar endereço [${id}] ${e}`);
          return null;
        });
      return retorne;
    }
  };
};

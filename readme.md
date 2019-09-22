## NodeJs API for a pizzaria store

## Pedidos

- buscar todos os pedidos cadastrados

  `GET http://localhost:8081/pedidos`

Retorno: 200 - [pedido]

---

- buscar pedido com id

  `GET http://localhost:8081/pedidos/:id`

  Retorno: 200 - [pedido]

---

- buscar pedido com estado

  `GET http://localhost:8081/pedidos/estado/:estado`

  Ex: `GET http://localhost:8081/pedidos/estado/aberto`

  Ex: `GET http://localhost:8081/pedidos/estado/fechado`

## Clientes

- buscar todos os clientes cadastrados

  `GET http://localhost:8081/clientes`

  Retorno: 200 - [cliente]

---

- buscar cliente por telefone
  `GET http://localhost:8081/clientes/telefone/:telefone`

  Ex: `GET http://localhost:8081/clientes/telefone/996185444`

  Retorno: 200 - cliente

---

- buscar cliente por cpf

`GET http://localhost:8081/clientes/cpf/:cpf`

Ex: `GET http://localhost:8081/clientes/telefone/01234567890`

Retorno: 200 - cliente

---

- deletar cliente por id

`DELETE http://localhost:8081/clientes/:id`

Ex: `DELETE http://localhost:8081/clientes/20`

Retorno: 200 - ok

---

## Entidades

### Cliente

```
{
  "nome": string
  "id_cliente": int
  "cpf": string
  "instagram": string
  "email": string
  "momento_cadastro": "2019-09-15T19:05:49.014Z",
  "data_nascimento"
  "id_telefone": int
  "ddd": int
  "numero": string
  "whatsapp": bool
  "observacao": string
}
```

### Telefone

```
{
    "ddd": int
    "numero": int
    "whatsapp": bool
    "observacao": string
  }
```

### Endereço

```
{
    "rua": string
    "numero": string
    "complemento": string
    "bairro": string
  }
```

### Pedido

```
{
  "cliente": cliente
  "itens": [item pedido],
  "forma_pagamento": int
  "valor_desconto": int
  "valor_pago": int
}
```

### Item Pedido

```
{
  {
      "quantidade": int
      "pizza": bool
      "sabores": [sabor]
      "tamanho": tamanho
      "produto": produto
    }
}
```

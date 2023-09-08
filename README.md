<p align="center">
  <img src="https://github.com/MarllonCampos/shopper-desafio-tecnico/blob/master/assets/shopper.png?raw=true" alt="Logo" width="150" height="160" />
</p>
<hr >
<h1 align="center"> Shopper </h1>

# Guia de Instalação e Execução

Este guia contém instruções sobre como instalar e executar o código Node.js em sua máquina local.
Certifique-se de seguir as etapas abaixo.

# Requisitos

Certifique-se de ter o seguinte software instalado em seu sistema:

- [Node.js](https://nodejs.org/) (versão LTS recomendada)  (Versão utilizada: 18.16.0 )
- [Git](https://git-scm.com/)

# Configuração das Variáveis de Ambiente

 O projeto usa variáveis de ambiente para configurar informações sensíveis, como credenciais de banco de dados.
 Você deve criar um arquivo `.env` na pasta `backend` do projeto com as seguintes informações:

```
DB_USER=root
DB_PASS=root
DB_NAME=shopper
DB_PORT=3306
DB_HOST=localhost
```

Substitua os valores acima pelos detalhes da sua configuração de banco de dados, se necessário, LEMBRANDO (O SISTEMA FOI CONFIGURADO PARA RODAR COM MYSQL versão 8).


## Instalação

1. Clone este repositório em sua máquina local usando o Git:

   ```bash
   git clone https://github.com/MarllonCampos/shopper-desafio-tecnico.git
   ```

2. Navegue até a pasta principal do projeto:

   ```bash
   cd shopper-desafio-tecnico
   ```

   Certifique-se de estar na pasta que contém as pastas `backend` e `web`.

3. Instale as dependências do projeto em cada subpasta (backend e web) executando o seguinte comando em cada pasta:

   ```bash
   cd backend
   npm install
   ```

   ```bash
   cd ../web
   npm install
   ```

## Execução

Agora que você instalou as dependências, pode iniciar o servidor do backend e a aplicação web.

### Backend

1. Dentro da pasta `backend`, execute o seguinte comando para iniciar o servidor:

   ```bash
   npm run dev
   ```

   O servidor backend estará em execução em http://localhost:3333.

### Aplicação Web

1. Dentro da pasta `web`, execute o seguinte comando para iniciar a aplicação web:

   ```bash
   npm run dev
   ```

   A aplicação web estará em execução em http://localhost:5173.

Agora você pode acessar a aplicação web no seu navegador em http://localhost:5173 e interagir com o sistema.

FilmAPI

Descrição

Esta API permite pesquisar filmes, obter detalhes e exibir informações como sinopse, data de lançamento, trailer e avaliação dos filmes.

Tecnologias Utilizadas

Node.js

Express.js

The Movie Database (TMDb) API
(OMDb) API

Docker

Supabase

Instalação

Clone este repositório:

git clone https://github.com/dinisanto/FilmAPI.git

Navegue até a pasta do projeto:

cd backend

Instale as dependências:

npm install

Execução do Servidor

Para iniciar o servidor, utilize:

npm start

O servidor será executado em http://localhost:5500 por padrão.

Endpoints Disponíveis

1. Buscar Filme por Título

Rota: GET /get_film/:title

Descrição: Retorna uma lista de filmes com base no título pesquisado.

Exemplo de Requisição:

GET http://localhost:5500/get_film/Mufasa

Resposta Exemplo:

{
  "movies": [
    {
      "id_filme": "762509",
      "title": "Mufasa: O Rei Leão",
      "plot": "Mufasa, um filhote órfão, perdido e sozinho, conhece um simpático leão chamado Taka...",
      "trailer": "https://www.youtube.com/watch?v=kZLiyV8xOWM",
      "image": "https://image.tmdb.org/t/p/w500/1pTQrPsNl1TCkgjQUz97M6UMY1u.jpg",
      "background": "https://image.tmdb.org/t/p/w1280/oHPoF0Gzu8xwK4CtdXDaWdcuZxZ.jpg",
      "release_date": "2024-12-18",
      "vote_average": 7.43
    }
  ],
  "message": "1 filme(s) encontrado(s)."
}

Erros Comuns

Erro 404: Filme não encontrado. Isso pode ocorrer se o título informado não existir na API do TMDb.

Erro 500: Problema interno no servidor. Verifique se a API do TMDb está respondendo corretamente.




# RecBlog

I started this project as a way to make myself more familiar with the backend side of Full Stack using Nestjs, Postgres and TypeORM. Later on _(currently)_ this has become my Final Year Project for BCA.

The frontend part of this project can be found in [this repository](https://github.com/rsresta07/kathanika-blog-frontend).

There may be a lot of things I have made mistake and a lot of things that I may be able to improve. I will leave it to future [Rameshwor](https://github.com/rsresta07).

## Documentation

RecBlog uses Nestjs a framework of Nodejs to serve as a backend. Postgres has been used as database and TypeORM for the query.

There are main four parts in this project User, Admin, Posts, and Tags. Likewise three main tables in database `user`, `post` and `tags`. As many-to-many relationship has been used to relate these tables. there are pivot tables as well.

The user authentication is based on roles and the Admin is called `SUPER_ADMIN`.

## Algorithm

### Content-Based Recommendation

This system uses **content-based filtering** to recommend blog posts based on user preferences.

Each post and user is represented as a vector of tags. Instead of flat binary values, tag weights are computed using **Inverse Tag Frequency (ITF)**:

$`` \text{weight} = \dfrac{1}{\log(1 + f)} ``$

This ensures that rarer tags contribute more to the similarity calculation.

To compare user and post vectors, we use **cosine similarity**:

$``\text{similarity} = \dfrac{\vec{A} \cdot \vec{B}}{||\vec{A}|| \times ||\vec{B}||}``$

Final Formula will look something like this:

$``\text{similarity} = \dfrac{\sum_{i=1}^{n} \left( \dfrac{A_i}{\log(1 + f_i)} \cdot \dfrac{B_i}{\log(1 + f_i)} \right)}{\left\| \dfrac{\vec{A}}{\log(1 + \vec{f})} \right\| \cdot \left\| \dfrac{\vec{B}}{\log(1 + \vec{f})} \right\|}``$

Only posts above a certain threshold are returned as recommendations. Currently that is `0.33`.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```bash
DATABASE_TYPE = postgres
DATABASE_HOST = <user_hostname>
DATABASE_PORT = <user_port_number>
DATABASE_NAME = <your_database_name>
DATABASE_USER = <user_postgres_username>
DATABASE_PASSWORD = <user_postgres_password>
APP_PORT = 8080
APP_ENV = <env>
DATABASE_SYNCHRONIZE = false
JWT_SECRET = secret_key

RECOMMENDATION_SIMILARITY_THRESHOLD = 0.33
RECOMMENDATION_MIN_RESULTS = 100
```

## Project Setup

```bash
# install dependencies
$ yarn install
```

## Run Locally

Clone the project

```bash
# development
$ yarn run start

# watch mode
$ yarn dev

# production mode
$ yarn run start:prod
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

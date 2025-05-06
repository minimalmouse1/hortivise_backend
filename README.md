# Hortivise Payment Module Apis

## Description

Hortivise Payment Module API's is developed with Adonisjs and mysql.

# Environments

```
1. Production

==> Branch Name: main

2. Development

==> Branch Name: develop
```

## How to Install

1. Clone repository

   ```
   git clone https://github.com/minimalmouse1/hortivise_backend.git

   cd hortivise_backend

   yarn install

   ```

2. Create a new `.env` file for the backend and generate a new `APP_KEY`. Copy the output and paste it into the `.env` file at the end of the line for `APP_KEY`.

   ```bash

   cp .env.example .env

   node ace generate:key #Generates new APP_KEY

   ```

3. Within the `.env` file, configure the MYSQL\* variables to suit your environment setup.

4. `start development` server.

   ```bash

   yarn dev

   ```

5. `create build for production` server.

   ```bash

      yarn build

   ```

6. You won't be able to `login` because there are no users. So, it is time to seed the database.

7. To prepare (seed) the database with mock data:

   1. First, let's migrate the database.

      ```bash

      node ace migration:run

      ```

   2. Next, Let's seed important tables on the database. Run the index seeder command below to run all configured seeders for the application and fully setup it up in one command:

      ```bash

         node ace db:seed

      ```

      Please note that this operation could take a couple of minutes.

8. Get an email and password of a user and log in.

   ```bash

   email: admin@hortivise.com
   password: 123456

   ```

9. Congratulations. You have successfully set up the hortivise_backend.

# Resources

## Languages & tools

- [Yarn](https://yarnpkg.com/)

- [Typescript](https://www.typescriptlang.org/)

- [Node](http://nodejs.org/)

- [Adonisjs](https://adonisjs.com/)

- [MySQL](https://www.mysql.com/)

- [git](https://git-scm.com/)

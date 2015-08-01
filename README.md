# shiva

![Shiva](http://fc04.deviantart.net/fs71/i/2012/166/e/c/lord_shiva_by_satishverma-d53fzrp.jpg)

## The Runnable god of EC2 creation and destruction.

Shiva is responsible for managing EC2 instances for Runnable's single-tenant build and run clusters (the realm of Acheron). Her primary responsibilities are:

1. To create build and run cluster instances on EC2 via [Amazon Machine Images](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html)
2. To destroy unused build and run cluster images when instructed to do so.

While she currently hold dominon over EC2, ultimately she will transcend and become provider independent. Her internal workings reflect this.

## Development

Shiva is designed to be developed against locally. In this section we will cover
how to setup your workstation to get a development server and tests running.

#### Setup: Postgresql

The first step is to install postgres. From the command-line (on Mac OSX) run
the following:

1. `brew install postgresql` - Installs postgresql locally
2. `initdb /usr/local/var/postgres -E utf8` - Initializes a postgres cluster
3. `ln -sfv /usr/local/opt/postgresql/*.plist ~/Library/LaunchAgents` -
   instruct OSX to automatically launch postgres on login.
4. `launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql`  -
   start postgres on your computer.

Once you have installed postgres you'll need to run the following from the
shiva project repository directory:

1. `npm run db`

This script initializes two users and databases on your machine: `shiva` (used
for local development) and `shiva-test` (used by the test suite).

#### Setup: Run Migrations

Shiva uses [knex](https://www.npmjs.com/package/knex) to access the postgres
database. The first thing you'll need to do after installing postgres is to
run the knex migrations to create the database schema. From the shiva project
repository directory run the following:

1. `npm install` - Install required libraries (including `knex`)
2. `knex migrate:latest` - Update your development database schema to the latest
   version.

Note: as a first step the test database (`shiva-test`) is automatically migrated
to the latest schema.

#### Creating Migrations

The infrastructure data model may change over time due to new constraints. When
the schema needs to change you'll have to write your own migrations in order to
update the database. While a full treatment of how to write db migrations is
outside the scope of this document, we will cover the basic commands you'll need
to know in order to do so.

Here is a list of the relevant commands:

* `knex migrate:latest` - Update the database schema to the latest migration.
* `knex migrate:rollback` - Rolls the last migration back to the previous state.
* `knex migrate:make <name>` - Creates a new migration with the given name in
  the `migrations/` directory in the project repository.

The database environment affected is chosen by setting the `NODE_ENV`
environment variable. By default the development database is changed, here are
the other options for `NODE_ENV`:

* `test` - Apply migration changes to the test database
* `production` - Apply migration changes to the production database

Note that the `production` environment is not available when developing.

For more information on how to build migrations, take a look at the source code
for the existing migrations in the `migrations/` directory and read the
[knex schema documentation](http://knexjs.org/#Schema).


##### Run migrations

`knex migrate:latest`

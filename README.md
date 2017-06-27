# astral

![astral](http://img07.deviantart.net/952a/i/2013/113/6/d/space_frontier__astral_winds_by_nathanblackwolf-d62ta2p.jpg)

## The realm of EC2 Auto-scaling and Provisioning

Astral is the master project for all customer organization dock auto-scaling in
EC2. The master project is split into three sub-components:

1. **Shiva** (`lib/shiva/`) - Interface to EC2 for managing auto-scale groups, dock instances,
   etc.

Each of the sub-projects are implemented as independent worker servers that each
handle their own responsibilities. They each use a common data model (posgresql
database) and share common models and utility libraries (located at `common/`).

## Architecture
TODO: Describe overall astral architecture and provide a diagram.

#### Queue Names
* `{project}-[{sub-scopes}-]+{action}`
TODO: Flesh out queue naming conventions.

## Development

Astral is designed to be developed against locally. In this section we will cover
how to setup your workstation to get a development server and tests running.

### Pull Requests
Astral is a foundational piece of our overall architecture. If we are unable to
provision clusters for our customers, they will not be able to use our service.
Since it is so important there are a few hard rules on what can and cannot be
merged into master.

Before a pull request can be merged the following conditions must be met (so as
to mitigate problems in production):

1. All new code should follow the task/worker architecture
2. All functions should be heavily unit tested (every path should be tested)
3. Functional tests should be written for cross-module compatibility
4. The project should have 100% code coverage and tests should pass on circle
5. Project should be integration tested locally (`npm run integration`)
6. Project should be perf and integration tested on `production-beta`

Once these steps have been followed, the PR should be merged and master should
be deployed on production ASAP.

### Setup

#### Postgresql

The first step is to install postgres. From the command-line (on Mac OSX) run
the following:

1. `brew install postgresql` - Installs postgresql locally
2. `initdb /usr/local/var/postgres -E utf8` - Initializes a postgres cluster
3. `ln -sfv /usr/local/opt/postgresql/*.plist ~/Library/LaunchAgents` -
   instruct OSX to automatically launch postgres on login.
4. `launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist`  -
   start postgres on your computer.

Once you have installed postgres you'll need to run the following from the
astral project repository directory:

1. `npm run init-db`

This script creates a super user named `astral` and two databases on your machine:
`astral` (used for local development) and `astral-test` (used by the test suite).

#### Running Migrations

Astral uses [knex](https://www.npmjs.com/package/knex) to access the postgresql
database. The first thing you'll need to do after installing postgres is to
run the knex migrations to create the database schema. From the astral project
repository directory run the following:

1. `npm install` - Install required libraries
2. `npm run migrate` - Migrates the test and local development databases.

#### RabbitMQ
In order to fully test the codebase you will need to install RabbitMQ locally
on your machine. Run the following commands to do so:

* `brew update`
* `brew install rabbitmq`

Once installed, brew should instruct you on how to ensure that RabbitMQ is
launched at reboot and login. Copy the commands from the brew output and execute
them on your machine.

For more information see:
[RabbitMQ Homebrew Install Instructions](https://www.rabbitmq.com/install-homebrew.html)

### Creating Migrations

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

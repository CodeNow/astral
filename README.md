# shiva

![Shiva](http://fc04.deviantart.net/fs71/i/2012/166/e/c/lord_shiva_by_satishverma-d53fzrp.jpg)

## The Runnable god of instance creation and destruction.

Shiva is responsible for managing instances for Runnable's single-tenant build and run clusters (the realm of Acheron). Her primary responsibilities are:

1. To create build and run cluster instances on EC2 via [Amazon Machine Images](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html)
2. To destroy unused build and run cluster images when instructed to do so.

While she currently only holds dominon over EC2, shiva will ultimately transcend AWS and become provider independent.

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
4. `launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist`  -
   start postgres on your computer.

Once you have installed postgres you'll need to run the following from the
shiva project repository directory:

1. `npm run init-db`

This script a super user named `shiva` and two databases on your machine:
`shiva` (used for local development) and `shiva-test` (used by the test suite).

#### Setup: Running Migrations

Shiva uses [knex](https://www.npmjs.com/package/knex) to access the postgres
database. The first thing you'll need to do after installing postgres is to
run the knex migrations to create the database schema. From the shiva project
repository directory run the following:

1. `npm install` - Install required libraries (including `knex`)
2. `knex migrate:latest` - Update your development database schema to the latest
   version.
3. `NODE_ENV=test knex migrate:latest` - Update the test database schema.

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

#### Pull Requests
Shiva is a foundational piece of our overall architecture. If we are unable to
provision clusters for our customers, they will not be able to use our service.
Since it is so important there are a few hard rules on what can and cannot be
merged into master.

Before a pull request can be merged the following conditions must be met (so as
to mitigate problems in production):

1. All new code should follow the task/worker architecture
2. All functions should be 100% unit tested (including all execution paths)
3. The project should maintain 100% test coverage
4. Functional tests should be written for cross-module compatibility
5. Project should be integration tested locally (`npm run integration`)
6. Project should be perf and integration tested on production-beta

Once these steps have been followed, the PR should be merged and master should
be deployed on production ASAP.

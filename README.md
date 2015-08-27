# shiva

![Shiva](http://fc04.deviantart.net/fs71/i/2012/166/e/c/lord_shiva_by_satishverma-d53fzrp.jpg)

## The Runnable god of instance creation and destruction.

Shiva is responsible for managing instances for Runnable's single-tenant build and run clusters (the realm of Acheron). Her primary responsibilities are:

1. To create build and run cluster instances on EC2 via [Amazon Machine Images](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html)
2. To destroy unused build and run cluster images when instructed to do so.

While she currently only holds dominon over EC2, shiva will ultimately transcend AWS and become provider independent.

## Architecture
Shiva is a worker server that subscribes to specific RabbitMQ queues and processes
incoming jobs. When performing tasks, workers may enqueue additional jobs that must
be processed.

Below is a diagram that shows how events are propagated within the system (green
are database related, and purple are AWS related):

![Shiva Jobs](https://docs.google.com/drawings/d/1wfmdM1qhnzWSrQ4lvDRPBIGrk5PMNb5omADyGz9j5bg/pub?w=489&h=401)

* `cluster-provision` - Sets an entry in the database for an organization cluster
  then enques a `cluster-instance-provision` job. Example job:  `{ org_id: 1234 }`
* `cluster-instance-provision` - Provisions dock instances for a cluster on EC2 then
  enqueues a `cluster-instance-tag` job and `cluster-instance-wait` job.
  Example job: `{ cluster_id: 1234, type: 'run' }`
* `cluster-instance-tag` - Sets the EC2 instance tags for a newly spawned dock instance.
* `cluster-instance-wait` - Waits for a set of instances to be ready on EC2.
* `cluster-instance-write` - Writes information concerning running instances to the
  infrastructure database.

The rest of this section details how shiva handles jobs.

#### Server Workflow
0. The server is started and subscribes to the relevant queues (see: `lib/server.js` and
  `lib/queue.js`)
1. A job is assigned to the worker server from a particular queue (see: `lib/server.js`)
2. Shiva constructs a new `Worker` instance for the job (see: `lib/worker.js`)
3. The worker selects the appropriate "task handler" function from `lib/tasks/` (each
  handler function has the same name as the queue)
4. The worker attempts to perform the task by running the handler:
  1. On success: the worker acknowledges to RabbitMQ that the job is complete
  2. On failure: the worker retries the task with an exponential back-off (see: `lib/worker.js -- Worker.prototype.run`)
  3. On fatal failure: The worker acknowledges the job complete to
     remove it from the queue (more on this later).

#### Queue Names
The names of the queues used by shiva have been chosen according to the following format.

* `cluster-[{sub-scopes}-]{action}`

Queue names must begin with `cluster-`, this designates that the queue is part of
the infrastructure space (specifically with messages concerning organization cluster
EC2 instance provisioning, tagging, termination, etc.).

The next part of the name `{sub-scopes}-` is an optional portion of the name that
scopes the queue to a specific type of object or group of actions.

The final section, `{action}`, describes the action or task to be performed when
jobs are received on the queue.

For example: **`cluster-instance-tag`** queue means:

1. `cluster-` - It belongs to the infrastructure space surrounding organization
  EC2 clusters.
2. `instance-` - It belongs to a subsection of queues concerning EC2 instances
  in the cluster.
3. `tag` - Its action should tag cluster instances.

Another example: **`cluster-provision`**

1. `cluster-` - It belongs to infrastructure space clustering.
2. `provision` - It should provision a full cluster.

#### Task Handlers
Task handlers are implemented a single function that can be executed by a worker
(behaviorally: *Workers PERFORM Tasks*). A task handler function must return a
`[Promise](https://github.com/petkaantonov/bluebird/blob/master/API.md#core)`, which
either resolves or rejects depending on if the task could be performed.

All tasks handlers live in the `lib/tasks/` directory and have the same name as
the queues to which they are associated. Roughly speaking any given task handler
is implemented in the same way:

1. It is a function that accepts a single argument named `job`
2. It expects the `job` argument to be an object representing the data passed
   along with the message on the given queue. If it is not, the handler returns
   a rejection promise with an instance of `TaskFatalError` (see `lib/errors/task-fatal-error.js`)
3. It validates that the `job` object contains the appropriate information, otherwise
  it returns a rejection promise with an instance of `TaskFatalError`
4. It attempts to perform the task (usually some asynchronous call to an external
  service like AWS or the database)
5. It returns a promise that will resolve when the task has been completed, or
  throw an error if something goes wrong.

There are four possible outcomes for a task handler promise:

1. Resolve - The task has succeeded and the worker should notify the queue that the
   job has been completed.
2. Reject and Retry (`TaskError`) - The task handler encountered an **expected** error
   and the worker should retry.
3. Reject and Retry (`Error`) - The task handler encountered an **unexpected** error
   and the worker should retry.
4. Reject and Fail (`TaskFatalError`) - The task handler encountered a fatal error
   and cannot possibly process the job (this is currently only used if the job is
   malformed and cannot be validated).

## Development

Shiva is designed to be developed against locally. In this section we will cover
how to setup your workstation to get a development server and tests running.

### Pull Requests
Shiva is a foundational piece of our overall architecture. If we are unable to
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
shiva project repository directory:

1. `npm run init-db`

This script a super user named `shiva` and two databases on your machine:
`shiva` (used for local development) and `shiva-test` (used by the test suite).

#### Running Migrations

Shiva uses [knex](https://www.npmjs.com/package/knex) to access the postgres
database. The first thing you'll need to do after installing postgres is to
run the knex migrations to create the database schema. From the shiva project
repository directory run the following:

1. `npm install` - Install required libraries (including `knex`)
2. `knex migrate:latest` - Update your development database schema to the latest
   version.
3. `NODE_ENV=test knex migrate:latest` - Update the test database schema.

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

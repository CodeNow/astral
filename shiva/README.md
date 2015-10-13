# shiva

![Shiva](http://fc04.deviantart.net/fs71/i/2012/166/e/c/lord_shiva_by_satishverma-d53fzrp.jpg)

## The Runnable god of dock creation and destruction.

Shiva is responsible for managing instances for Runnable's single-tenant build and run clusters (the realm of Acheron). Her primary responsibilities are:

1. To create build and run cluster instances on EC2 via [Amazon Machine Images](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html)
2. To destroy unused build and run cluster images when instructed to do so.

## Architecture
![Shiva Architecture](https://docs.google.com/drawings/d/1OdKZtVIi8q51Y13cfhFsrcS8yT2hVefi2yB1ApZNJ-4/pub?w=841&h=416)

Shiva is a worker server that subscribes to specific RabbitMQ queues and spawns
workers to processe incoming jobs. Many shiva servers can run at once processing
jobs, provisioning EC2 instances, and writing information to our infrastructure
database (hosted postgresql on Amazon RDS).

#### Job Propagation
When performing tasks, workers may enqueue additional jobs that must
be processed. Below is a diagram that shows how jobs are propagated within the
system (green are database related, and purple are AWS related):

![Shiva Jobs](https://docs.google.com/drawings/d/1wfmdM1qhnzWSrQ4lvDRPBIGrk5PMNb5omADyGz9j5bg/pub?w=489&h=401)

##### cluster-provision
Sets an entry in the database for an organization cluster then enques a
`cluster-instance-provision` job. Example job:  `{ githubId: '1234' }`.

##### cluster-instance-provision
Provisions a dock instance for a cluster on EC2 then enqueues a
`cluster-instance-tag` job and `cluster-instance-wait` job. Example job:
`{ githubId: '1234', role: 'dock' }`

##### cluster-instance-tag
Sets the EC2 instance tags for a new EC2 dock instance.

##### cluster-instance-wait
Waits for a cluster instance to enter the running state on EC2.

##### cluster-instance-write
Writes information concerning running instances to the infrastructure database.

##### cluster-instance-terminate
Terminates a running cluster instance, then enqueues a `cluster-instance-delete`
job. Example: `{ instanceId: 'i-1233a' }`

##### cluster-instance-delete
Soft deletes (flags) an instance record in the database. Example:
`{ instanceId: 'i-13454b' }`

##### cluster-deprovision
Sets a cluster to the `deprovisioning` state and enqueues jobs to terminate
all cluster instances, and to hard delete all cluster records.
Example: `{ githubId: '234355' }`.

##### cluster-delete
Hard deletes all cluster instances and the cluster from the database.
Example: `{ clusterId: '133-4322-4442-ss'}`


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

#### Task Best Practices
To ensure that the system is robust as possible there are two hard rules that
must be enforced when implementing tasks.

1. Tasks must be idempotent. This means that they should be implemented in
  such a way that if shiva receives the exact same job twice, the task should not
  leave the data model for the system in an inconsistent state. Ideally the task
  should be able to detect this scenario and simply throw the duplicate job away
  if the task has already been performed.
2. Tasks **cannot** write data to more than a single external service. By writing
  tasks in this way we ensure that external data models (such as the database or
  AWS) cannot get into a "half-complete" state (one service works, the other fails,
  thus causing the job as a whole to fail).

This list is bound to grow as we expand and test the system, so keep an eye on
it if you actively work in the infrastructure side of the organization.

## EC2 Dock Instance Provisioning
Shiva provisions EC2 dock instances by calling the AWS `runInstances` action
with the following information:

* `ImageId` - Id of the an AMI in the VPC that should be started on the instance.
* `KeyName` - The SSH key-pair name for the instance
* `SecurityGroupIds` - Ids for the various security groups needed by the instance.
  At this time we include the bastion security group along with the default group.
* `SubnetId` - Id of the subnet upon which the instance should be provisioned.
* `MinCount` - Minimum number of instances to start.
* `MaxCount` - Maximum number of instances to start.
* `InstanceType` - The type of EC2 instance upon which to run the image.
* `InstanceInitiatedShutdownBehavior` - Sets the shutdown behavior for the instance.
* `UserData` - A base64 encoded shell script to run upon instance start.

#### UserData Shell Script
Of particular interest is the `UserData` shell script that is passed to the dock
instance upon instantiation. This script, roughly, looks like this:

```sh
#!/bin/bash

ENV_FILE=/opt/runnable/env
HOST_TAGS_FILE=/opt/runnable/host_tags
DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh

# Set preferred versions of each of the dock services
echo 'export FILIBUSTER_VERSION={{filibuster_version}}' >> $ENV_FILE
echo 'export KRAIN_VERSION={{krain_version}}' >> $ENV_FILE
echo 'export SAURON_VERSION={{sauron_version}}' >> $ENV_FILE
echo 'export IMAGE_BUILDER_VERSION={{image_builder_version}}' >> $ENV_FILE
echo 'export DOCKER_LISTENER_VERSION={{docker_listener_version}}' >> $ENV_FILE

# Set the host tags file (used by upstart for docker-listener)
echo '{{host_tags}}' > $HOST_TAGS_FILE

# Initialize the dock
bash $DOCK_INIT_SCRIPT
```
(see `scripts/aws-instance-user-data.sh`).

Primarily it is responsible for setting the appropriate versions for each of the
dock services to a special file (`/opt/runnable/env`) and the setting of the
host tags to a special file (`/opt/runnable/host_tags`). Finally it executes
the dock initialization script (`/opt/runnable/dock-init/init.sh`).

For more information on dock initialization see the
[CodeNow/dock-init](https://github.com/CodeNow/dock-init) repository.

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

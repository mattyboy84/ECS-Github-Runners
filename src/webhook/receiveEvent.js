const crypto = require('crypto');
const { ECS } = require("@aws-sdk/client-ecs");
const { SecretsManager } = require("@aws-sdk/client-secrets-manager");

const {
  API_SECRET,
  CLUSTER_NAME,
  CLUSTER_SERVICE_NAME,
} = require('../config');

let ecsClient;
let secretClient = undefined;

let secret = undefined;

async function handler(event, context) {
  const { headers, body } = event;
  const headerHash = headers['x-hub-signature-256'].split('=')[1];

  secretClient = secretClient ? secretClient : new SecretsManager({region: 'eu-west-2' });
  if (!secret) {
    const secretResponse = await secretClient.getSecretValue({
      SecretId: API_SECRET,
    });
    secret = secretResponse.SecretString;
  }
  console.log(secret.substring(0,10));

  //console.log(`Hash received in the header: ${headerHash}`);

  const computedHash = crypto.createHmac('sha256', secret).update(body).digest('hex');

  //console.log(`Computed hash: ${computedHash}`);

  if (headerHash !== computedHash) {
    console.log('invalid request received.');
    return {
      statusCode: 401,
      headers: { },
      body: JSON.stringify({}, null, 4),
    }
  }
  // console.log('hash validated');

  console.log(event);

  const parsedBody = JSON.parse(body);
  console.log(parsedBody);

  if (parsedBody?.action === 'queued' && parsedBody?.workflow_job?.status === 'queued') {
    console.log('workflow queued'); // This is picked up as a metric
    if (!ecsClient) {
      ecsClient = new ECS({ region: 'eu-west-2' });
    }
    const service = (await ecsClient.describeServices({
      cluster: CLUSTER_NAME,
      services: [CLUSTER_SERVICE_NAME],
    })).services[0];
    console.log(service);
    const {
      taskDefinition,
      launchType,
      enableExecuteCommand,
      enableECSManagedTags,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp,
          securityGroups,
          subnets
        }
      }
    } = service;
  
    const res = await ecsClient.runTask({
      cluster: CLUSTER_NAME,
      count: 1,
      enableECSManagedTags,
      enableExecuteCommand,
      launchType,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets,
          securityGroups,
          assignPublicIp,
        },
      },
      taskDefinition,
    });
    console.log(res);
  }
}

module.exports = {
  handler,
};

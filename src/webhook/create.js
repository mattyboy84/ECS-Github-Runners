const {
  GITHUB_ORG_NAME_SSM,
  GITHUB_ORG_TOKEN_SSM,
  GITHUB_ORG_HOOK_ID_SSM,
  API_URL,
  API_SECRET,
} = require('../config');

const { SSM } = require("@aws-sdk/client-ssm");
const { SecretsManager } = require("@aws-sdk/client-secrets-manager");

let ssmClient = undefined;
let secretClient = undefined;


async function handler(event, context) {
  let name = undefined;
  let token = undefined;
  let secret = undefined;

  console.log(event);
  console.log(context);
  ssmClient = ssmClient ? ssmClient : new SSM({region: 'eu-west-2' });
  secretClient = secretClient ? secretClient : new SecretsManager({region: 'eu-west-2' });
  
    if (!name) {
    const urlResponse = await ssmClient.getParameter({
      Name: GITHUB_ORG_NAME_SSM,
    });
    name = urlResponse.Parameter.Value;
  }
  console.log(name);

  if (!token) {
    const tokenResponse = await ssmClient.getParameter({
      Name: GITHUB_ORG_TOKEN_SSM,
    });
    token = tokenResponse.Parameter.Value;
  }
  console.log(token.substring(0,15));

  if (!secret) {
    const secretResponse = await secretClient.getSecretValue({
      SecretId: API_SECRET,
    });
    secret = secretResponse.SecretString;
  }
  console.log(secret.substring(0,10));

  const response = await fetch(`https://api.github.com/orgs/${name}/hooks`, {
    method: 'POST',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      "name": "web",
      "active": true,
      "events": [
        "ping",
        "workflow_job",
        "workflow_run"
      ],
      "config": {
        "url": API_URL,
        "content_type": "json",
        "insecure_ssl": 0,
        "secret": secret,
      }
    }),
  });

  const responseBody = await response.json();
  const responseHeaders = await response.headers;
  const responseStatus = await response.status;

  console.log(responseBody);
  console.log(responseHeaders);
  console.log(responseStatus);

  if (responseStatus === 201) {
    const { id } = responseBody;
    
    await ssmClient.putParameter({
      Name: GITHUB_ORG_HOOK_ID_SSM,
      Value: String(id),
      Overwrite: true
    });
  }

}

module.exports = {
  handler,
};

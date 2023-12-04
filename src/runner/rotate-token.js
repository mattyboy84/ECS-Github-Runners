const {
  GITHUB_ORG_NAME_SSM,
  GITHUB_ORG_TOKEN_SSM,
  GITHUB_ORG_RUNNER_TOKEN_SSM,
} = require('../config');

const { SSM } = require("@aws-sdk/client-ssm");

let client = undefined;

let name = undefined;
let token = undefined;

async function handler(event, context) {
  console.log(event);

  client = client ? client : new SSM({region: 'eu-west-2' });
  
  if (!name) {
    const urlResponse = await client.getParameter({
      Name: GITHUB_ORG_NAME_SSM,
    });
    name = urlResponse.Parameter.Value;
  }
  console.log(name);

  if (!token) {
    const tokenResponse = await client.getParameter({
      Name: GITHUB_ORG_TOKEN_SSM,
    });
    token = tokenResponse.Parameter.Value;
  }
  console.log(token.substring(0,15));

  const response = await fetch(`https://api.github.com/orgs/${name}/actions/runners/registration-token`, {
    method: 'POST',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = await response.json();
  const responseStatus = await response.status;

  console.log(responseStatus);

  const { token: runnerToken } = responseBody;
  console.log(runnerToken.substring(0,10));

  await client.putParameter({
    Name: GITHUB_ORG_RUNNER_TOKEN_SSM,
    Value: String(runnerToken),
    Overwrite: true
  });

}

module.exports = {
  handler,
};

const {
  GITHUB_ORG_NAME_SSM,
  GITHUB_ORG_TOKEN_SSM,
  GITHUB_ORG_HOOK_ID_SSM,
} = require('../config');

const { SSM } = require("@aws-sdk/client-ssm");

let client = undefined;

let name = undefined;
let token = undefined;
let hookid = undefined;

async function handler(event, context) {
  console.log(event);
  console.log('deleting');
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
  
  if (!hookid) {
    const hookidResponse = await client.getParameter({
      Name: GITHUB_ORG_HOOK_ID_SSM,
    });
    hookid = hookidResponse.Parameter.Value;
  }
  console.log(hookid);
  console.log(`https://api.github.com/orgs/${name}/hooks/${hookid}`);

  const response = await fetch(`https://api.github.com/orgs/${name}/hooks/${hookid}`, {
    method: 'DELETE',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
    }
  });

  const responseBody = await response.text();
  const responseHeaders = await response.headers;
  const responseStatus = await response.status;

  console.log(responseBody);
  console.log(responseHeaders);
  console.log(responseStatus);
}

module.exports = {
  handler,
};

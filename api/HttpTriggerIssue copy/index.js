const { getItem, putItem, deleteItem, TYPES, getItems } = require('../sharedCode/rest');

const requestMethod = {
  'GET': async (context, issue) => {
    return {status: 200, body: issue}
  }, // 'GET'

  'PUT': async (context, issue, { name }) => {
    if (!name) return ({
      status: 400,
      body: { error: 'Must include name'}
    });
    const putResponse = await putItem(context, 'Issues', issue.id, [{
      name: 'name',
      type: TYPES.VarChar,
      value: name
    }]);
    if (!putResponse || !putResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    return putResponse;
  }, // 'PUT'

  'DELETE': async (context, issue) => {
    const installationResponse = await getItems(context, 'Installations', [{
      name: 'issueId',
      type: TYPES.VarChar,
      value: issue.id
    }]);
    if (!installationResponse || !installationResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    if (installationResponse.status !== 200 && installationResponse.status !== 204) return installationResponse;
    if (installationResponse.body.length) return {
      status: 400, body: { error: 'Issue has installations' }
    }

    const probesResponse = await getItems(context, 'Probes', [{
      name: 'issueId',
      type: TYPES.VarChar,
      value: issue.id
    }]);
    if (!probesResponse || !probesResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    if (probesResponse.status !== 200 && probesResponse.status !== 204) return probesResponse;
    if (probesResponse.body.length) return {
      status: 400, body: { error: 'Issue has probes' }
    }

    const usersResponse = await getItems(context, 'Users', [{
      name: 'issueId',
      type: TYPES.VarChar,
      value: issue.id
    }]);
    if (!usersResponse || !usersResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    if (usersResponse.status !== 200 && usersResponse.status !== 204) return usersResponse;
    if (usersResponse.body.length) return {
      status: 400, body: { error: 'Issue has users' }
    }

    const deleteResponse = await deleteItem(context, 'Issues', issue.id);
    if (!deleteResponse || !deleteResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    return deleteResponse;
  } // 'DELETE'
} // requestMethod = {'GET', 'PUT', 'DELETE'}

module.exports = async (context, req) => {
  const now = new Date(context.bindingData.sys.utcNow).getTime();
  const { issueId } = context.bindingData;
  context.log(`HttpTriggerIssue utcNow: ${
    now
  }, delay: ${
    new Date().getTime() - now
  }, issueId: ${
    issueId
  }, method: ${
    req.method
  }`);
  if (!issueId) {
    context.res = { status: 400, body: { error: 'IssueId not specified' } };
  } else {
    const getIssue = await getItem(context, 'Issues', issueId);
    if (!getIssue || !getIssue.status) {
      context.res = {status: 500, body: { error: 'bad response' } }
    } else if (getIssue.status !== 200) {
      context.res = getIssue
    } else { // if (getIssue.status === 200)
      context.res = await requestMethod[req.method](
        context,
        getIssue.body,
        req.body
      ); // context.res
    } // endif (getIssue.status === 200)
  } // endif (issueId)
}; // module.exports

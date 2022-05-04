const { getItem, putItem, deleteItem, TYPES } = require('../sharedCode/rest');

const requestMethod = {
  'GET': async (context, issue) => {
    return {status: 200, body: issue}
  }, // 'GET'

  'PUT': async (context, issue, { title, description }) => {
    if (!title) return ({
      status: 400,
      body: { error: 'Must include title'}
    });
    const putResponse = await putItem(context, 'Issues', issue.id, [{
      name: 'title',
      type: TYPES.VarChar,
      value: title
    }, {
      name: 'description',
      type: TYPES.VarChar,
      value: description
    }]);
    if (!putResponse || !putResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    return putResponse;
  }, // 'PUT'

  'DELETE': async (context, issue) => {
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

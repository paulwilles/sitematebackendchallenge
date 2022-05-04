const { getItem, getItems, postItem, TYPES } = require('../sharedCode/rest');
const uuidv4 = require('uuid').v4;

const requestMethod = {
  'GET': async (context) => {
    const getResponse = await getItems(context, 'Issues');
    if (!getResponse || !getResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    if (getResponse.status !== 200) return getResponse
    return ({
      status: 200,
      body: (
        getResponse.body || []
      ).reduce((result, issue) => ({
        ...result,
        [issue.id]: {
          id: issue.id,
          title: issue.title,
          desciption: issue.desciption
        } // body[issue.id]
      }), {}) // body
    }); // return()
  }, // 'GET'

  'POST': async (context, newIssue) => {
    const issueId = uuidv4();
    const postResponse = await postItem(context, 'Issues', [{
      name: 'id',
      type: TYPES.Int,
      value: issueId
    }, {
        name: 'title',
        type: TYPES.VarChar,
        value: newIssue.title
      }, {
        name: 'description',
        type: TYPES.VarChar,
        value: newIssue.description
      }]);
    if (!postResponse || !postResponse.status) return {
      status: 500, body: { error: 'bad response' }
    }
    return postResponse
  }, // 'POST'
} // requestMethod = {'GET', 'POST'}

module.exports = async (context, req) => {
  const now = new Date(context.bindingData.sys.utcNow).getTime();
  const { tenantId } = context.bindingData;
  context.log(`HttpTriggerissues utcNow: ${
    now
  }, delay: ${
    new Date().getTime() - now
  }, method: ${
    req.method
  }`);
  context.res = await requestMethod[req.method](
    context,
    req.body
  ); // context.res
}; // module.exports

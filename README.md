# sitematebackendchallenge
A simple REST API Server + Client for Issues (think GitHub or Jira Issues)

Create: accepts a JSON object & prints/logs the object
POST: https://sitematebackendchallenge.azurewebsites.net/api/issues

Read: returns a static JSON object
all Issues
GET: https://sitematebackendchallenge.azurewebsites.net/api/issues
One issue
GET: https://sitematebackendchallenge.azurewebsites.net/api/issues/{issueId}

Update: accepts a JSON object & prints/logs the object
PUT: https://sitematebackendchallenge.azurewebsites.net/api/issues/{issueId}

Delete: prints/logs out the object or id to delete
DELETE: https://sitematebackendchallenge.azurewebsites.net/api/issues/{issueId}

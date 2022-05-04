const { Connection, Request, TYPES } = require('tedious');

const { db_server, db_database, db_user, db_password } = process.env;

const config = {
  server: db_server,
  authentication: {
    type: 'default',
    options: {
        userName: db_user,
        password: db_password
    }
    // type: 'azure-active-directory-msi-app-service',
  },
  options: {
    database: db_database,
    encrypt: true,
    trustServerCertificate: false,
    // rowCollectionOnRequestCompletion: true
    // port: 1433
  }
};

const executeQuery = (context, queryText, parameters, connection) => new Promise((resolve, reject) => {
  const result = [];
  const request = new Request(queryText, (error, rowCount, rows) => {
    if (error) {
      reject(error);
    } else {
      connection.close();
      resolve(result);
    }
  });
  context.log(queryText, parameters);
  parameters.forEach((parameter) => {
    request.addParameter(parameter.name, parameter.type, parameter.value);
  })
  request.on('row', function(columns) {
    const row = {};
    columns.forEach(function(column) {
      row[column.metadata.colName] = column.value;
    });
    result.push(row);
  });

  connection.execSql(request);
})

const executeSQL = (context, queryText, parameters) => new Promise((resolve, reject) => {
  const connection = new Connection(config);
  connection.on('connect', (err) => {
    if (err) {
      context.log(err);
      reject(err);
    } else {
      context.log('connected');
      executeQuery(context, queryText, parameters, connection)
        .then((ok) => resolve(ok))
        .catch((err) => reject(err))
    }
  });
  connection.connect();
});

const executeBulkLoad = (context, tableName, columns, data, connection) => new Promise((resolve, reject) => {
  const bulkLoad = connection.newBulkLoad(tableName, { keepNulls: true }, (error, rowCount) => {
    if (error) return reject(error);
    connection.close();
    return resolve(rowCount);
  });
  columns.forEach((column) => {
    bulkLoad.addColumn(column.name, column.type, column.options);
  });
  connection.execBulkLoad(bulkLoad, data);
});

const bulkLoad = (context, tableName, columns, data) => new Promise((resolve, reject) => {
  const connection = new Connection(config);
  connection.connect((err) => {
    if (err) {
      reject(err);
    } else {
      executeBulkLoad(context, tableName, columns, data, connection)
      .then((ok) => resolve(ok))
      .catch((err) => reject(err));
    }
  });
})

module.exports = {
  executeSQL,
  bulkLoad,
  TYPES
}

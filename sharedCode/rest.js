const { executeSQL, TYPES } = require ('./sql');

const tables = {};

const getItem = async(context, tableName, id) => {
  if (!tableName) return { status: 500, body: { error: 'tableName not defined' } };
  context.log(tableName, tables[tableName]);
  if (!id) return { status: 400, body: { error: 'id not defined' } }
  if (!tables[tableName]) tables[tableName] = new Map();
  const response = tables[tableName].get(id);
  if (response) return { status: 200, body: response }
  const getQuery = `SELECT * from ${tableName} WHERE id = @id`;
  context.log(getQuery);
  const getQueryParams = [{
    name: 'id',
    type: typeof(id) === 'number' ? TYPES.Int : TYPES.VarChar,
    value: id
  }]
  try {
    context.log(getQuery, getQueryParams);
    const getQueryResult = await executeSQL(context, getQuery, getQueryParams);
    context.log('getQueryResult', getQueryResult);
    if (getQueryResult.length) {
      tables[tableName].set(id, getQueryResult[0]);
      return { status: 200, body: getQueryResult[0] }
    }
    return { status: 404, body: { error: 'Not found' } }
  } catch (error) {
    context.log(error);
    return { status: 500, body: { error } }
  }
}

const getItems = async(context, tableName, constraints) => {
  if (!tableName) return { status: 500, body: { error: 'tableName not defined' } };
  context.log(tableName, tables[tableName]);
  if (!tables[tableName]) tables[tableName] = new Map();

  let getQuery = `SELECT * from ${tableName}`;
  if (constraints?.length) {
    getQuery += ` WHERE ${constraints.map((constraint) => `${constraint.name} = @${constraint.name}`).join(', ')}`;
  }
  context.log(getQuery);
  const getQueryParams = constraints ?? [];
  try {
    const getQueryResult = await executeSQL(context, getQuery, getQueryParams);
    context.log('getQueryResult: ', getQueryResult);
    if (getQueryResult.length) {
      tables[tableName].clear();
      getQueryResult.forEach((result) => {
        tables[tableName].set(result.id, result);
      })
      return { status: 200, body: getQueryResult }
    }
    return { status: 200, body: [] }
  } catch (error) {
    context.log(error);
    return { status: 500, body: { error } }
  }
}

const postItem = async (context, tableName, data) => {
  if (!tableName) return { status: 500, body: { error: 'tableName not defined' } };
  context.log(tableName, tables[tableName], data);
  if (!tables[tableName]) tables[tableName] = new Map();
  if (!data) return { status: 400, body: { error: 'data not defined' } }
  const postQuery = `INSERT INTO ${tableName} (${
    data.map((param) => param.name).join(',')
  }) VALUES (${
    data.map((param) => `@${param.name}`).join(',')
  }); select @@identity`;
  context.log(postQuery);
  const postQueryParams = data
  try {
    const postQueryResult = await executeSQL(context, postQuery, postQueryParams);
    context.log(postQueryResult);
    if (postQueryResult.length) {
      const id = data.find((param) => param.name === 'id')?.value ?? Object.values(postQueryResult[0])[0];
      const params = data.reduce((result, param) => ({
        ...result,
        [param.name]: param.value
      }), {});
      params.id = id;
      tables[tableName].set(id, params);
      return { status: 200, body: params }
    }
    return { status: 500, body: { error: 'not inserted' } }
  } catch (error) {
    return { status: 500, body: { error } }
  }
}

const putItem = async (context, tableName, id, data) => {
  if (!tableName) return { status: 500, body: { error: 'tableName not defined' } };
  if (!id) return { status: 400, body: { error: 'id not defined' } }
  if (!data) return { status: 400, body: { error: 'data not defined' } }
  if (!tables[tableName]) tables[tableName] = new Map();
  const getQuery = `SELECT * from ${tableName} WHERE id = @id`;
  const getQueryParams = [{
    name: 'id',
    type: typeof(id) === 'number' ? TYPES.Int : TYPES.VarChar,
    value: id
  }]
  try {
    const getQueryResult = await executeSQL(context, getQuery, getQueryParams);
    context.log(getQueryResult);
    if (!getQueryResult?.length) return { status: 404, body: { error: 'Not found' }}
    const putQuery = `UPDATE ${tableName} SET ${data.map((param) => (`${param.name} = @${param.name}`))} WHERE id = @id`;
    const putQueryParams = [
      ...data.map((param) =>({
        name: param.name,
        type: param.type,
        value: param.value
      })), {
        name: 'id',
        type: typeof(id) === 'number' ? TYPES.Int : TYPES.VarChar,
        value: id
      }
    ]
    try {
      const putQueryResult = await executeSQL(context, putQuery, putQueryParams);
      context.log(putQueryResult);
      if (putQueryResult) {
        const response = {
          ...(getQueryResult[0] || {}),
          ...data.reduce((result, param) =>({ ...result, [param.name]: param.value }), {})
        }
        tables[tableName].set(id, response);
        return { status: 200, body: response }
      }
      return { status: 500, body: { message: 'not updated' } }
    } catch (error) {
      context.log(error);
      return { status: 500, body: { error } }
    }
  } catch (error) {
    context.log(error);
    return { status: 500, body: { error } }
  }
}

const deleteItem = async (context, tableName, id) => {
  if (!tableName) return { status: 500, body: { error: 'tableName not defined' } };
  if (!id) return { status: 400, body: { error: 'id not defined' } };
  if (!id) return { status: 400, body: { error: 'id not defined' } };
  if (!tables[tableName]) tables[tableName] = new Map();
  let response = tables[tableName].get(id);
  if (!response) {
    const getQuery = `SELECT * from ${tableName} WHERE id = @id`;
    const getQueryParams = [{
      name: 'id',
      type: typeof(id) === 'number' ? TYPES.Int : TYPES.VarChar,
      value: id
    }]
    try {
      const getQueryResult = await executeSQL(context, getQuery, getQueryParams);
      context.log(getQueryResult);
      if (getQueryResult.length) {
        tables[tableName].set(id, getQueryResult[0]);
        response = getQueryResult[0];
      }
    } catch (error) {
      return { status: 500, body: { error } }
    }
    if (!response) return { status: 404, body: { error: 'item not found' } }
  }
  const deleteQuery = `DELETE FROM ${tableName} WHERE id = @id`;
  const deleteQueryParams = [{
    name: 'id',
    type: typeof(id) === 'number' ? TYPES.Int : TYPES.VarChar,
    value: id
}]
  try {
    const deleteQueryResult = await executeSQL(context, deleteQuery, deleteQueryParams);
    context.log(deleteQueryResult);
    if (deleteQueryResult) {
      tables[tableName].delete(id);
      return { status: 200, body: { message: 'deleted' } }
    }
    return { status: 500, body: { error: 'not deleted' } }
  } catch (error) {
    return { error }
  }
}

module.exports = {
  getItem,
  getItems,
  postItem,
  putItem,
  deleteItem,
  TYPES
}

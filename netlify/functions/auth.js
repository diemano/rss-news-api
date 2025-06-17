exports.handler = async function(event) {
  const body = JSON.parse(event.body || '{}');
  const password = body.senha;
  const NEWS_PASS = process.env.NEWS_PASS;

  const authorized = password && NEWS_PASS && password === NEWS_PASS;

  return {
    statusCode: authorized ? 200 : 401,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ authorized })
  };
};


const Parser = require("rss-parser");
const parser = new Parser();

exports.handler = async function(event, context) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL do feed não especificada." }),
    };
  }

  try {
    const feed = await parser.parseURL(url);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(feed.items.slice(0, 5))
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao buscar RSS.", detalhes: err.message }),
    };
  }
};

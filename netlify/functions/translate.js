
exports.handler = async function(event) {
  try {
    const { texto, origem = "en", destino = "pt" } = JSON.parse(event.body || "{}");

    if (!texto || typeof texto !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Parâmetro 'texto' inválido ou ausente." })
      };
    }

    const apiUrl = "https://libretranslate.com/translate"; // novo endpoint confiável
    const payload = {
      "q": "texto",
      "source": "en",
      "target": "pt",
      "format": "text",
      "api_key": ""
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Erro HTTP na API de tradução", status: response.status, resposta: errorText })
      };
    }

    const data = await response.json();
    const traduzido = data?.translatedText?.trim() || texto;
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ traduzido })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao traduzir", detalhes: e.message })
    };
  }
};


exports.handler = async function(event) {
  try {
    const { texto, origem = "en", destino = "pt" } = JSON.parse(event.body || "{}");

    const response = await fetch("https://translate.argosopentech.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texto,
        source: origem,
        target: destino,
        format: "text"
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ traduzido: data.translatedText || texto })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao traduzir", detalhes: e.message })
    };
  }
};


exports.handler = async function(event) {
  const GEMINI_API_KEY = "AIzaSyBrNhAiEyI0GNZT8XemNBpfW6kWNxDY0vI";
  const { title, description, source } = JSON.parse(event.body || "{}");

  if (!title || !description || !source) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Faltam parâmetros obrigatórios: title, description, source." })
    };
  }

  const prompt = `Gere um resumo em português do Brasil entre 400 e 600 caracteres com início, meio e fim.
O texto deve ser fluido, bem estruturado e com tom jornalístico. Ao final, inclua: "As informações são do site ${source}."

Título: ${title}
Descrição: ${description}`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const erroTexto = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Erro HTTP da API Gemini", status: response.status, resposta: erroTexto })
      };
    }

    const data = await response.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Nenhum conteúdo gerado.";
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ resumo: texto })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor", detalhes: e.message })
    };
  }
};

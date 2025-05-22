exports.handler = async function(event) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const { title, description } = JSON.parse(event.body || "{}");

  if (!title || !description) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Campos obrigatórios ausentes: title ou description." })
    };
  }

  const prompt = `Classifique a seguinte notícia em uma única palavra-chave de categoria (sem frases ou pontuação). Sugestões: Inteligência Artificial, Segurança, Mobile, Inovação, Empresas, Ciência, Tecnologia Geral.

Título: ${title}
Descrição: ${description}

Categoria:`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + GEMINI_API_KEY, {
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
    const texto = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ").trim();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ categoria: texto || "Tecnologia Geral" })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno", detalhes: e.message })
    };
  }
};
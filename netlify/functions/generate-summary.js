exports.handler = async function(event) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const { title, description, source } = JSON.parse(event.body || "{}");

  if (!title || !description || !source) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Campos obrigatórios ausentes." })
    };
  }

  const prompt = `Com base no título e descrição abaixo:
1. Gere uma categoria coerente (ex: Inteligência Artificial, Segurança, Mobile, Inovação, Empresas, Ciência, Tecnologia Geral).
2. Escreva um resumo com até 600 caracteres, começando com o título seguido de dois pontos. O texto deve ter início, meio e fim. Finalize com: As informações são do site ${source}.
Toda a resposta deve ser em português do Brasil.
Título: ${title}
Descrição: ${description}

Formato da resposta:
Categoria: [categoria]
Resumo: [resumo completo]`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const texto = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ").trim();

    const match = texto.match(/^Categoria:\s*(.+?)\s*Resumo:\s*(.+)/s);
    const categoria = match ? match[1].trim() : "Tecnologia Geral";
    const resumo = match ? match[2].trim() : texto;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ categoria, resumo })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno", detalhes: e.message })
    };
  }
};

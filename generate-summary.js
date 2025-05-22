
exports.handler = async function(event) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  // Substitua aqui com a chave da conta do Workspace
  const { title, description, source } = JSON.parse(event.body || "{}");

  if (!title || !description || !source) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Campos obrigatórios ausentes: title, description ou source." })
    };
  }

  const prompt = `Gere um texto jornalístico para um público de TI com até 500 caracteres, começando com o título da notícia seguido de dois pontos. 
Após os dois pontos, escreva um resumo coeso, com início, meio e fim. O conteúdo deve ter linguagem fluida e bem estruturada, um texto bom para ler.
Finalize com a frase: As informações são do site ${source}.

A estrutura poderia ser dessa forma:

Título da notícia: resumo completo com início, meio e fim. As informações são do site ${source}.

Título: ${title}
Descrição: ${description}`;

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
    const texto = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ").trim() || "Nenhum conteúdo gerado.";
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ resumo: texto })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno na função", detalhes: e.message })
    };
  }
};

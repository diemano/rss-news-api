exports.handler = async function(event) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const { title, description, source } = JSON.parse(event.body || "{}");

  if (!title || !description || !source) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Campos obrigatórios ausentes: title, description ou source." })
    };
  }

  const prompt = `Leia o título e a descrição abaixo. Depois:
1. Crie uma categoria adequada para a notícia (ex: Inteligência Artificial, Segurança, Mobile, Inovação, Empresas, Ciência, Tecnologia Geral etc.).
2. Gere um resumo fluido e jornalístico de até 600 caracteres com início, meio e fim.
3. O resumo deve começar com o título seguido de dois pontos.
4. Finalize o texto com: As informações são do site ${source}.

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
    const textoCompleto = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ").trim() || "";

    const match = textoCompleto.match(/^Categoria: (.+?)\nResumo: (.+)/s);
    const categoria = match ? match[1].trim() : "Tecnologia Geral";
    const resumo = match ? match[2].trim() : textoCompleto;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ resumo, categoria })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno na função", detalhes: e.message })
    };
  }
};
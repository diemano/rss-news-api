exports.handler = async function(event) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const { title, description, source } = JSON.parse(event.body || "{}");

  if (!title || !description || !source) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Campos obrigatórios ausentes." })
    };
  }

  const prompt = `Com base no título e na descrição abaixo, siga estas instruções com estilo:
1. Identifique uma categoria relevante para o conteúdo (ex: Inteligência Artificial, Segurança, Mobile, Inovação, Empresas, Ciência, Tecnologia Geral). Nada de categoria genérica só pra passar vergonha.
2. Crie um resumo de até 600 caracteres. Comece com o título seguido de dois pontos. O texto deve ter começo, meio e fim — nada de jogar info solta como commit mal documentado. Pode usar um tom descontraído e um humor levemente ácido, do jeitinho que o pessoal de TI adora.
3. Finalize com: As informações são do site ${source}.
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

    if (!response.ok) {
      const erroTexto = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Erro HTTP da API Gemini", status: response.status, resposta: erroTexto })
      };
    }

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

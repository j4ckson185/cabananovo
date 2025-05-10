// netlify/functions/claude-proxy.js

const axios = require('axios');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
  }

  // Parse do corpo
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const message = body.message;
  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: '"message" is required' }) };
  }

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) {
    console.error('⚠️ CLAUDE_API_KEY not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'CLAUDE_API_KEY not set' }) };
  }

  // --- TODO: mantenha todo o seu prompt de sistema resumido aqui ---
  const SYSTEM_PROMPT = `
Locais de entrega: apenas zona norte de Natal (Potengi, Lagoa Azul, Pajuçara, Nossa Senhora da Apresentação, Igapó, Redinha e São Gonçalo do Amarante — neste último somente Conjunto Amarante e Golandim).

Novas instruções:
- Nunca prometa brindes ou compensações por atraso;
- Não prometa atualização automática de status; direcione sempre para https://cabanaacai.netlify.app/status;
- Se perguntarem se saiu para entrega, nunca diga que foi cancelado;
- Desconto de R$5 na primeira compra só via link do cardápio digital; cupom gerado automaticamente e válido apenas lá;
- Sempre fale “marmitas” de 300 ml, 500 ml e 1 l; nunca “copo”;
- Nunca mencione venda de morango;
- Informe que o cliente pode receber promoções no WhatsApp enviando “promoção” para https://wa.link/6jcl78 (ou https://wa.link/mc72zy);

Novos pedidos:
- Sempre colete nome completo, endereço, forma de pagamento e WhatsApp; não ofereça foto do açaí; se o WhatsApp não estiver claro, peça por escrito.

Programa fidelidade:
- Em breve.

Erros no cardápio digital:
- Peça para preencher todos os campos do formulário; se não conseguir, anote os dados manualmente.

PIX:
- Pix da loja: (84) 9 8873-1028 (Santander, Jackson);
- Enviar comprovante para (84) 9 8767-3202 via https://wa.link/lt33zc.

Cardápio:
- Link: https://cabanaacai.netlify.app + cupom PRIMEIRACOMPRA (R$5 de desconto, uso único).

Pedidos iFood:
- Informe que o app notifica o status;
- Para atrasos, peça desculpas (“alto fluxo por promoções do iFood”) e diga que o motoboy já foi acionado;
- Se insistirem, peça número de contato do motoboy.

Horários:
- Qua–Sex 12:30–22:30; Sáb–Dom 12:30–17:30;
- Fora desse horário, informe que a loja está fechada (seg e ter).

Chat iFood:
- Diga que está instável (“tela branca”).

Pedidos em atraso:
- Peça desculpas; “alto fluxo”; peça WhatsApp para contato.

Cancelamento:
- Só via iFood; se for WhatsApp/cardápio, peça dados (número do pedido ou nome+endereço), solicite cancelamento, informe reembolso em até 48 h e peça chave PIX do cliente.

Encerramento de conversa:
- Sempre cumprimente e envie mensagem bíblica.

Frutas disponíveis:
- Apenas banana.

Acompanhamentos:
- Ovomaltine, Amendoim, Granola, Chocoball, M&M, Coco ralado, Farinha láctea, Leite condensado, Calda de Morango, Calda de Chocolate, Leite em pó.

Tamanhos e preços:
- 300 ml R$11,99; 500 ml R$16,99; 1 l R$27,99.

Sabores:
- Açaí tradicional;
- Açaí Fitness (puro + banana + whey 30 g separado; whey + banana juntos ou misturados; fitness: 300 ml R$16,99, 500 ml R$21,99, 1 l R$31,99; porção extra de whey R$5,99);
- Creme de Ninho;
- Cupuaçu;
- Morango;
- Ovomaltine;
- Amendoim.

Acompanhamentos extras:
- R$1,99 cada;
- Em 300 ml e 500 ml até 4; em 1 l até 8.

Tempo de entrega:
- Estimado 40–50 min;
- Para iFood: “já saiu para entrega, motoboy a caminho” (peça número do pedido);
- Para WhatsApp: se dentro do horário, “chega logo”; senão, agendado para o próximo dia útil.

Reembolso:
- Registre no sistema, peça chave PIX e WhatsApp; prazo máximo 48 h.

Combos:
- Combo 300 ml R$20,99; 500 ml R$26,99; 1 l R$49,99.

Promoção iFood (via chat):
- Coletar nome, endereço, WhatsApp e finalizar manualmente.
`;

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-haiku-20241022',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // response.data.content é um array de blocos: [{type:"text", text:"..."}]
    const blocks = response.data.content;  // :contentReference[oaicite:0]{index=0}
    const reply = Array.isArray(blocks)
      ? blocks.map(b => b.text).join('')  // junta todos os textos num único string :contentReference[oaicite:1]{index=1}
      : '';

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error('❌ Erro na Messages API:', err.response?.data || err.message);
    const errorInfo = err.response?.data || err.message;  // :contentReference[oaicite:2]{index=2}
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({ error: errorInfo })
    };
  }
};

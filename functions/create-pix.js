const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me
const API_KEY = 'sk_test_74a124ada92a4702beba69c65335c168';
const API_URL = 'https://api.pagar.me/core/v5';

// Função principal
exports.handler = async function(event, context) {
  // Configurar CORS para permitir solicitações do seu site
  const headers = {
    'Access-Control-Allow-Origin': '*', // Substitua pelo seu domínio em produção
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Processar solicitações OPTIONS (para CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Apenas permita POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }
  
  try {
    // Obter dados da solicitação
    const requestData = JSON.parse(event.body);
    
    // Validar dados necessários
    if (!requestData.amount || !requestData.customerName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' })
      };
    }
    
    // Preparar dados para a API do Pagar.me
    const amountInCents = Math.round(parseFloat(requestData.amount) * 100);
    
    const pagarmeData = {
      items: [
        {
          amount: amountInCents,
          description: requestData.description || "Pedido Cabana Açaí",
          quantity: 1
        }
      ],
      customer: {
        name: requestData.customerName,
        email: requestData.customerEmail || "cliente@cabanaacai.com.br",
        type: "individual",
        document: requestData.customerDocument || "00000000000",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: requestData.customerPhone.substring(0, 2),
            number: requestData.customerPhone.substring(2)
          }
        }
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: 3600 // Expira em 1 hora
          }
        }
      ]
    };
    
    // Configurar autenticação Basic
    const auth = Buffer.from(`${API_KEY}:`).toString('base64');
    
    // Fazer a requisição para a API do Pagar.me
    const response = await axios.post(`${API_URL}/orders`, pagarmeData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Extrair dados relevantes da resposta
    const result = {
      orderId: response.data.id,
      orderCode: response.data.code,
      status: response.data.status
    };
    
    // Verificar se há charges com last_transaction
    if (response.data.charges && 
        response.data.charges.length > 0 && 
        response.data.charges[0].last_transaction) {
      
      const transaction = response.data.charges[0].last_transaction;
      
      result.pixCode = transaction.qr_code;
      result.pixQrCodeUrl = transaction.qr_code_url;
      result.expiresAt = transaction.expires_at;
    }
    
    // Retornar resultado
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro ao processar requisição',
        message: error.message,
        details: error.response ? error.response.data : null
      })
    };
  }
};

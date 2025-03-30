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
    if (!requestData.orderId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID do pedido não fornecido' })
      };
    }
    
    // Configurar autenticação Basic
    const auth = Buffer.from(`${API_KEY}:`).toString('base64');
    
    // Fazer a requisição para a API do Pagar.me
    const response = await axios.get(`${API_URL}/orders/${requestData.orderId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    // Retornar resultado
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: response.data.status,
        orderId: response.data.id,
        charges: response.data.charges
      })
    };
    
  } catch (error) {
    console.error('Erro ao verificar status do pedido:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro ao verificar status do pedido',
        message: error.message,
        details: error.response ? error.response.data : null
      })
    };
  }
};

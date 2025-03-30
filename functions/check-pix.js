const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me (Produção)
const API_KEY = 'sk_a4612521c1f44373a396e124a92e5504';
const API_URL = 'https://api.pagar.me/core/v5';

// Função principal
exports.handler = async function(event, context) {
  // Configurar CORS para permitir solicitações do seu site
  const headers = {
    'Access-Control-Allow-Origin': '*',
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
    const response = await axios.get(`${API_URL}/charges/${requestData.orderId}`, {
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
        lastTransaction: response.data.last_transaction
      })
    };
    
  } catch (error) {
    console.error('Erro ao verificar status do pedido:', error);
    
    let errorDetails = {
      message: error.message
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro ao verificar status do pedido',
        details: errorDetails
      })
    };
  }
};

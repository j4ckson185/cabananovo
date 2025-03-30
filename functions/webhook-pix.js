const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me
const API_KEY = 'sk_test_74a124ada92a4702beba69c65335c168';
const API_URL = 'https://api.pagar.me/core/v5';

exports.handler = async function(event, context) {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Processar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }
  
  try {
    // Obter dados do webhook
    let webhookData;
    try {
      webhookData = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Corpo de requisição inválido' })
      };
    }
    
    console.log('Webhook recebido:', JSON.stringify(webhookData));
    
    // Processar diferentes tipos de eventos
    if (webhookData.type === 'order.paid') {
      // Pagamento confirmado
      const orderId = webhookData.data.id;
      
      // Aqui você pode implementar lógica adicional:
      // - Atualizar status na sua base de dados
      // - Enviar confirmação para o cliente
      // - etc.
      
      console.log(`Pagamento confirmado para pedido: ${orderId}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Pagamento processado com sucesso',
          orderId: orderId
        })
      };
    } 
    else if (webhookData.type === 'order.created') {
      console.log(`Pedido criado: ${webhookData.data.id}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Pedido criado recebido'
        })
      };
    }
    else {
      // Outros tipos de eventos
      console.log(`Evento recebido: ${webhookData.type}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Evento recebido com sucesso',
          eventType: webhookData.type
        })
      };
    }
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao processar webhook',
        message: error.message
      })
    };
  }
};

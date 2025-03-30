const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me (Produção)
const API_KEY = 'sk_a4612521c1f44373a396e124a92e5504';
const API_URL = 'https://api.pagar.me/core/v5';

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }
  
  try {
    const requestData = JSON.parse(event.body);
    console.log('Dados recebidos:', JSON.stringify(requestData));
    
    if (!requestData.amount || !requestData.customerName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' })
      };
    }
    
    // Extrair código de área e número do telefone
    let areaCode = "11";
    let phoneNumber = "999999999";
    
    if (requestData.customerPhone) {
      const phoneDigits = requestData.customerPhone.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        areaCode = phoneDigits.substring(0, 2);
        phoneNumber = phoneDigits.substring(2);
      }
    }
    
    // Configurar autenticação
    const auth = Buffer.from(`${API_KEY}:`).toString('base64');
    const authHeaders = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // Tentar abordagem de Orders
    const orderData = {
      items: [
        {
          amount: Math.round(parseFloat(requestData.amount) * 100),
          description: requestData.description || "Pedido Cabana Açaí",
          quantity: 1,
          code: "ACAI" + Date.now().toString().slice(-6)
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
            area_code: areaCode,
            number: phoneNumber
          }
        }
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: 3600
          }
        }
      ]
    };
    
    console.log('Criando pedido:', JSON.stringify(orderData));
    
    const orderResponse = await axios.post(`${API_URL}/orders`, orderData, {
      headers: authHeaders
    });
    
    console.log('Pedido criado:', JSON.stringify(orderResponse.data));
    
    // Verificar se o pedido tem informações PIX
    if (orderResponse.data.charges && 
        orderResponse.data.charges.length > 0 && 
        orderResponse.data.charges[0].last_transaction && 
        orderResponse.data.charges[0].last_transaction.qr_code) {
      
      const transaction = orderResponse.data.charges[0].last_transaction;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: orderResponse.data.id,
          status: orderResponse.data.status,
          pixCode: transaction.qr_code,
          pixQrCodeUrl: transaction.qr_code_url,
          expiresAt: transaction.expires_at
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'failed',
          orderId: orderResponse.data.id,
          error: 'Falha ao criar pedido PIX',
          errorDetails: orderResponse.data,
          expiresAt: null
        })
      };
    }
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    let errorDetails = {
      message: error.message
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
      console.log('Detalhes completos do erro:', JSON.stringify(error.response.data));
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro ao processar requisição',
        details: errorDetails
      })
    };
  }
};

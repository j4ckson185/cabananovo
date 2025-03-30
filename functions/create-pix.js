const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me
const API_KEY = 'sk_test_74a124ada92a4702beba69c65335c168';
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
    
    // Criar o cliente primeiro
    const customerData = {
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
    };
    
    console.log('Criando cliente:', JSON.stringify(customerData));
    
    // Configurar autenticação
    const auth = Buffer.from(`${API_KEY}:`).toString('base64');
    const authHeaders = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // Criar cliente
    const customerResponse = await axios.post(`${API_URL}/customers`, customerData, {
      headers: authHeaders
    });
    
    console.log('Cliente criado:', JSON.stringify(customerResponse.data));
    
    // Criar a cobrança
    const chargeData = {
      amount: Math.round(parseFloat(requestData.amount) * 100),
      payment_method: "pix",
      pix: {
        expires_in: 3600
      },
      customer_id: customerResponse.data.id,
      metadata: {
        order_description: requestData.description || "Pedido Cabana Açaí" 
      }
    };
    
    console.log('Criando cobrança:', JSON.stringify(chargeData));
    
    const chargeResponse = await axios.post(`${API_URL}/charges`, chargeData, {
      headers: authHeaders
    });
    
    console.log('Cobrança criada:', JSON.stringify(chargeResponse.data));
    
    // Verificar se a cobrança foi criada com sucesso
    if (chargeResponse.data.status === 'pending' && 
        chargeResponse.data.last_transaction && 
        chargeResponse.data.last_transaction.qr_code) {
      
      const transaction = chargeResponse.data.last_transaction;
      
      // Retornar os dados do PIX
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: chargeResponse.data.id,
          status: chargeResponse.data.status,
          pixCode: transaction.qr_code,
          pixQrCodeUrl: transaction.qr_code_url,
          expiresAt: transaction.expires_at
        })
      };
    } else {
      // Se houve algum problema
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'failed',
          orderId: chargeResponse.data.id,
          error: 'Falha ao criar cobrança PIX',
          errorDetails: chargeResponse.data.last_transaction?.gateway_response || chargeResponse.data,
          expiresAt: chargeResponse.data.last_transaction?.expires_at
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

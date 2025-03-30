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
    
    // Seguindo exatamente a mesma estrutura do Apps Script original
    const orderData = {
      items: [
        {
          amount: Math.round(parseFloat(requestData.amount) * 100),
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
            area_code: areaCode,
            number: phoneNumber
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
    
    // Log da requisição para debug
    console.log('Enviando para Pagar.me:', JSON.stringify(orderData));
    
    // Fazer a requisição para a API do Pagar.me (Orders API)
    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Log da resposta para debug
    console.log('Resposta do Pagar.me:', JSON.stringify(response.data));
    
    // Verificar se a resposta contém as informações necessárias
    if (response.data.charges && 
        response.data.charges.length > 0 && 
        response.data.charges[0].last_transaction && 
        response.data.charges[0].last_transaction.qr_code) {
      
      const transaction = response.data.charges[0].last_transaction;
      
      // Retornar os dados do PIX
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: response.data.id,
          status: response.data.status,
          pixCode: transaction.qr_code,
          pixQrCodeUrl: transaction.qr_code_url,
          expiresAt: transaction.expires_at
        })
      };
    } else {
      // Se houver algum problema
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'failed',
          orderId: response.data.id,
          error: 'Falha ao gerar QR Code PIX',
          errorDetails: response.data.charges && 
                        response.data.charges[0] && 
                        response.data.charges[0].last_transaction ? 
                        response.data.charges[0].last_transaction.gateway_response : response.data,
          expiresAt: response.data.charges && 
                    response.data.charges[0] && 
                    response.data.charges[0].last_transaction ? 
                    response.data.charges[0].last_transaction.expires_at : null
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

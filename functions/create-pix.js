// functions/create-pix.js
const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me
const API_KEY = 'sk_test_74a124ada92a4702beba69c65335c168';
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
    if (!requestData.amount || !requestData.customerName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' })
      };
    }
    
    // Log para debug
    console.log('Dados recebidos:', JSON.stringify(requestData));
    
    // Preparar dados para a API do Pagar.me
    const amountInCents = Math.round(parseFloat(requestData.amount) * 100);
    
    // Extrair código de área e número do telefone com validação
    let areaCode = "00";
    let phoneNumber = "000000000";
    
    if (requestData.customerPhone) {
      const phoneDigits = requestData.customerPhone.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        areaCode = phoneDigits.substring(0, 2);
        phoneNumber = phoneDigits.substring(2);
      }
    }
    
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
    
    // Log para debug
    console.log('Enviando para Pagar.me:', JSON.stringify(pagarmeData));
    
    // Fazer a requisição para a API do Pagar.me
    const response = await axios.post(`${API_URL}/orders`, pagarmeData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Log para debug
    console.log('Resposta do Pagar.me:', JSON.stringify(response.data));
    
    // Verificar se há erros na resposta
    if (response.data.status === 'failed') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'failed',
          orderId: response.data.id,
          error: 'Falha ao criar pedido no Pagar.me',
          errorDetails: response.data.charges ? response.data.charges[0]?.last_transaction?.gateway_response : null,
          expiresAt: response.data.charges?.[0]?.last_transaction?.expires_at || null
        })
      };
    }
    
    // Verificar se a resposta contém as informações necessárias
    if (!response.data.charges || 
        response.data.charges.length === 0 || 
        !response.data.charges[0].last_transaction ||
        !response.data.charges[0].last_transaction.qr_code) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Formato de resposta inesperado da API Pagar.me',
          response: response.data
        })
      };
    }
    
    // Extrair dados do PIX
    const transaction = response.data.charges[0].last_transaction;
    
    const result = {
      orderId: response.data.id,
      status: response.data.status,
      pixCode: transaction.qr_code,
      pixQrCodeUrl: transaction.qr_code_url,
      expiresAt: transaction.expires_at
    };
    
    // Retornar resultado
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    let errorDetails = {
      message: error.message
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
      
      // Log detalhado para depuração
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

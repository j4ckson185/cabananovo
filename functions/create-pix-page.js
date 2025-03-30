const axios = require('axios');
const { Buffer } = require('buffer');

// Configuração da API Pagar.me
const API_KEY = 'sk_test_74a124ada92a4702beba69c65335c168';
const API_URL = 'https://api.pagar.me/core/v5';

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8'
  };
  
  try {
    const params = event.queryStringParameters || {};
    
    // Validar parâmetros necessários
    if (!params.amount || !params.customerName) {
      return {
        statusCode: 400,
        headers,
        body: `
          <html>
            <head>
              <title>Erro - Parâmetros Insuficientes</title>
            </head>
            <body>
              <h1>Erro: Parâmetros insuficientes</h1>
              <p>Volte ao site e tente novamente.</p>
              <button onclick="window.close()">Fechar</button>
            </body>
          </html>
        `
      };
    }
    
    // Extrair código de área e número
    let areaCode = "11";
    let phoneNumber = "999999999";
    
    if (params.customerPhone) {
      const phoneDigits = params.customerPhone.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        areaCode = phoneDigits.substring(0, 2);
        phoneNumber = phoneDigits.substring(2);
      }
    }
    
    // Criar pedido seguindo o formato original
    const orderData = {
      items: [
        {
          amount: Math.round(parseFloat(params.amount) * 100),
          description: params.description || "Pedido Cabana Açaí",
          quantity: 1
        }
      ],
      customer: {
        name: params.customerName,
        email: params.customerEmail || "cliente@cabanaacai.com.br",
        type: "individual",
        document: params.customerDocument || "00000000000",
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
    
    // Configurar autenticação
    const auth = Buffer.from(`${API_KEY}:`).toString('base64');
    
    // Fazer a requisição
    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Verificar se a resposta contém as informações do PIX
    if (!response.data.charges || 
        response.data.charges.length === 0 || 
        !response.data.charges[0].last_transaction || 
        !response.data.charges[0].last_transaction.qr_code) {
      
      return {
        statusCode: 400,
        headers,
        body: `
          <html>
            <head>
              <title>Erro - Falha ao Gerar PIX</title>
            </head>
            <body>
              <h1>Erro: Falha ao gerar PIX</h1>
              <p>Ocorreu um erro ao tentar gerar o PIX: ${JSON.stringify(response.data)}</p>
              <button onclick="window.close()">Fechar</button>
            </body>
          </html>
        `
      };
    }
    
    // Extrair dados do PIX
    const transaction = response.data.charges[0].last_transaction;
    const pixCode = transaction.qr_code;
    const pixQrCodeUrl = transaction.qr_code_url;
    const expiresAt = new Date(transaction.expires_at);
    const now = new Date();
    const expirationMinutes = Math.floor((expiresAt - now) / 60000);
    
    const returnUrl = params.returnUrl || '/';
    
    // Retornar página HTML com QR Code
    return {
      statusCode: 200,
      headers,
      body: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento PIX - Cabana Açaí</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background-color: #10002B;
                    color: #E0AAFF;
                    line-height: 1.6;
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .container {
                    max-width: 600px;
                    background-color: #240046;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    padding: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .header h1 {
                    color: white;
                    margin-bottom: 10px;
                }
                
                .success-message {
                    background-color: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .qr-code-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 20px 0;
                }
                
                .qr-code-container img {
                    max-width: 200px;
                    margin-bottom: 15px;
                    background: white;
                    padding: 10px;
                    border-radius: 8px;
                }
                
                .pix-code-container {
                    background-color: rgba(255, 255, 255, 0.1);
                    border: 1px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 15px;
                    margin: 20px 0;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 14px;
                    position: relative;
                }
                
                .button-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                button {
                    background: linear-gradient(135deg, #F72585 0%, #7209B7 50%, #3A0CA3 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
                }
                
                .secondary-button {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .expiration {
                    text-align: center;
                    margin: 20px 0;
                    color: #F72585;
                    font-weight: 600;
                }
                
                .order-details {
                    background-color: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: 15px;
                    margin: 20px 0;
                }
                
                .order-details h3 {
                    margin-bottom: 10px;
                    color: white;
                }
                
                .instructions {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: rgba(255, 255, 255, 0.05);
                    border-left: 4px solid #7209B7;
                    border-radius: 4px;
                }
                
                .instructions h3 {
                    margin-bottom: 10px;
                    color: white;
                }
                
                .instructions ol {
                    margin-left: 20px;
                }
                
                .instructions li {
                    margin-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Cabana Açaí</h1>
                    <p>Pagamento via PIX</p>
                </div>
                
                <div class="success-message">
                    PIX gerado com sucesso! Use um dos métodos abaixo para pagar.
                </div>
                
                <div class="order-details">
                    <h3>Detalhes do Pedido</h3>
                    <p><strong>Valor:</strong> R$ ${parseFloat(params.amount).toFixed(2)}</p>
                    <p><strong>Cliente:</strong> ${params.customerName}</p>
                </div>
                
                <div class="qr-code-container">
                    <img src="${pixQrCodeUrl}" alt="QR Code PIX">
                    <p>Escaneie o QR Code usando o app do seu banco</p>
                </div>
                
                <h3>Ou use o PIX Copia e Cola:</h3>
                <div class="pix-code-container" onclick="copyPixCode()">
                    <pre id="pix-code">${pixCode}</pre>
                </div>
                <div style="text-align: center;">
                    <button onclick="copyPixCode()">Copiar Código PIX</button>
                </div>
                
                <div class="expiration">
                    Código válido por ${expirationMinutes} minutos
                </div>
                
                <div class="instructions">
                    <h3>Como pagar:</h3>
                    <ol>
                        <li>Abra o aplicativo do seu banco</li>
                        <li>Escolha a opção "PIX Copia e Cola" ou escaneie o QR Code</li>
                        <li>Confira os dados e confirme o pagamento</li>
                        <li>Após o pagamento, clique no botão "Já paguei" abaixo</li>
                    </ol>
                </div>
                
                <div class="button-container">
                    <button onclick="completePurchase()">Já paguei, finalizar pedido</button>
                    <button class="secondary-button" onclick="window.close()">Fechar janela</button>
                </div>
                
                <script>
                function copyPixCode() {
                    const pixCode = document.getElementById('pix-code').textContent;
                    navigator.clipboard.writeText(pixCode)
                        .then(() => {
                            alert('Código PIX copiado!');
                        })
                        .catch(err => {
                            console.error('Erro ao copiar:', err);
                            alert('Não foi possível copiar automaticamente. Por favor, selecione o código manualmente e copie.');
                        });
                }
                
                function completePurchase() {
                    try {
                        // Notificar janela principal que o pagamento foi concluído
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage('PIX_PAYMENT_COMPLETED', '*');
                        }
                        
                        // Redirecionar para a página principal
                        window.location.href = '${returnUrl}';
                    } catch (e) {
                        console.error('Erro ao comunicar com janela principal:', e);
                        alert('Pagamento registrado com sucesso! Você pode fechar esta janela e continuar seu pedido.');
                    }
                }
                </script>
            </div>
        </body>
        </html>
      `
    };
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return {
      statusCode: 500,
      headers,
      body: `
        <html>
          <head>
            <title>Erro - Falha na Requisição</title>
          </head>
          <body>
            <h1>Erro ao processar requisição</h1>
            <p>${error.message}</p>
            <p>Detalhes: ${JSON.stringify(error.response ? error.response.data : 'N/A')}</p>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `
    };
  }
};

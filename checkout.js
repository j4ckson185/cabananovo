// checkout.js

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function openCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    const orderSummary = document.getElementById('orderSummary');
    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    orderSummary.innerHTML = `
        <h3>Resumo do Pedido</h3>
        ${cart.map(item => `
            <p>${item.name} - R$ ${item.totalPrice.toFixed(2)}</p>
        `).join('')}
        <h4>Total: R$ ${total.toFixed(2)}</h4>
    `;

    checkoutModal.style.display = "block";
}

function processOrder(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    const order = {
        customer: { name, phone, email, address },
        items: cart,
        total: cart.reduce((sum, item) => sum + item.totalPrice, 0),
        paymentMethod: paymentMethod,
        orderDate: new Date().toISOString()
    };

    // Simulação de envio do pedido para um servidor
    setTimeout(() => {
        alert(`Pedido realizado com sucesso!\nNúmero do pedido: ${Math.floor(Math.random() * 1000000)}`);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        closeCheckoutModal();
        document.getElementById('checkoutForm').reset();
    }, 1500);
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = "none";
}

// Exportar funções para uso global
window.openCheckoutModal = openCheckoutModal;
window.processOrder = processOrder;
window.closeCheckoutModal = closeCheckoutModal;
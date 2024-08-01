// Admin panel functionality
const categoryManagerContainer = document.getElementById('category-manager');
const orderManagerContainer = document.getElementById('order-manager');

async function fetchCategories() {
    const response = await fetch('/api/categories');
    return await response.json();
}

async function fetchOrders() {
    const response = await fetch('/api/orders');
    return await response.json();
}

function renderCategoryManager(categories) {
    categoryManagerContainer.innerHTML = `
        <h2>Gerenciar Categorias</h2>
        ${categories.map(category => `
            <div>
                <h3>${category.name}</h3>
                <button onclick="deleteCategory(${category.id})">Excluir</button>
                ${renderItemManager(category)}
            </div>
        `).join('')}
        <input type="text" id="new-category-name" placeholder="Nome da nova categoria">
        <button onclick="addCategory()">Adicionar Categoria</button>
    `;
}

function renderItemManager(category) {
    return `
        <div class="item-manager">
            <h3>Itens</h3>
            ${category.items.map(item => `
                <div>
                    <span>${item.name} - R$ ${item.price.toFixed(2)}</span>
                    <button onclick="deleteItem(${category.id}, ${item.id})">Excluir</button>
                </div>
            `).join('')}
            <input type="text" id="new-item-name-${category.id}" placeholder="Nome do novo item">
            <input type="text" id="new-item-description-${category.id}" placeholder="Descrição">
            <input type="number" id="new-item-price-${category.id}" placeholder="Preço">
            <button onclick="addItem(${category.id})">Adicionar Item</button>
        </div>
    `;
}

function renderOrderManager(orders) {
    const orderColumns = {
        'Em preparo': orders.filter(o => o.status === 'Em preparo'),
        'Saiu para entrega': orders.filter(o => o.status === 'Saiu para entrega'),
        'Finalizados': orders.filter(o => o.status === 'Finalizados')
    };

    orderManagerContainer.innerHTML = `
        <h2>Gestor de Pedidos</h2>
        <div class="order-columns">
            ${Object.entries(orderColumns).map(([status, orders]) => `
                <div class="order-column">
                    <h3>${status}</h3>
                    ${orders.map(order => `
                        <div class="order-card">
                            <h4>Pedido #${order.id}</h4>
                            <p>Total: R$ ${order.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</p>
                            <ul>
                                ${order.items.map(item => `<li>${item.name}</li>`).join('')}
                            </ul>
                            ${status !== 'Finalizados' ? `
                                <button onclick="moveOrder(${order.id}, '${status === 'Em preparo' ? 'Saiu para entrega' : 'Finalizados'}')">
                                    Avançar
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

async function addCategory() {
    const name = document.getElementById('new-category-name').value;
    await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, items: [] })
    });
    updateAdminPanel();
}

async function deleteCategory(id) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    updateAdminPanel();
}

async function addItem(categoryId) {
    const name = document.getElementById(`new-item-name-${categoryId}`).value;
    const description = document.getElementById(`new-item-description-${categoryId}`).value;
    const price = parseFloat(document.getElementById(`new-item-price-${categoryId}`).value);
    await fetch(`/api/categories/${categoryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price, customizationOptions: [] })
    });
    updateAdminPanel();
}

async function deleteItem(categoryId, itemId) {
    await fetch(`/api/categories/${categoryId}/items/${itemId}`, { method: 'DELETE' });
    updateAdminPanel();
}

async function moveOrder(orderId, newStatus) {
    await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    updateAdminPanel();
}

async function updateAdminPanel() {
    const categories = await fetchCategories();
    const orders = await fetchOrders();
    renderCategoryManager(categories);
    renderOrderManager(orders);
}

updateAdminPanel();
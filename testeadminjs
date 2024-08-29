const firebaseConfig = {
    apiKey: "AIzaSyB-pF2lRStLTN9Xw9aYQj962qdNFyUXI2E",
    authDomain: "cabana-8d55e.firebaseapp.com",
    databaseURL: "https://cabana-8d55e-default-rtdb.firebaseio.com",
    projectId: "cabana-8d55e",
    storageBucket: "cabana-8d55e.appspot.com",
    messagingSenderId: "706144237954",
    appId: "1:706144237954:web:345c10370972486afc779b",
    measurementId: "G-96Y337GYT8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let categories = [];
let products = [];
let customers = [];
let editingProductId = null;

async function fetchCategories() {
    const response = await fetch('/api/categories');
    return await response.json();
}

async function fetchProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateProductsList();
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
    }
}

async function fetchCustomers() {
    try {
        const snapshot = await db.collection('customers').get();
        customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCustomersList();
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
    }
}

async function fetchHours() {
    try {
        const doc = await db.collection('settings').doc('hours').get();
        if (doc.exists) {
            const hours = doc.data();
            for (const day in hours) {
                if (hours.hasOwnProperty(day)) {
                    const element = document.getElementById(day);
                    if (element) {
                        element.value = hours[day];
                    }
                }
            }
        }
    } catch (error) {
        console.error("Erro ao buscar horários:", error);
    }
}

document.getElementById('hoursForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const hours = {
        mondayOpen: document.getElementById('mondayOpen').value,
        mondayClose: document.getElementById('mondayClose').value,
        tuesdayOpen: document.getElementById('tuesdayOpen').value,
        tuesdayClose: document.getElementById('tuesdayClose').value,
        wednesdayOpen: document.getElementById('wednesdayOpen').value,
        wednesdayClose: document.getElementById('wednesdayClose').value,
        thursdayOpen: document.getElementById('thursdayOpen').value,
        thursdayClose: document.getElementById('thursdayClose').value,
        fridayOpen: document.getElementById('fridayOpen').value,
        fridayClose: document.getElementById('fridayClose').value,
        saturdayOpen: document.getElementById('saturdayOpen').value,
        saturdayClose: document.getElementById('saturdayClose').value,
        sundayOpen: document.getElementById('sundayOpen').value,
        sundayClose: document.getElementById('sundayClose').value,
    };
    try {
        await db.collection('settings').doc('hours').set(hours);
        alert('Horários de funcionamento salvos com sucesso!');
    } catch (error) {
        console.error("Erro ao salvar horários:", error);
        alert('Erro ao salvar horários. Por favor, tente novamente.');
    }
});

function addExtraItem() {
    const extrasContainer = document.getElementById('extrasContainer');
    const extraDiv = document.createElement('div');
    extraDiv.innerHTML = `
        <input type="text" placeholder="Nome do Item Extra" required>
        <input type="number" placeholder="Preço do Item Extra" step="0.01" required>
        <button type="button" onclick="this.parentElement.remove()">Remover</button>
    `;
    extrasContainer.appendChild(extraDiv);
}

document.getElementById('addCategoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const categoryName = document.getElementById('categoryName').value;
    try {
        await db.collection('categories').add({ name: categoryName });
        alert('Categoria adicionada com sucesso!');
        fetchCategories();
    } catch (error) {
        console.error("Erro ao adicionar categoria:", error);
        alert('Erro ao adicionar categoria. Por favor, tente novamente.');
    }
});

document.getElementById('addProductForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const product = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value,
        image: document.getElementById('productImage').value,
        minAccompaniments: parseInt(document.getElementById('minAccompaniments').value),
        maxAccompaniments: parseInt(document.getElementById('maxAccompaniments').value),
        accompaniments: document.getElementById('accompaniments').value.split('\n'),
        extras: Array.from(document.getElementById('extrasContainer').children).map(div => ({
            name: div.children[0].value,
            price: parseFloat(div.children[1].value)
        }))
    };

    try {
        if (editingProductId) {
            await db.collection('products').doc(editingProductId).update(product);
            editingProductId = null;
            alert('Produto atualizado com sucesso!');
        } else {
            await db.collection('products').add(product);
            alert('Produto adicionado com sucesso!');
        }
        this.reset();
        document.getElementById('extrasContainer').innerHTML = '';
        addExtraItem();
        fetchProducts();
    } catch (error) {
        console.error("Erro ao adicionar/atualizar produto:", error);
        alert('Erro ao adicionar/atualizar produto. Por favor, tente novamente.');
    }
});

function updateCategoriesList() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = categories.map(category => `
        <div class="category-item">
            ${category.name}
            <button class="delete-btn" onclick="deleteCategory('${category.id}')">Deletar</button>
        </div>
    `).join('');
}

function updateCategorySelect() {
    const categorySelect = document.getElementById('productCategory');
    categorySelect.innerHTML = categories.map(category => `
        <option value="${category.name}">${category.name}</option>
    `).join('');
}

function updateProductsList() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = products.map(product => `
        <div class="product-item">
            <h3>${product.name}</h3>
            <p>Preço: R$ ${product.price.toFixed(2)}</p>
            <p>Categoria: ${product.category}</p>
            <button class="edit-btn" onclick="editProduct('${product.id}')">Editar</button>
            <button class="delete-btn" onclick="deleteProduct('${product.id}')">Deletar</button>
        </div>
    `).join('');
}

function updateCustomersList() {
    const customersList = document.getElementById('customersList');
    customersList.innerHTML = customers.map(customer => `
        <div class="customer-item">
            <h3>${customer.name}</h3>
            <p>WhatsApp: ${customer.phone}</p>
            <p>Pontos Fidelidade: ${customer.orderCount || 0}</p>
            <input type="number" id="loyaltyPoints-${customer.id}" value="${customer.orderCount || 0}">
            <button onclick="updateLoyaltyPoints('${customer.id}')">Atualizar Pontos</button>
        </div>
    `).join('');
}

async function deleteCategory(categoryId) {
    if (confirm('Tem certeza que deseja deletar esta categoria?')) {
        try {
            await db.collection('categories').doc(categoryId).delete();
            fetchCategories();
        } catch (error) {
            console.error("Erro ao deletar categoria:", error);
            alert('Erro ao deletar categoria. Por favor, tente novamente.');
        }
    }
}

async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productImage').value = product.image;
        document.getElementById('minAccompaniments').value = product.minAccompaniments;
        document.getElementById('maxAccompaniments').value = product.maxAccompaniments;
        document.getElementById('accompaniments').value = product.accompaniments.join('\n');
        
        const extrasContainer = document.getElementById('extrasContainer');
        extrasContainer.innerHTML = '';
        product.extras.forEach(extra => {
            const extraDiv = document.createElement('div');
            extraDiv.innerHTML = `
                <input type="text" value="${extra.name}" required>
                <input type="number" value="${extra.price}" step="0.01" required>
                <button type="button" onclick="this.parentElement.remove()">Remover</button>
            `;
            extrasContainer.appendChild(extraDiv);
        });
        editingProductId = productId;
    }
}

async function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
        try {
            await db.collection('products').doc(productId).delete();
            fetchProducts();
        } catch (error) {
            console.error("Erro ao deletar produto:", error);
            alert('Erro ao deletar produto. Por favor, tente novamente.');
        }
    }
}

async function updateLoyaltyPoints(customerId) {
    const newPoints = document.getElementById(`loyaltyPoints-${customerId}`).value;
    try {
        await db.collection('customers').doc(customerId).update({
            orderCount: parseInt(newPoints)
        });
        alert('Pontos de fidelidade atualizados com sucesso!');
        fetchCustomers();
    } catch (error) {
        console.error("Erro ao atualizar pontos de fidelidade:", error);
        alert('Erro ao atualizar pontos de fidelidade. Por favor, tente novamente.');
    }
}

// Initialize
addExtraItem();
fetchCategories();
fetchProducts();
fetchCustomers();
fetchHours();

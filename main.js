const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const productListContainer = document.getElementById('product-list');
const cartCountElement = document.getElementById('cart-count');


function getCart() {
    return JSON.parse(localStorage.getItem('prudenteConectaCart')) || [];
}


function saveCart(cart) {
    localStorage.setItem('prudenteConectaCart', JSON.stringify(cart));
    updateCartCount();
}


function addToCart(productId, productName) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    saveCart(cart);
    alert(`${productName} foi adicionado ao carrinho!`);
}


function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
}



async function loadProducts() {
    const { data, error } = await supabase
        .from('produtos')
        .select(`id, nome, preco, unidade, imagem_url, produtores(nome)`)
        .eq('disponivel', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        productListContainer.innerHTML = '<p class="error-message">Erro ao carregar produtos.</p>';
        return;
    }

    productListContainer.innerHTML = '';

    const productCards = data.map(product => {
        const imageUrl = product.imagem_url || 'https://via.placeholder.com/300x200.png?text=Produto+Local';
        const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);

        return `
            <div class="product-card">
                <img src="${imageUrl}" alt="Foto de ${product.nome}">
                <div class="product-info">
                    <span class="product-price">${formattedPrice}</span>
                    <h4 class="product-name">${product.nome}</h4>
                    <p class="product-producer">de: ${product.produtores.nome}</p>
                </div>
                <button class="btn btn-primary" data-product-id="${product.id}" data-product-name="${product.nome}">Adicionar</button>
            </div>
        `;
    }).join('');

    productListContainer.innerHTML = productCards;
}


document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
});


productListContainer.addEventListener('click', (event) => {
    const targetButton = event.target.closest('button[data-product-id]');
    if (targetButton) {
        const productId = targetButton.dataset.productId;
        const productName = targetButton.dataset.productName;
        addToCart(productId, productName);
    }
});

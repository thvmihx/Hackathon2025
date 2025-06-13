// URL e chave da API do Supabase
const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // (truncado por segurança)

// Criação do cliente Supabase para interação com o banco de dados
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Seleciona os elementos do DOM para manipulação futura
const productListContainer = document.getElementById('product-list');
const cartCountElement = document.getElementById('cart-count');

/**
 * Recupera o carrinho salvo no localStorage do navegador.
 * Se não houver carrinho, retorna um array vazio.
 */
function getCart() {
    return JSON.parse(localStorage.getItem('prudenteConectaCart')) || [];
}

/**
 * Salva o carrinho atualizado no localStorage
 * e atualiza a contagem de itens exibida.
 */
function saveCart(cart) {
    localStorage.setItem('prudenteConectaCart', JSON.stringify(cart));
    updateCartCount();
}

/**
 * Adiciona um produto ao carrinho local.
 * Se o produto já estiver no carrinho, aumenta a quantidade.
 * Exibe um alerta confirmando a adição.
 */
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

/**
 * Atualiza o número total de itens no carrinho e exibe no contador da interface.
 */
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
}

/**
 * Carrega os produtos disponíveis do Supabase
 * e os exibe na interface em forma de cards com imagem, nome, preço e botão de adicionar.
 */
async function loadProducts() {
    const { data, error } = await supabase
        .from('produtos')
        .select(`id, nome, preco, unidade, imagem_url, produtores(nome)`) // busca os campos desejados
        .eq('disponivel', true) // filtra apenas os produtos disponíveis
        .order('created_at', { ascending: false }); // ordena por data de criação, do mais recente para o mais antigo

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        productListContainer.innerHTML = '<p class="error-message">Erro ao carregar produtos.</p>';
        return;
    }

    productListContainer.innerHTML = ''; // Limpa o conteúdo anterior

    // Mapeia os produtos em HTML e os insere na página
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

// Quando a página termina de carregar, busca os produtos e atualiza o contador do carrinho
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
});

/**
 * Escuta os cliques nos botões de "Adicionar"
 * e adiciona o produto correspondente ao carrinho.
 */
productListContainer.addEventListener('click', (event) => {
    const targetButton = event.target.closest('button[data-product-id]');
    if (targetButton) {
        const productId = targetButton.dataset.productId;
        const productName = targetButton.dataset.productName;
        addToCart(productId, productName);
    }
});

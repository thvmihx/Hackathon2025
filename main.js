
const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U'; // Sua Anon Key Pública

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const productListContainer = document.getElementById('product-list');
const cartCountElement = document.getElementById('cart-count');
const userAuthLink = document.getElementById('user-auth-link');
const producerButton = document.getElementById('producer-btn');

function showToast(message) {

    const toast = document.getElementById('toast-notification');

    if (!toast) {

        console.warn('Elemento #toast-notification não encontrado no HTML.');

        alert(message);

        return;

    }
    toast.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {

        toast.classList.remove('show');

    }, 3000);

}

function getCart() {

    return JSON.parse(localStorage.getItem('prudenteConectaCart')) || [];

}

function saveCart(cart) {

    localStorage.setItem('prudenteConectaCart', JSON.stringify(cart));

    updateCartCount();

}

function addToCart(productId, productName, buttonElement) {

    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({ id: productId, name: productName, quantity: 1 });

    }

    saveCart(cart);
    showToast(`${productName} foi adicionado ao carrinho!`);

}

function updateCartCount() {

    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCountElement) cartCountElement.textContent = totalItems;

}

async function loadProducts() {

    if (!productListContainer) return;
    productListContainer.innerHTML = '<p>Carregando produtos fresquinhos...</p>';

    const { data, error } = await supabase

        .from('produtos')
        .select(`id, nome, preco, unidade, imagem_url, produtores(nome)`)
        .eq('disponivel', true)
        .order('created_at', { ascending: false });

    if (error) {

        console.error('Erro ao buscar produtos:', error);

        productListContainer.innerHTML = '<p class="error-message">Ops! Tivemos um problema ao carregar os produtos. Tente novamente mais tarde.</p>';

        return;

    }

    if (data.length === 0) {

        productListContainer.innerHTML = '<p>Nenhum produto disponível no momento. Volte em breve!</p>';

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
                    <p class="product-producer">de: ${product.produtores ? product.produtores.nome : 'Produtor Desconhecido'}</p>
                </div>
                <button class="btn btn-primary" data-product-id="${product.id}" data-product-name="${product.nome}">Adicionar</button>
            </div>
        `;

    }).join('');

    productListContainer.innerHTML = productCards;
}

if (productListContainer) {

    productListContainer.addEventListener('click', (event) => {

        const targetButton = event.target.closest('button[data-product-id]');

        if (targetButton) {
            targetButton.disabled = true;
            targetButton.textContent = 'Adicionado!';

            const productId = targetButton.dataset.productId;
            const productName = targetButton.dataset.productName;

            addToCart(productId, productName, targetButton);

            setTimeout(() => {
                targetButton.disabled = false;
                targetButton.textContent = 'Adicionar';

            }, 1500);

        }

    });

}

async function updateUserAuthState(user) {
    if (!userAuthLink || !producerButton) {
        console.error("Elementos de autenticação do cabeçalho não encontrados.");
        return;
    }

    if (user) {

        producerButton.style.display = 'none';

        const { data: produtorData, error: produtorError } = await supabase

            .from('produtores')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (produtorError && produtorError.code !== 'PGRST116') {

            console.error('Erro ao verificar perfil de produtor:', produtorError);

        }

        if (produtorData) {

            userAuthLink.href = 'producer.html';
            userAuthLink.innerHTML = `
                <span class="icon">🧑‍🌾</span> <!-- Ícone para produtor -->
                <span class="text">Painel Produtor</span>
            `;

        } else {

            userAuthLink.href = 'account.html';
            userAuthLink.innerHTML = `
                <span class="icon">👤</span>
                <span class="text">Minha Conta</span>
            `;

        }


        if (!document.getElementById('logout-button')) {

            const logoutButton = document.createElement('a');

            logoutButton.id = 'logout-button';
            logoutButton.href = '#';
            logoutButton.className = 'btn btn-secondary btn-small';
            logoutButton.textContent = 'Sair';

            logoutButton.onclick = async (e) => { e.preventDefault();

                const { error } = await supabase.auth.signOut();
                if (error) console.error('Erro ao fazer logout:', error);
                
            };

            const headerButtonsDiv = document.querySelector('.header-buttons');

            if (headerButtonsDiv) {
                
                const fazerPedidoBtn = headerButtonsDiv.querySelector('.btn-primary');

                if(fazerPedidoBtn){

                    headerButtonsDiv.insertBefore(logoutButton, fazerPedidoBtn.nextSibling);

                } else {

                    headerButtonsDiv.appendChild(logoutButton);

                }

            }

        }

    } else {

        userAuthLink.href = 'login.html';
        userAuthLink.innerHTML = `
            <span class="icon">👤</span>
            <span class="text">Entrar</span>
        `;

        producerButton.style.display = '';

        const logoutButton = document.getElementById('logout-button');

        if (logoutButton) logoutButton.remove();

    }

}


supabase.auth.onAuthStateChange(async (event, session) => {

    if (event === "SIGNED_OUT" || event === "USER_DELETED") {

        localStorage.removeItem('userProfileType');

        updateUserAuthState(null);

        window.location.replace('index.html');

    } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {

        updateUserAuthState(session?.user || null);

    }

});


document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session } } = await supabase.auth.getSession();

    await updateUserAuthState(session?.user || null);

    if (typeof loadProducts === 'function') loadProducts();

    if (typeof updateCartCount === 'function') updateCartCount();
    
});
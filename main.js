const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const productListContainer = document.getElementById('product-list');
const cartCountElement = document.getElementById('cart-count');
const userAuthLink = document.getElementById('user-auth-link');
const producerButton = document.getElementById('producer-btn');
const hamburgerMenu = document.querySelector('.hamburger-menu');
const mainNav = document.querySelector('.main-nav');

let productSwiper = null;

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) {
        console.warn('Elemento #toast-notification não encontrado no HTML.');
        console.log('Toast Message (element not found):', message);
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function getCart() {
    try {
        const cartString = localStorage.getItem('prudenteConectaCart');
        return cartString ? JSON.parse(cartString) : [];
    } catch (e) {
        console.error("Erro ao ler carrinho do localStorage:", e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem('prudenteConectaCart', JSON.stringify(cart));
        updateCartCount();
    } catch (e) {
        console.error("Erro ao salvar carrinho no localStorage:", e);
    }
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
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

async function loadProducts() {
    if (!productListContainer) {
        console.warn("Elemento para lista de produtos (#product-list) não encontrado.");
        return;
    }
    
    const isSlider = typeof Swiper !== 'undefined' && document.querySelector('.product-slider');
    let placeholderHTML = '<p>Carregando produtos fresquinhos...</p>';
    if (isSlider) {
        placeholderHTML = `<div class="swiper-slide">${placeholderHTML}</div>`;
    }
    productListContainer.innerHTML = placeholderHTML;

    const { data, error } = await supabase
        .from('produtos')
        .select(`id, nome, preco, unidade, imagem_url, produtores(nome)`)
        .eq('disponivel', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        let errorMsg = '<p class="error-message">Ops! Tivemos um problema ao carregar os produtos. Tente novamente mais tarde.</p>';
        if (isSlider) errorMsg = `<div class="swiper-slide">${errorMsg}</div>`;
        productListContainer.innerHTML = errorMsg;
        return;
    }

    if (data.length === 0) {
        let noProductsMsg = '<p>Nenhum produto disponível no momento. Volte em breve!</p>';
        if (isSlider) noProductsMsg = `<div class="swiper-slide">${noProductsMsg}</div>`;
        productListContainer.innerHTML = noProductsMsg;
        return;
    }

    productListContainer.innerHTML = '';

    const productContentHTML = data.map(product => {
        const imageUrl = product.imagem_url || 'https://via.placeholder.com/300x200.png?text=Produto+Local';
        const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);

        const cardHTML = `
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
        return isSlider ? `<div class="swiper-slide">${cardHTML}</div>` : cardHTML;
    }).join('');

    productListContainer.innerHTML = productContentHTML;

    if (isSlider) {
        if (productSwiper) {
            productSwiper.destroy(true, true); 
        }
        try {
            productSwiper = new Swiper('.product-slider', {
                slidesPerView: 1,
                spaceBetween: 20,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                breakpoints: {
                    576: { slidesPerView: 2, spaceBetween: 20 },
                    768: { slidesPerView: 2.5, spaceBetween: 25 },
                    992: { slidesPerView: 3, spaceBetween: 30 },
                    1200: { slidesPerView: 3.5, spaceBetween: 30 }
                }
            });
        } catch (e) {
            console.error("Erro ao inicializar Swiper:", e);
        }
    }
}

const productsEventContainer = document.querySelector('.swiper.product-slider') || productListContainer;
if (productsEventContainer) {
    productsEventContainer.addEventListener('click', (event) => {
        const targetButton = event.target.closest('button[data-product-id]');
        if (targetButton && targetButton.classList.contains('btn-primary')) {
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
    if (!userAuthLink) {
        console.error("Elemento userAuthLink (#user-auth-link) não encontrado.");
        return;
    }

    if (user) {
        if (producerButton) producerButton.style.display = 'none';

        let userProfile = null;
        let profileError = null;
        let isProducer = false;

        ({ data: userProfile, error: profileError } = await supabase
            .from('produtores')
            .select('id')
            .eq('user_id', user.id)
            .single());
        
        if (userProfile) {
            isProducer = true;
        } else if (profileError && profileError.code !== 'PGRST116') {
            console.error('Erro ao verificar perfil de produtor:', profileError);
        }

        if (isProducer) {
            userAuthLink.href = 'produtor.html';
            userAuthLink.innerHTML = `
                <span class="icon">🧑‍🌾</span>
                <span class="text">Painel Produtor</span>
            `;
        } else {
            userAuthLink.href = 'conta.html';
            userAuthLink.innerHTML = `
                <span class="icon">👤</span>
                <span class="text">Minha Conta</span>
            `;
        }
        
        const headerActionsDiv = userAuthLink.closest('.header-actions');
        if (headerActionsDiv && !headerActionsDiv.querySelector('#logout-button')) {
            const logoutButton = document.createElement('a');
            logoutButton.id = 'logout-button';
            logoutButton.href = '#';
            logoutButton.className = 'btn btn-secondary btn-small';
            logoutButton.textContent = 'Sair';
            
            logoutButton.onclick = async (e) => {
                e.preventDefault();
                const { error: signOutError } = await supabase.auth.signOut();
                if (signOutError) console.error('Erro ao fazer logout:', signOutError);
            };
            
            const userSessionControls = headerActionsDiv.querySelector('#user-session-controls');
            const existingLogoutButton = headerActionsDiv.querySelector('#logout-button'); // Previne duplicatas
            
            if (!existingLogoutButton) { // Somente adiciona se não existir
                if(userSessionControls && userSessionControls.nextSibling) {
                    userSessionControls.parentNode.insertBefore(logoutButton, userSessionControls.nextSibling);
                } else if (userSessionControls) {
                    userSessionControls.parentNode.appendChild(logoutButton);
                } else { // Fallback mais genérico, pode não ser o ideal para todos os layouts de header
                    const iconsDiv = headerActionsDiv.querySelector('.header-icons');
                    if (iconsDiv) {
                        iconsDiv.appendChild(logoutButton);
                    } else {
                         headerActionsDiv.appendChild(logoutButton);
                    }
                }
            }
        }


    } else {
        userAuthLink.href = 'login.html';
        userAuthLink.innerHTML = `
            <span class="icon">👤</span>
            <span class="text">Entrar</span>
        `;
        if (producerButton) producerButton.style.display = '';

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) logoutButton.remove();
    }
}


supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        await updateUserAuthState(null);
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.replace('index.html');
        }
    } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        await updateUserAuthState(session?.user || null);
    }
});

if (hamburgerMenu && mainNav) {
    hamburgerMenu.addEventListener('click', () => {
        const isExpanded = mainNav.classList.toggle('active');
        hamburgerMenu.setAttribute('aria-expanded', isExpanded);
        if (isExpanded) {
            hamburgerMenu.setAttribute('aria-label', 'Fechar menu');
        } else {
            hamburgerMenu.setAttribute('aria-label', 'Abrir menu');
        }
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error("Erro ao obter sessão inicial:", sessionError);
        await updateUserAuthState(null);
    } else {
        await updateUserAuthState(session?.user || null);
    }

    if (typeof loadProducts === 'function' && productListContainer) {
        loadProducts();
    }
    
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker: Registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker: Registration failed: ', error);
                });
        });
    }
});
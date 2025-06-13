// Dados de conexão com o Supabase
const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co'; 
const SUPABASE_KEY = '...'; // Chave secreta do Supabase (atenção: isso deve estar seguro no backend em produção)

// Criação do cliente Supabase para fazer requisições
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos do DOM que serão manipulados
const cartItemsList = document.getElementById('cart-items-list');           // Lista de itens do carrinho
const cartTotalElement = document.getElementById('cart-total');             // Elemento que mostra o total
const checkoutSection = document.getElementById('checkout-section');        // Seção de finalização de pedido
const emptyCartMessage = document.getElementById('empty-cart-message');     // Mensagem de carrinho vazio
const checkoutForm = document.getElementById('checkout-form');              // Formulário de checkout

// Função que busca o carrinho salvo no localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('prudenteConectaCart')) || [];
}

// Função que limpa o carrinho do localStorage
function clearCart() {
    localStorage.removeItem('prudenteConectaCart');
}

// Carrega os itens do carrinho e exibe na tela
async function loadCartItems() {
    const cart = getCart(); // Recupera itens

    if (cart.length === 0) {
        // Se carrinho estiver vazio, mostra mensagem apropriada
        cartItemsList.style.display = 'none';
        checkoutSection.style.display = 'none';
        cartTotalElement.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        document.querySelector('.card').style.display = 'none'; 
        return;
    }

    // Busca os produtos no banco pelo ID dos itens no carrinho
    const productIds = cart.map(item => item.id);
    const { data: products, error } = await supabase
        .from('produtos')
        .select('id, nome, preco, imagem_url')
        .in('id', productIds);

    if (error) {
        console.error('Erro ao buscar produtos do carrinho:', error);
        cartItemsList.innerHTML = '<p>Erro ao carregar o carrinho.</p>';
        return;
    }

    // Monta o HTML com os dados dos produtos
    let total = 0;
    cartItemsList.innerHTML = '';
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            total += product.preco * cartItem.quantity;
            const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
            const imageUrl = product.imagem_url || 'https://via.placeholder.com/150x150.png?text=Item';

            cartItemsList.innerHTML += `
                <div class="cart-item">
                    <img src="${imageUrl}" alt="${product.nome}">
                    <div class="cart-item-info">
                        <h4>${product.nome}</h4>
                        <p>Qtd: ${cartItem.quantity} x ${formattedPrice}</p>
                    </div>
                    <span class="item-total">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco * cartItem.quantity)}</span>
                </div>
            `;
        }
    });

    // Mostra o total e exibe a seção de finalização
    cartTotalElement.textContent = `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`;
    checkoutSection.style.display = 'block';
}

// Função que trata o envio do formulário de finalização do pedido
async function handleCheckout(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const cart = getCart(); // Itens do carrinho
    const productIds = cart.map(item => item.id);

    // Busca os preços atualizados dos produtos no banco
    const { data: products } = await supabase
        .from('produtos')
        .select('id, preco')
        .in('id', productIds);

    // Calcula o total com base nos produtos encontrados
    const total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.preco * item.quantity : 0);
    }, 0);

    // Dados do cliente
    const customerName = document.getElementById('customer-name').value;
    const customerContact = document.getElementById('customer-contact').value;

    // Cria o pedido na tabela 'pedidos'
    const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .insert([{
            nome_cliente: customerName,
            contato_cliente: customerContact,
            valor_total: total
        }])
        .select()
        .single(); // retorna um único pedido

    if (orderError) {
        alert("Ocorreu um erro ao criar seu pedido. Tente novamente.");
        console.error("Erro no pedido:", orderError);
        return;
    }

    const orderId = orderData.id;

    // Prepara os itens para salvar em 'pedidos_itens'
    const orderItems = cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        return {
            pedido_id: orderId,
            produto_id: cartItem.id,
            quantidade: cartItem.quantity,
            preco_unitario: product.preco
        };
    });

    // Salva os itens na tabela 'pedidos_itens'
    const { error: itemsError } = await supabase
        .from('pedidos_itens')
        .insert(orderItems);

    if (itemsError) {
        alert("Ocorreu um erro ao salvar os itens do pedido. Contate o suporte.");
        console.error("Erro nos itens do pedido:", itemsError);
        return;
    }

    // Sucesso: limpa carrinho, avisa cliente e redireciona
    alert(`Pedido #${orderId.toString().substring(0, 6)} realizado com sucesso! Entraremos em contato em breve.`);
    clearCart();
    window.location.href = 'index.html';
}

// Ao carregar a página, exibe os itens
document.addEventListener('DOMContentLoaded', loadCartItems);

// Quando o formulário for enviado, executa a finalização
checkoutForm.addEventListener('submit', handleCheckout);

const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = '...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cartItemsList = document.getElementById('cart-items-list');
const cartTotalElement = document.getElementById('cart-total');
const checkoutSection = document.getElementById('checkout-section');
const emptyCartMessage = document.getElementById('empty-cart-message');
const checkoutForm = document.getElementById('checkout-form');

function getCart() {
    return JSON.parse(localStorage.getItem('prudenteConectaCart')) || [];
}

function clearCart() {
    localStorage.removeItem('prudenteConectaCart');
}

async function loadCartItems() {
    const cart = getCart();

    if (cart.length === 0) {
        cartItemsList.style.display = 'none';
        checkoutSection.style.display = 'none';
        cartTotalElement.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        document.querySelector('.card').style.display = 'none';
        return;
    }

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

    cartTotalElement.textContent = `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`;
    checkoutSection.style.display = 'block';
}

async function handleCheckout(event) {
    event.preventDefault();

    const cart = getCart();
    const productIds = cart.map(item => item.id);

    const { data: products } = await supabase
        .from('produtos')
        .select('id, preco')
        .in('id', productIds);

    const total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.preco * item.quantity : 0);
    }, 0);

    const customerName = document.getElementById('customer-name').value;
    const customerContact = document.getElementById('customer-contact').value;

    const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .insert([{
            nome_cliente: customerName,
            contato_cliente: customerContact,
            valor_total: total
        }])
        .select()
        .single();

    if (orderError) {
        alert("Ocorreu um erro ao criar seu pedido. Tente novamente.");
        console.error("Erro no pedido:", orderError);
        return;
    }

    const orderId = orderData.id;

    const orderItems = cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        return {
            pedido_id: orderId,
            produto_id: cartItem.id,
            quantidade: cartItem.quantity,
            preco_unitario: product.preco
        };
    });

    const { error: itemsError } = await supabase
        .from('pedidos_itens')
        .insert(orderItems);

    if (itemsError) {
        alert("Ocorreu um erro ao salvar os itens do pedido. Contate o suporte.");
        console.error("Erro nos itens do pedido:", itemsError);
        return;
    }

    alert(`Pedido #${orderId.toString().substring(0, 6)} realizado com sucesso! Entraremos em contato em breve.`);
    clearCart();
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', loadCartItems);

checkoutForm.addEventListener('submit', handleCheckout);

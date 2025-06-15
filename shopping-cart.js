const SUPABASE_URL = "https://quucktxeoydvitsbtofn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cartItemsList = document.getElementById("cart-items-list");
const cartTotalElement = document.getElementById("cart-total");
const checkoutSection = document.getElementById("checkout-section");
const emptyCartMessage = document.getElementById("empty-cart-message");
const checkoutForm = document.getElementById("checkout-form");
const cartItemsContainer = document.querySelector(".cart-items-container");

function getCart() {
    return JSON.parse(localStorage.getItem("prudenteConectaCart")) || [];
}

function saveCartAndReload(cart) {
    localStorage.setItem("prudenteConectaCart", JSON.stringify(cart));
    loadCartItems();
}

function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter((item) => item.id !== productId);
    saveCartAndReload(cart);
}
function updateQuantity(productId, change) {

    let cart = getCart();

    const item = cart.find((i) => i.id === productId);

    if (item) {

        item.quantity += change;
        
        if (item.quantity <= 0) {

            removeItem(productId);

        } else {

            saveCartAndReload(cart);

        }
        
    }
}

function clearCart() {
    localStorage.removeItem("prudenteConectaCart");
}

async function loadCartItems() {

    const cart = getCart();

    if (cart.length === 0) {

        cartItemsContainer.style.display = "none";
        checkoutSection.style.display = "none";
        emptyCartMessage.style.display = "block";

        return;

    }

    cartItemsContainer.style.display = "block";

    checkoutSection.style.display = "block";

    emptyCartMessage.style.display = "none";

    const productIds = cart.map((item) => item.id);

    const { data: products, error } = await supabase

        .from("produtos")
        .select("id, nome, preco, unidade, imagem_url")
        .in("id", productIds);

    if (error) {

        console.error("Erro:", error);

        cartItemsList.innerHTML = "<p>Erro ao carregar.</p>";

        return;

    }

    let total = 0;

    cartItemsList.innerHTML = "";

    cart.forEach((cartItem) => {

        const product = products.find((p) => p.id === cartItem.id);

        if (product) {

        total += product.preco * cartItem.quantity;

        const formattedPrice = new Intl.NumberFormat("pt-BR", {

            style: "currency",
            currency: "BRL",

        }).format(product.preco);

        const imageUrl = product.imagem_url || "https://via.placeholder.com/150x150.png?text=Item";

        cartItemsList.innerHTML += `<div class="cart-item"><div class="cart-item-details"><img src="${imageUrl}" alt="${
            product.nome
        }"><div class="cart-item-info"><h4>${
            product.nome
        }</h4><p class="item-price-unit">${formattedPrice} / ${
            product.unidade
        }</p><div class="cart-item-actions"><button class="btn-quantity" data-product-id="${
            product.id
        }" data-action="decrease">-</button><span>${
            cartItem.quantity
        }</span><button class="btn-quantity" data-product-id="${
            product.id
        }" data-action="increase">+</button></div></div></div><div class="cart-item-summary"><span class="item-total">${new Intl.NumberFormat("pt-BR",
            { style: "currency", currency: "BRL" }
        ).format(
            product.preco * cartItem.quantity
        )}</span><button class="btn-remove" data-product-id="${
            product.id
        }">Remover</button></div></div>`;
    }
    });
    cartTotalElement.innerHTML = `<div class="total-line"><span>Subtotal</span><span>${new Intl.NumberFormat("pt-BR",
    { style: "currency", currency: "BRL" }
    ).format(
        total
    )}</span></div><div class="total-line grand-total"><span>Total</span><span>${new Intl.NumberFormat("pt-BR",
    { style: "currency", currency: "BRL" }
    ).format(total)}</span></div>`;
    checkoutSection.style.display = "block";
}

async function handleCheckout(event) {

    event.preventDefault();

    const submitButton = checkoutForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Processando...";

    const cart = getCart();
    const productIds = cart.map((item) => item.id);

    const { data: products } = await supabase
        .from("produtos")
        .select("id, preco")
        .in("id", productIds);

    const total = cart.reduce((sum, item) => {

        const product = products.find((p) => p.id === item.id);

        return sum + (product ? product.preco * item.quantity : 0);

    }, 0);

    const customerName = document.getElementById("customer-name").value;
    const customerContact = document.getElementById("customer-contact").value;

    let compradorId = null;
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {

        const { data: profile } = await supabase

        .from("compradores")
        .select("id")
        .eq("user_id", user.id)
        .single();

        if (profile) {
            compradorId = profile.id;
        }
    }

    const pedidoParaInserir = {

        nome_cliente: customerName,
        contato_cliente: customerContact,
        valor_total: total,
        comprador_id: compradorId,

    };

    const { data: orderData, error: orderError } = await supabase
        .from("pedidos")
        .insert(pedidoParaInserir)
        .select()
        .single();

    if (orderError) {

        console.error("Erro no pedido:", orderError);

        alert("Ocorreu um erro ao criar seu pedido. Tente novamente.");

        submitButton.disabled = false;
        submitButton.textContent = "Confirmar Pedido";

        return;

    }

    const orderId = orderData.id;
    const orderItems = cart.map((cartItem) => {
    const product = products.find((p) => p.id === cartItem.id);

        return {
            pedido_id: orderId,
            produto_id: cartItem.id,
            quantidade: cartItem.quantity,
            preco_unitario: product.preco,
        };

    });

    const { error: itemsError } = await supabase
        .from("pedidos_itens")
        .insert(orderItems);

    if (itemsError) {

        alert("Ocorreu um erro ao salvar os itens do pedido.");

        console.error("Erro nos itens do pedido:", itemsError);

        submitButton.disabled = false;
        submitButton.textContent = "Confirmar Pedido";

        return;

    }

    clearCart();
    document.querySelector(".page-header").style.display = "none";
    cartItemsContainer.style.display = "none";
    checkoutSection.style.display = "none";

    const successMessageSection = document.getElementById("order-success-message");
    const orderIdSpan = document.getElementById("success-order-id");

    orderIdSpan.textContent = "#" + orderData.id.toString().substring(0, 8).toUpperCase();
    successMessageSection.style.display = "block";
}

cartItemsList.addEventListener("click", (event) => {

    const removeButton = event.target.closest(".btn-remove");

    if (removeButton) {

        removeItem(removeButton.dataset.productId);

        return;

    }

    const quantityButton = event.target.closest(".btn-quantity");

    if (quantityButton) {

        const action = quantityButton.dataset.action;

        if (action === "increase") {

            updateQuantity(quantityButton.dataset.productId, 1);

        } else if (action === "decrease") {

            updateQuantity(quantityButton.dataset.productId, -1);

        }
    }
});

document.addEventListener("DOMContentLoaded", loadCartItems);

checkoutForm.addEventListener("submit", handleCheckout);

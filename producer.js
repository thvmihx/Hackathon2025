const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U'; // Sua Anon Key Pública

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const producerSelectContainer = document.querySelector('.card:first-child');
const producerSelect = document.getElementById('producer-select');
const dashboardContent = document.getElementById('dashboard-content');
const myProductsList = document.getElementById('my-products-list');
const addProductForm = document.getElementById('add-product-form');
const myOrdersList = document.getElementById('my-orders-list');

let currentProducerId = null;

function showElement(element) {

    if (element) element.style.display = 'block';

}

function hideElement(element) {

    if (element) element.style.display = 'none';

}

function enableElement(element) {

    if (element) element.disabled = false;

}

function disableElement(element) {

    if (element) element.disabled = true;

}

async function loadProducerDashboardData(producerId) {

    if (!producerId) {

        console.warn("loadProducerDashboardData chamado sem producerId");

        if(dashboardContent) hideElement(dashboardContent);

        return;

    }

    currentProducerId = producerId;

    if(dashboardContent) showElement(dashboardContent);

    if(typeof loadMyProducts === 'function') loadMyProducts(producerId);

    if(typeof loadMyOrders === 'function') loadMyOrders(producerId);

}

async function loadMyProducts(producerId) {

    if (!myProductsList) return;

    myProductsList.innerHTML = '<p>Carregando seus produtos...</p>';

    const { data, error } = await supabase

        .from('produtos')
        .select('id, nome, preco, unidade, disponivel')
        .eq('produtor_id', producerId)
        .order('created_at', { ascending: false });

    if (error) {

        console.error("Erro ao carregar produtos:", error);

        myProductsList.innerHTML = `<p class="error-message">Erro ao carregar seus produtos. (${error.message})</p>`;

        return;

    }

    if (data.length === 0) {

        myProductsList.innerHTML = '<p>Você ainda não tem produtos cadastrados. Adicione um novo abaixo!</p>';

        return;

    }

    myProductsList.innerHTML = data.map(product => {

        const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
        const availabilityClass = product.disponivel ? 'available' : 'unavailable';
        const availabilityText = product.disponivel ? 'Disponível' : 'Indisponível';
        const buttonText = product.disponivel ? 'Desativar' : 'Ativar';

        return `
            <div class="my-product-item ${availabilityClass}">
                <div class="my-product-info">
                    <strong>${product.nome}</strong>
                    <span>${price} / ${product.unidade}</span>
                    <span class="status-tag">${availabilityText}</span>
                </div>
                <div class="my-product-actions">
                    <button class="btn btn-secondary btn-small toggle-availability" data-product-id="${product.id}" data-current-status="${product.disponivel}">${buttonText}</button>
                    <button class="btn btn-danger btn-small delete-product" data-product-id="${product.id}" data-product-name="${product.nome}">Excluir</button>
                </div>
            </div>
        `;

    }).join('');

}

async function loadMyOrders(producerId) {

    if (!myOrdersList) return;

    myOrdersList.innerHTML = '<p>Buscando pedidos para você...</p>';

    const { data: orders, error } = await supabase.rpc('get_pedidos_por_produtor', {

        p_produtor_id: producerId

    });

    if (error) {

        console.error("Erro ao buscar pedidos via RPC:", error);

        myOrdersList.innerHTML = `<p class="error-message">Erro ao carregar pedidos para você. (${error.message})</p>`;

        return;

    }

    if (!orders || orders.length === 0) {

        myOrdersList.innerHTML = '<p>Nenhum pedido encontrado para seus produtos ainda.</p>';

        return;

    }

    myOrdersList.innerHTML = orders.map(order => {

        const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR');
        const productListHtml = order.produtos_do_produtor.map(item => `

            <li class="product-list-item">
                <span class="product-name">${item.nome}</span>
                <span class="product-quantity">Qtd: ${item.quantidade} ${item.unidade}</span>
            </li>

        `).join('');

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <h4>Pedido #${order.id.substring(0, 8).toUpperCase()}</h4>
                    <span class="order-date">${orderDate}</span>
                </div>
                <div class="order-card-body">
                    <div class="customer-info">
                        <p><strong>Cliente:</strong> ${order.nome_cliente}</p>
                        <p><strong>Contato:</strong> ${order.contato_cliente}</p>
                    </div>
                    <h5>Seus Produtos Neste Pedido:</h5>
                    <ul class="product-list-in-order">
                        ${productListHtml}
                    </ul>
                </div>
            </div>
        `;

    }).join('');

}

async function handleAddProduct(event) {

    event.preventDefault();

    if (!currentProducerId) {

        alert("Erro: ID do produtor não definido.");

        return;

    }

    if (!addProductForm) return;

    const submitButton = addProductForm.querySelector('button[type="submit"]');

    disableElement(submitButton);

    submitButton.textContent = 'Adicionando...';

    const newProduct = {

        produtor_id: currentProducerId,
        nome: document.getElementById('product-name').value,
        preco: parseFloat(document.getElementById('product-price').value),
        unidade: document.getElementById('product-unit').value,
        disponivel: true

    };

    const { error } = await supabase.from('produtos').insert([newProduct]);

    enableElement(submitButton);

    submitButton.textContent = 'Adicionar Produto';

    if (error) {

        alert(`Erro ao adicionar produto: ${error.message}`);
        console.error(error);

    } else {

        alert("Produto adicionado com sucesso!");
        addProductForm.reset();
        loadMyProducts(currentProducerId);

    }
}

async function handleToggleAvailability(productId, currentStatus) {

    const newStatus = !currentStatus;
    const { error } = await supabase

        .from('produtos')
        .update({ disponivel: newStatus })
        .eq('id', productId);

    if (error) {

        alert("Erro ao atualizar o status do produto.");
        console.error(error);

    } else {

        loadMyProducts(currentProducerId);

    }

}

async function handleDeleteProduct(productId, productName) {

    const isConfirmed = confirm(`Tem certeza que deseja excluir o produto "${productName}"? Esta ação não pode ser desfeita.`);

    if (isConfirmed) {

        const { error } = await supabase

            .from('produtos')
            .delete()
            .eq('id', productId);

        if (error) {

            alert("Erro ao excluir o produto.");
            console.error(error);

        } else {

            alert("Produto excluído com sucesso.");
            loadMyProducts(currentProducerId);

        }

    }

}


document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {

        console.error("Erro ao obter sessão:", sessionError);
        alert("Erro ao verificar autenticação. Tente recarregar a página.");

        if (producerSelectContainer) hideElement(producerSelectContainer);

        if (dashboardContent) hideElement(dashboardContent);

        return;

    }

    if (!session || !session.user) {

        alert("Você precisa estar logado como produtor para acessar esta página.");
        window.location.replace('login.html');

        return;

    }

    const user = session.user;

    if(producerSelectContainer) hideElement(producerSelectContainer);

    if(dashboardContent) hideElement(dashboardContent);

    const { data: producerProfile, error: profileError } = await supabase

        .from('produtores')
        .select('id, nome')
        .eq('user_id', user.id)
        .single();

    if (profileError) {

        if (profileError.code === 'PGRST116') {

            alert("Seu usuário não está cadastrado como produtor. Faça o cadastro ou entre com uma conta de produtor.");
            window.location.replace('login.html');

        } else {

            console.error("Erro ao buscar perfil do produtor:", profileError);
            alert(`Erro ao buscar dados do produtor: ${profileError.message}.`);

        }

        return;

    }

    if (producerProfile) {

        console.log(`Produtor identificado: ${producerProfile.nome} (ID: ${producerProfile.id})`);
        
        if(producerSelectContainer) producerSelectContainer.style.display = 'none';

        await loadProducerDashboardData(producerProfile.id);

    } else {

        alert("Não foi possível encontrar um perfil de produtor associado a este usuário.");
        window.location.replace('login.html');

    }

    if (addProductForm) {

        addProductForm.addEventListener('submit', handleAddProduct);

    }

    if (myProductsList) {

        myProductsList.addEventListener('click', (event) => {

            const target = event.target;

            if (target.classList.contains('toggle-availability')) {

                const productId = target.dataset.productId;
                const currentStatusBool = target.dataset.currentStatus === 'true';

                handleToggleAvailability(productId, currentStatusBool);

            }

            if (target.classList.contains('delete-product')) {

                const productId = target.dataset.productId;
                const productName = target.dataset.productName;

                handleDeleteProduct(productId, productName);

            }

        });

    }
    
});
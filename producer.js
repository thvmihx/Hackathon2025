const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJI...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const producerSelect = document.getElementById('producer-select');
const dashboardContent = document.getElementById('dashboard-content');
const myProductsList = document.getElementById('my-products-list');
const addProductForm = document.getElementById('add-product-form');

let currentProducerId = null;

async function loadProducers() {
    const { data, error } = await supabase
        .from('produtores')
        .select('id, nome');
    
    if (error) {
        console.error("Erro ao carregar produtores:", error);
        return;
    }

    producerSelect.innerHTML = '<option value="">-- Selecione --</option>';
    data.forEach(producer => {
        producerSelect.innerHTML += `<option value="${producer.id}">${producer.nome}</option>`;
    });
}

async function loadMyProducts(producerId) {
    if (!producerId) return;

    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('produtor_id', producerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro:", error);
        return;
    }

    if (data.length === 0) {
        myProductsList.innerHTML = '<p>Você ainda não tem produtos cadastrados. Adicione um novo abaixo!</p>';
        return;
    }

    myProductsList.innerHTML = data.map(product => {
        const price = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(product.preco);

        return `
            <div class="product-item">
                <span>${product.nome}</span>
                <span class="price">${price} / ${product.unidade}</span>
            </div>
        `;
    }).join('');
}

async function handleAddProduct(event) {
    event.preventDefault();

    if (!currentProducerId) {
        alert("Por favor, selecione um produtor primeiro.");
        return;
    }

    const newProduct = {
        produtor_id: currentProducerId,
        nome: document.getElementById('product-name').value,
        preco: parseFloat(document.getElementById('product-price').value),
        unidade: document.getElementById('product-unit').value,
        descricao: document.getElementById('product-description')?.value || null,
    };

    const { error } = await supabase
        .from('produtos')
        .insert([newProduct]);

    if (error) {
        alert("Erro ao adicionar produto. Verifique o console.");
        console.error(error);
    } else {
        alert("Produto adicionado com sucesso!");
        addProductForm.reset();
        loadMyProducts(currentProducerId);
    }
}

document.addEventListener('DOMContentLoaded', loadProducers);

producerSelect.addEventListener('change', (event) => {
    currentProducerId = event.target.value;

    if (currentProducerId) {
        dashboardContent.style.display = 'block';
        loadMyProducts(currentProducerId);
    } else {
        dashboardContent.style.display = 'none';
    }
});

addProductForm.addEventListener('submit', handleAddProduct);

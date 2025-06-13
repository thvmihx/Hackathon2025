// ---- CONFIGURAÇÃO DO CLIENTE SUPABASE ----
// Substitua 'SUA_URL_SUPABASE' e 'SUA_CHAVE_ANON' pelas suas credenciais reais.
const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJI...'; // Chave pública anônima (anon)

// Cria o cliente Supabase para realizar operações no banco de dados
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ELEMENTOS DO DOM ---
// Seleciona elementos do HTML para manipular com JavaScript
const producerSelect = document.getElementById('producer-select');
const dashboardContent = document.getElementById('dashboard-content');
const myProductsList = document.getElementById('my-products-list');
const addProductForm = document.getElementById('add-product-form');

// Variável para armazenar o ID do produtor atualmente selecionado
let currentProducerId = null;

// --- FUNÇÕES ---

// Carrega a lista de produtores do banco e preenche o <select>
async function loadProducers() {
    const { data, error } = await supabase
        .from('produtores')
        .select('id, nome'); // Busca apenas o id e o nome de cada produtor
    
    if (error) {
        console.error("Erro ao carregar produtores:", error);
        return;
    }

    // Substitui o conteúdo do <select> com as opções vindas do Supabase
    producerSelect.innerHTML = '<option value="">-- Selecione --</option>';
    data.forEach(producer => {
        producerSelect.innerHTML += `<option value="${producer.id}">${producer.nome}</option>`;
    });
}

// Carrega os produtos do produtor selecionado
async function loadMyProducts(producerId) {
    if (!producerId) return;

    // Busca produtos associados ao produtor, ordenando os mais recentes primeiro
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('produtor_id', producerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro:", error);
        return;
    }

    // Se nenhum produto for encontrado
    if (data.length === 0) {
        myProductsList.innerHTML = '<p>Você ainda não tem produtos cadastrados. Adicione um novo abaixo!</p>';
        return;
    }

    // Monta e exibe a lista de produtos do produtor
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

// Manipula o envio do formulário de novo produto
async function handleAddProduct(event) {
    event.preventDefault(); // Evita o recarregamento da página

    if (!currentProducerId) {
        alert("Por favor, selecione um produtor primeiro.");
        return;
    }

    // Cria um objeto com os dados do novo produto
    const newProduct = {
        produtor_id: currentProducerId,
        nome: document.getElementById('product-name').value,
        preco: parseFloat(document.getElementById('product-price').value),
        unidade: document.getElementById('product-unit').value,
        descricao: document.getElementById('product-description')?.value || null, // Campo opcional
    };

    // Insere o novo produto no banco
    const { error } = await supabase
        .from('produtos')
        .insert([newProduct]);

    if (error) {
        alert("Erro ao adicionar produto. Verifique o console.");
        console.error(error);
    } else {
        alert("Produto adicionado com sucesso!");
        addProductForm.reset(); // Limpa o formulário
        loadMyProducts(currentProducerId); // Recarrega a lista de produtos
    }
}

// --- EVENTOS ---

// Ao carregar a página, carrega os produtores no <select>
document.addEventListener('DOMContentLoaded', loadProducers);

// Quando o usuário seleciona um produtor
producerSelect.addEventListener('change', (event) => {
    currentProducerId = event.target.value; // Atualiza o ID atual

    if (currentProducerId) {
        dashboardContent.style.display = 'block'; // Mostra a área do painel
        loadMyProducts(currentProducerId);        // Carrega os produtos do produtor
    } else {
        dashboardContent.style.display = 'none';  // Esconde o painel se nada for selecionado
    }
});

// Quando o formulário de novo produto for enviado
addProductForm.addEventListener('submit', handleAddProduct);

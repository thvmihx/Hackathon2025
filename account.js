const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const welcomeMessage = document.getElementById('welcome-message');
const userEmail = document.getElementById('user-email');
const userWhatsapp = document.getElementById('user-whatsapp');
const logoutButton = document.getElementById('logout-button');
const orderHistoryDiv = document.getElementById('order-history');

async function loadUserData(user) {

    const { data: profile, error } = await supabase

        .from('compradores')
        .select('id, nome_completo, whatsapp')
        .eq('user_id', user.id)
        .single();

    if (error) {

        console.error('Erro ao buscar perfil:', error);

        welcomeMessage.textContent = 'Erro ao carregar seus dados.';

        return;

    }

    if (profile) {

        const firstName = profile.nome_completo.split(' ')[0];

        welcomeMessage.textContent = `Olá, ${firstName}!`;
        userEmail.textContent = user.email;
        userWhatsapp.textContent = profile.whatsapp;

        loadOrderHistory(profile.id);

    }
}

async function loadOrderHistory(compradorId) {

    orderHistoryDiv.innerHTML = '<p>Buscando seus pedidos...</p>';

    const { data: orders, error } = await supabase

        .from('pedidos')
        .select('*')
        .eq('comprador_id', compradorId)
        .order('created_at', { ascending: false });

    if (error) {

        console.error('Erro ao buscar pedidos:', error);

        orderHistoryDiv.innerHTML = '<p class="error-message">Não foi possível carregar seu histórico.</p>';

        return;

    }

    if (orders.length === 0) {

        orderHistoryDiv.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';

        return;

    }

    orderHistoryDiv.innerHTML = orders.map(order => {

        const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR', {

            day: '2-digit', month: '2-digit', year: 'numeric'

        });

        const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor_total);

        return `
            <div class="order-history-item">
                <div class="order-header">
                    <h4>Pedido #${order.id.substring(0, 8).toUpperCase()}</h4>
                    <span>${orderDate}</span>
                </div>
                <div class="order-body">
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Total:</strong> ${formattedTotal}</p>
                </div>
            </div>
        `;

    }).join('');

}

logoutButton.addEventListener('click', async (event) => {

    event.preventDefault();

    const { error } = await supabase.auth.signOut();

    if (error) {

        console.error('Erro ao sair:', error);

    } else {

        window.location.href = 'index.html';

    }

});

document.addEventListener('DOMContentLoaded', async () => {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

        alert('Você precisa estar logado para acessar esta página.');

        window.location.replace('login.html');

    } else {

        loadUserData(user);

    }
    
});
const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const signupForm = document.getElementById('producer-signup-form');
const errorMessageDiv = document.getElementById('error-message');

signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const producerName = document.getElementById('producer-name').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitButton = signupForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Criando...';

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (authError) {
        errorMessageDiv.textContent = 'Erro: ' + authError.message;
        errorMessageDiv.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'Finalizar Cadastro';
        return;
    }
    
    const user = authData.user;
    if (user) {
        const { error: profileError } = await supabase
            .from('produtores')
            .insert({
                user_id: user.id, 
                nome: producerName,
                whatsapp: whatsapp
            });

        if (profileError) {
            errorMessageDiv.textContent = 'Erro ao salvar perfil do produtor: ' + profileError.message;
        } else {
            alert('Cadastro de produtor realizado com sucesso! Você será redirecionado para a página de login.');
            window.location.href = 'login.html';
        }
    }
});
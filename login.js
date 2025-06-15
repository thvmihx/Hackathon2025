const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTYwMjMsImV4cCI6MjA2NDgzMjAyM30.uphkOzvr7VdbKsy9MYHs4FRpvz5W3J1-4eEHmFDeU_U';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('login-form');
const errorMessageDiv = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const selectedRole = document.querySelector('input[name="user-role"]:checked').value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';
    errorMessageDiv.style.display = 'none';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (authError) {
        errorMessageDiv.textContent = 'E-mail ou senha inválidos. Tente novamente.';
        errorMessageDiv.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
        return;
    }

    const user = authData.user;

    if (selectedRole === 'comprador') {

        const { data: profile, error } = await supabase
            .from('compradores')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profile) {
            window.location.href = 'account.html';
        } else {
            errorMessageDiv.textContent = 'Este usuário não possui um perfil de comprador.';
            errorMessageDiv.style.display = 'block';
            await supabase.auth.signOut();
        }

    } else if (selectedRole === 'produtor') {

        const { data: profile, error } = await supabase
            .from('produtores')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profile) {
            window.location.href = 'producer.html';
        } else {
            errorMessageDiv.textContent = 'Este usuário não possui um perfil de produtor.';
            errorMessageDiv.style.display = 'block';
            await supabase.auth.signOut();
        }
    }
    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';
});
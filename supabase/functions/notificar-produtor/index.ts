import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://quucktxeoydvitsbtofn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWNrdHhlb3lkdml0c2J0b2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI1NjAyMywiZXhwIjoyMDY0ODMyMDIzfQ.teBMb8kOUDCrfbHlXUeolDACXSkUW3ga2Or9eAcVdDI'; // IMPORTANTE: Pegue no painel do Supabase!

interface PedidoPayload {

  record: {
    id: string;
    nome_cliente: string;
  }

}

Deno.serve(async (req) => {

  try {

    const payload: PedidoPayload = await req.json();
    const pedidoId = payload.record.id;
    const nomeCliente = payload.record.nome_cliente;

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: itens, error: itensError } = await supabaseAdmin

      .from('pedidos_itens')
      .select('produtos(produtor_id)')
      .eq('pedido_id', pedidoId);

    if (itensError) throw itensError;

    const produtorIds = [...new Set(itens.map(item => item.produtos.produtor_id))];

    for (const produtorId of produtorIds) {

      const { data: produtor, error: produtorError } = await supabaseAdmin

        .from('produtores')
        .select('user_id')
        .eq('id', produtorId)
        .single();

      if (produtorError || !produtor.user_id) continue;

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(produtor.user_id);
      
      if (userError || !userData.user.email) continue;
      
      const recipientEmail = userData.user.email;

      await supabaseAdmin.functions.invoke('send-email', {

          body: {

              to: recipientEmail,
              subject: `Novo Pedido Recebido! - Pedido #${pedidoId.substring(0, 8)}`,
              html: `
                  <h1>Olá!</h1>
                  <p>Você recebeu um novo pedido de <strong>${nomeCliente}</strong> contendo seus produtos.</p>
                  <p>Acesse seu painel para ver mais detalhes.</p>
                  <a href="URL_DO_SEU_SITE/producer.html">Acessar Painel do Produtor</a>
              `,

          }

      });
      
    }

    return new Response(JSON.stringify({ message: 'Notificações enviadas.' }), {

      headers: { 'Content-Type': 'application/json' },
      status: 200,

    });

  } catch (error) {

    return new Response(JSON.stringify({ error: error.message }), {

      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });

  }
  
});
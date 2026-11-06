/* O navegador conversa com Flask. Somente Python conhece a chave do Supabase.
   async permite usar await para aguardar a resposta de uma requisição. */
const formulario = document.getElementById("formulario");
const mensagem = document.getElementById("mensagem");
const mensagemLista = document.getElementById("mensagem-lista");
const lista = document.getElementById("lista-produtos");
const campoCategoria = document.getElementById("categoria");
const botaoCadastrar = document.getElementById("botao-cadastrar");

function mostrarMensagem(texto, sucesso) {
  // textContent apresenta texto sem interpretar HTML enviado por usuários.
  mensagem.textContent = texto;
  mensagem.className = sucesso ? "mensagem sucesso" : "mensagem erro";
}

async function carregarCategorias() {
  try {
    const resposta = await fetch("/api/categorias");
    const dados = await resposta.json();
    // fetch não gera exceção automaticamente para HTTP 400, 409 ou 503.
    if (!resposta.ok) {
      mostrarMensagem(dados.mensagem, false);
      return;
    }
    for (const categoria of dados) {
      const opcao = document.createElement("option");
      opcao.value = categoria.categoria_id;
      opcao.textContent = categoria.nome;
      campoCategoria.appendChild(opcao);
    }
    if (dados.length === 0) {
      mostrarMensagem("Cadastre as categorias executando o SQL da aula.", false);
    }
  } catch (erro) {
    // Aqui entram falha de rede ou resposta que não pôde ser lida como JSON.
    mostrarMensagem("Não foi possível carregar as categorias. Confira o servidor.", false);
  }
}

async function carregarProdutos() {
  mensagemLista.textContent = "Consultando produtos...";
  try {
    const resposta = await fetch("/api/produtos");
    const produtos = await resposta.json();
    if (!resposta.ok) {
      mensagemLista.textContent = produtos.mensagem;
      return;
    }

    // Limpa as linhas anteriores para não duplicar a lista ao atualizar.
    lista.replaceChildren();
    for (const produto of produtos) {
      const linha = document.createElement("tr");
      const valores = [
        produto.nome,
        produto.categorias ? produto.categorias.nome : "Sem categoria",
        Number(produto.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        produto.estoque,
      ];
      for (const valor of valores) {
        const celula = document.createElement("td");
        celula.textContent = valor;
        linha.appendChild(celula);
      }
      lista.appendChild(linha);
    }
    mensagemLista.textContent = produtos.length === 0 ? "Nenhum produto cadastrado." : "Lista atualizada.";
  } catch (erro) {
    mensagemLista.textContent = "Não foi possível atualizar a lista. Confira o servidor.";
  }
}

async function cadastrarProduto(evento) {
  // Evita o envio HTML tradicional, que recarregaria a página.
  evento.preventDefault();
  botaoCadastrar.disabled = true;
  mostrarMensagem("Enviando dados...", true);

  // .value retorna texto mesmo em input type=number. Python faz as conversões.
  const produto = {
    nome: document.getElementById("nome").value,
    categoria_id: campoCategoria.value,
    preco: document.getElementById("preco").value,
    estoque: document.getElementById("estoque").value,
  };

  try {
    const resposta = await fetch("/api/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto), // Converte o objeto JS em texto JSON.
    });
    const dados = await resposta.json();
    mostrarMensagem(dados.mensagem, resposta.ok);
    if (resposta.ok) {
      // Só limpa o formulário quando o servidor confirma o cadastro.
      formulario.reset();
      await carregarProdutos();
    }
  } catch (erro) {
    mostrarMensagem("Não foi possível confirmar o cadastro. Atualize a lista antes de reenviar.", false);
  } finally {
    // Executa com sucesso ou erro: libera o botão para a próxima tentativa.
    botaoCadastrar.disabled = false;
  }
}

formulario.addEventListener("submit", cadastrarProduto);
document.getElementById("botao-atualizar").addEventListener("click", carregarProdutos);
carregarCategorias();
carregarProdutos();
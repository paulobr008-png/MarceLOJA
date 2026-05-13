/**
 * ============================================================
 * 1. ESTADO GLOBAL E UTILITÁRIOS
 * Aqui gerenciamos os dados que "vivem" na memória enquanto a
 * aba está aberta e atalhos para facilitar o código.
 * ============================================================
 */

// Recupera os dados do LocalStorage ou inicia um carrinho vazio
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let indexEdicao = null;       // Guarda a posição do item caso o usuário clique em "Editar"
let indexParaRemover = null;  // Armazena temporariamente o item que será excluído via modal
let editMode = false;         // Variável de controle: define se o botão principal Adiciona ou Salva Alteração

// Atalho para não precisar digitar 'document.getElementById' toda vez
const getEl = id => document.getElementById(id);

salvarERenderizar();

/**
 * ============================================================
 * 2. PERSISTÊNCIA E RENDERIZAÇÃO
 * Responsável por "salvar" os dados no navegador e atualizar
 * o que o usuário vê na tela (HTML).
 * ============================================================
 */

function salvarERenderizar() { 
    // Converte o array de objetos para String para salvar no navegador
    localStorage.setItem("carrinho", JSON.stringify(carrinho)); 
    render(); 
}

function render(listaParaExibir = carrinho) {
    const listaAlvo = getEl("lista");
    if (!listaAlvo) return;

    /**
     * LÓGICA DE CÁLCULO TOTAL (REDUCE)
     * Percorre o carrinho calculando: (Preço * Qtd) - Desconto
     */
    const somaTotal = carrinho.reduce((acc, item) => {
        const precoBase = item.precoUnitario * item.quantidade;
        return acc + (precoBase * (1 - item.desconto / 100));
    }, 0);

    // Mapeia o array JS para uma estrutura de HTML (Cards do Carrinho)
    const listaHtml = listaParaExibir.map((item) => {
        const precoBase = item.precoUnitario * item.quantidade;
        const totalItem = precoBase * (1 - item.desconto / 100);
        const indexReal = carrinho.indexOf(item); 

        return `
            <div class="item">
                <div class="item-info">
                    <strong>${item.quantidade}x ${item.nome}</strong>
                    <div class="item-detalhes">
                        <span>R$ ${item.precoUnitario.toFixed(2)}</span>
                        ${item.desconto > 0 ? `<span class="tag-desc">-${item.desconto}%</span>` : ''}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:15px">
                    <span style="font-weight: 900; font-size: 1.1rem;">R$ ${totalItem.toFixed(2)}</span>
                    <button onclick="editar(${indexReal})" title="Editar" class="btn-icon">✏️</button>
                    <button onclick="remover(${indexReal})" title="Remover" class="btn-icon">🗑️</button>
                </div>
            </div>`;
    }).join("");

    // Insere o HTML gerado na tela ou mostra mensagem de vazio
    listaAlvo.innerHTML = listaHtml || "<p style='color:gray; text-align:center; padding:20px;'>Carrinho vazio.</p>";
    getEl("total").innerText = somaTotal.toFixed(2);
    
    // Controle de UI: Esconde o botão de "Esvaziar" se não houver itens
    getEl("removeAll").style.display = (carrinho.length >= 1) ? "block" : "none";
}

/**
 * ============================================================
 * 3. FILTRO DE BUSCA
 * Aplica um filtro no array de carrinho sem apagar os dados originais.
 * ============================================================
 */
function buscar() {
    const termo = getEl("busca").value.toLowerCase();
    const itensFiltrados = carrinho.filter(item => 
        item.nome.toLowerCase().includes(termo)
    );
    render(itensFiltrados); // Renderiza apenas o que bate com a pesquisa
}

/**
 * ============================================================
 * 4. GESTÃO DE PRODUTOS (ADICIONAR / EDITAR)
 * Aqui tratamos a entrada de dados e as regras de negócio.
 * ============================================================
 */
function adicionar(e) {
    if (e) e.preventDefault();
    
    // Tratamento de dados: primeira letra Maiúscula, troca vírgula por ponto
    let nome = getEl("nome").value.trim();
    nome = nome[0]?.toUpperCase() + nome.slice(1).toLowerCase();
    const preco = parseFloat(getEl("preco").value.replace(',', '.'));
    const desc = parseFloat(getEl("desconto").value) || 0;
    const qtd = parseInt(getEl("quantidade").value) || 1;

    // Validação de segurança
    if (nome.length < 2 || isNaN(preco) || preco <= 0) {
        return mostrarToast("Dados do produto inválidos!", "error");
    }

    const item = { nome, precoUnitario: preco, desconto: desc, quantidade: qtd };

    // Verifica se estamos salvando uma edição ou um novo produto
    if (editMode && indexEdicao !== null) {
        carrinho[indexEdicao] = item;
        mostrarToast("Item atualizado!");
        cancelarEdicao();
    } else {
        carrinho.push(item);
        mostrarToast(`${nome} adicionado!`);
    }

    salvarERenderizar();
    limparCampos();
}

function editar(i) {
    editMode = true;
    indexEdicao = i; 
    const it = carrinho[i];

    // Devolve os dados do item para os campos do formulário
    getEl("nome").value = it.nome; 
    getEl("preco").value = it.precoUnitario; 
    getEl("quantidade").value = it.quantidade; 
    getEl("desconto").value = it.desconto;
    
    // Mudança visual para indicar edição
    getEl("titulo-form").innerText = "✍️ Editando Item"; 
    getEl("btn-cancelar").style.display = "block";
    getEl("btn-acao").innerText = "SALVAR ALTERAÇÃO (Enter)";
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a página para o formulário
    getEl("nome").focus();
}

function cancelarEdicao() {
    editMode = false;
    indexEdicao = null; 
    getEl("titulo-form").innerText = "Novo Produto"; 
    getEl("btn-cancelar").style.display = "none"; 
    getEl("btn-acao").innerText = "ADICIONAR (Enter)";
    limparCampos(); 
}

/**
 * ============================================================
 * 5. LÓGICA DE PAGAMENTO E FINALIZAÇÃO
 * Gerencia a troca de métodos de pagamento e finalização da venda.
 * ============================================================
 */

function setPagamento(valor) {
    getEl("formaPagamento").value = valor;
    // Exibe apenas os campos específicos do método escolhido
    getEl("secao-cartao").style.display = (valor === "Cartão") ? "block" : "none";
    getEl("secao-dinheiro").style.display = (valor === "Dinheiro") ? "block" : "none";
    getEl("secao-pix").style.display = (valor === "Pix") ? "block" : "none";
}

function toggleParcelas() {
    const tipo = getEl("tipo-cartao").value;
    const wrapper = getEl("wrapper-parcelas");
    // Se for Débito, esconde a opção de parcelas
    wrapper.style.display = (tipo === "Débito") ? "none" : "block";
    if(tipo === "Débito") getEl("parcelas").value = "1";
}

function calcularTroco() {
    const totalVenda = parseFloat(getEl("total").innerText);
    const pago = parseFloat(getEl("valor-pago").value) || 0;
    const troco = pago - totalVenda;
    const display = getEl("display-troco");
    
    if (troco >= 0) {
        display.innerText = `Troco: R$ ${troco.toFixed(2)}`;
        display.style.color = "#05c46b";
    } else {
        display.innerText = `Faltam: R$ ${Math.abs(troco).toFixed(2)}`;
        display.style.color = "#ff3f34";
    }
}

function finalizar() {
    const metodoBase = getEl("formaPagamento").value;
    const totalVenda = parseFloat(getEl("total").innerText);

    // Validações antes de encerrar
    if (carrinho.length === 0) return mostrarToast("Carrinho vazio!", "error");
    if (!metodoBase) return mostrarToast("Selecione o pagamento!", "info");

    let detalheFinal = metodoBase;

    // Constrói a string de detalhes para o histórico
    if (metodoBase === "Cartão") {
        const tipo = getEl("tipo-cartao").value;
        const parc = getEl("parcelas").value;
        detalheFinal = `Cartão ${tipo} (${parc}x)`;
    } else if (metodoBase === "Dinheiro") {
        const pago = parseFloat(getEl("valor-pago").value) || 0;
        if (pago < totalVenda) return mostrarToast("Valor insuficiente!", "error");
        detalheFinal = `Dinheiro (Pago: R$ ${pago.toFixed(2)})`;
    }

    // Objeto da Venda: O "coração" do relatório
    const venda = {
        id: Date.now(), // Gera um ID único baseado no tempo exato
        data: new Date().toLocaleString(),
        itens: carrinho,
        total: totalVenda,
        pagamento: detalheFinal
    };

    // Salva no histórico acumulado e na "última venda" (para o cupom fiscal)
    const historico = JSON.parse(localStorage.getItem("historico_vendas")) || [];
    historico.push(venda);
    localStorage.setItem("historico_vendas", JSON.stringify(historico));
    localStorage.setItem("ultima_venda", JSON.stringify(venda));

    getEl("CFPopup")?.showModal(); // Abre o modal de "Venda Realizada/Recibo"
}

/**
 * ============================================================
 * 6. AUXILIARES, MODAIS E TOASTS
 * Funções de suporte para interface e feedbacks.
 * ============================================================
 */

function limparCampos() { 
    ["nome", "preco", "desconto"].forEach(id => getEl(id).value = "");
    getEl("quantidade").value = "1"; 
    getEl("nome").focus(); 
}

function remover(i) { 
    indexParaRemover = i; 
    getEl("modalConfirmacao").showModal(); 
}

getEl("btnConfirmarRemover").onclick = () => {
    carrinho.splice(indexParaRemover, 1);
    salvarERenderizar();
    getEl("modalConfirmacao").close();
};

function removerTudo() {
    getEl("removeAllPopup").showModal();
    getEl("confirmRemoveAll").onclick = () => {
        carrinho.length = 0;
        salvarERenderizar();
        getEl("removeAllPopup").close();
    }
}

// Botão "Nova Venda": Limpa tudo para o próximo cliente
getEl("closeButton").onclick = () => { 
    carrinho = []; 
    salvarERenderizar();
    getEl("formaPagamento").value = "";
    document.querySelectorAll('input[name="pagamento"]').forEach(r => r.checked = false);
    getEl("CFPopup").close(); 
};

/**
 * SISTEMA DE TOASTS (NOTIFICAÇÕES FLUTUANTES)
 */
function mostrarToast(msg, tipo = 'success') {
    let container = getEl("toast-container") || document.createElement("div");
    if (!container.id) {
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    
    // Remove o aviso automaticamente após 3 segundos
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 3000);
}

/**
 * ============================================================
 * 7. SISTEMA DE ATALHOS DE TECLADO (UX Profissional)
 * Facilita o uso em balcão de vendas real.
 * ============================================================
 */
document.addEventListener("keydown", (e) => {
    const cf = getEl("CFPopup");
    const mc = getEl("modalConfirmacao");
    const ra = getEl("removeAllPopup");
    const estaDigitando = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

    // Atalho ENTER
    if (e.key === "Enter") {
        if (cf?.open) { 
            const link = cf.querySelector('a');
            if(link) window.open(link.href, '_blank'); 
            return;
        }
        if (mc?.open) { getEl("btnConfirmarRemover").click(); return; }
        if (ra?.open) { getEl("confirmRemoveAll").click(); return; }
        
        // Se estiver nos campos de produto, ADICIONA. Se não, FINALIZA a venda.
        if (estaDigitando && document.activeElement.id !== "valor-pago") {
            adicionar(e);
            return;
        }

        if (!cf?.open && carrinho.length > 0) {
            finalizar();
        }
    }

    // Atalho ESCAPE para cancelar/fechar modais
    if (e.key === "Escape") {
        if (mc?.open) mc.close();
        if (ra?.open) ra.close();
        if (cf?.open) getEl("closeButton").click();
        if (indexEdicao !== null) cancelarEdicao();
    }

    // Atalho DELETE para limpar carrinho (quando não estiver digitando em campos)
    if (e.key === "Delete" && !estaDigitando) {
        if (carrinho.length > 0) removerTudo();
    }
});

// Roda a renderização inicial ao carregar a página
document.addEventListener("DOMContentLoaded", render);

/**
 * ============================================================
 * LÓGICA DO HISTÓRICO DE VENDAS - MarceLOJA
 * ============================================================
 */

/**
 * MAPA DE ÍCONES
 * Os nomes das chaves devem bater com a primeira palavra do método de pagamento.
 * O caminho ../ indica que a pasta "Ícones" está um nível acima da pasta do histórico.
 */
const MAPA_ICONES = {
    "Pix": "../Ícones/pix.png",
    "Dinheiro": "../Ícones/dinheiro.png",
    "Cartão": "../Ícones/cartao.png"
};

/**
 * FUNÇÃO PRINCIPAL: renderHistorico()
 * Lê os dados do LocalStorage e constrói os cards de venda.
 */
function renderHistorico() {
    // Busca a chave correta definida no script.js do PDV
    const historico = JSON.parse(localStorage.getItem("historico_vendas")) || [];
    const corpo = document.querySelector(".historico-corpo");

    // Seleciona e remove apenas os cards de venda e a mensagem de "vazio"
    // Isso preserva botões de navegação que estejam fixos no HTML
    const elementosAntigos = corpo.querySelectorAll(".venda-card, .no-vendas");
    elementosAntigos.forEach(el => el.remove());

    // Caso não existam vendas no banco de dados
    if (historico.length === 0) {
        corpo.insertAdjacentHTML('beforeend', `
            <div class="no-vendas" style="text-align:center; padding: 50px; opacity: 0.5;">
                <span style="font-size: 50px;">📄</span>
                <p>Nenhuma venda registrada até o momento.</p>
            </div>
        `);
        return;
    }

    /**
     * RENDERIZAÇÃO DOS CARDS
     * Usamos o reverse() para que a venda mais recente apareça no topo.
     */
    [...historico].reverse().forEach(venda => {
        
        // Trata o ID do pedido (Pega os últimos 6 dígitos do timestamp)
        const pedidoID = venda.id ? venda.id.toString().slice(-6) : "000000";
        
        // Trata a data (O PDV já envia formatada como string)
        const dataVenda = venda.data || "Data não registrada";
        
        // Identifica o ícone correto
        // Se o pagamento for "Cartão Débito", o split pega apenas "Cartão"
        const metodoPrincipal = venda.pagamento ? venda.pagamento.split(' ')[0] : "";
        const iconeUrl = MAPA_ICONES[metodoPrincipal];

        // Gera o HTML do card
        const cardHtml = `
        <div class="venda-card" style="background:white; border-radius:12px; padding:20px; margin-bottom:20px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border:1px solid #eee;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f2f6; padding-bottom:10px; margin-bottom:15px;">
                <div>
                    <span style="font-weight:900; color:#2d3436; font-size: 1.1rem;">#${pedidoID}</span>
                    <span style="margin-left:15px; color:#636e72; font-size:0.9rem;">
                        📅 ${dataVenda}
                    </span>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span style="display: flex; align-items: center; gap: 8px; background: #f1f2f6; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                        ${iconeUrl ? `<img src="${iconeUrl}" style="width: 18px; height: 18px; object-fit: contain;" onerror="this.style.display='none'">` : '💰'}
                        ${venda.pagamento || "Não identificado"}
                    </span>
                    <span style="font-weight:900; font-size:1.2rem; color:#05c46b; margin-top:5px;">
                        R$ ${Number(venda.total).toFixed(2)}
                    </span>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <thead>
                    <tr style="text-align:left; color:#808e9b; font-size:0.75rem; text-transform:uppercase;">
                        <th style="padding:8px 0; width: 50px;">Qtd</th>
                        <th>Produto</th>
                        <th style="text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${(venda.itens || []).map(item => {
                        const preco = Number(item.precoUnitario) || 0;
                        const qtd = Number(item.quantidade) || 0;
                        const desc = Number(item.desconto) || 0;
                        const subtotal = (preco * qtd) * (1 - desc / 100);

                        return `
                        <tr style="border-bottom: 1px solid #f9f9f9;">
                            <td style="padding:10px 0;">${qtd}x</td>
                            <td>
                                <div style="font-weight:600; color:#2d3436;">${item.nome}</div>
                                <div style="font-size:0.75rem; color:#b2bec3;">Preço unit: R$ ${preco.toFixed(2)} ${desc > 0 ? `(-${desc}%)` : ''}</div>
                            </td>
                            <td style="text-align:right; font-weight:700; color:#2d3436;">
                                R$ ${subtotal.toFixed(2)}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

        corpo.insertAdjacentHTML('beforeend', cardHtml);
    });
}

/**
 * ============================================================
 * EVENTOS E INICIALIZAÇÃO
 * ============================================================
 */

// Renderiza assim que a página carrega
document.addEventListener("DOMContentLoaded", renderHistorico);

// Atalho de teclado: ESC para voltar
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        // Redireciona para o PDV se o window.close() for bloqueado pelo navegador
        window.location.href = '../index.html';
    }
});
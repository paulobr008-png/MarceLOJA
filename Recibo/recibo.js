/**
 * LÓGICA DE GERAÇÃO DINÂMICA DO RECIBO - MarceLOJA
 * Objetivo: Ler os dados da última venda e construir um cupom visual.
 */

// Seleciona o elemento HTML onde o recibo será "desenhado"
const container = document.getElementById("recibo");

/**
 * RECUPERAÇÃO DE DADOS SINCRONIZADA
 * Buscamos a chave 'ultima_venda' gerada pelo sistema principal.
 */
const dadosVendaRaw = localStorage.getItem("ultima_venda");
const dadosVenda = dadosVendaRaw ? JSON.parse(dadosVendaRaw) : null;

function gerarRecibo() {
    // Validação de segurança
    if (!dadosVenda) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>Erro: Venda não encontrada.</p>";
        return;
    }

    // Extração de variáveis do objeto 'venda'
    const carrinho = dadosVenda.itens || []; // O array no seu script.js chama-se 'itens'
    const pagamento = dadosVenda.pagamento || "Não identificado";
    const pedidoID = dadosVenda.id.toString().slice(-6); // ID curto baseado no timestamp
    const dataVenda = dadosVenda.data; // Data já formatada pelo sistema principal

    let totalGeral = dadosVenda.total || 0;
    let itensHtml = "";
    let produtosTextoQR = "";

    /**
     * PROCESSAMENTO DOS ITENS
     * Percorremos o array para montar a lista visual e o texto do QR Code.
     */
    carrinho.forEach(item => {
        const qtd = Number(item.quantidade) || 0;
        const pUnit = Number(item.precoUnitario) || 0;
        const descPercent = Number(item.desconto) || 0;

        const precoBase = pUnit * qtd;
        const valorDesconto = precoBase * (descPercent / 100);
        const precoFinal = precoBase - valorDesconto;

        // Texto simplificado para o interior do QR Code (Original)
        produtosTextoQR += `(${qtd}x) ${item.nome}: R$ ${precoFinal.toFixed(2)}\n`;
        
        // Montagem visual da linha para o cupom
        itensHtml += `
            <div class="item-linha">
                <span class="item-nome">${qtd}x ${item.nome}</span>
                <span class="item-valor">R$ ${precoFinal.toFixed(2)}</span>
            </div>
            ${descPercent > 0 ? `<span class="item-desc">Sendo R$ ${valorDesconto.toFixed(2)} de desconto (${descPercent}%)</span>` : ''}
        `;
    });

    /**
     * CONFIGURAÇÃO DO QR CODE (ESTILO ORIGINAL)
     * Texto formatado exatamente como você enviou anteriormente.
     */
    const textoQR = `MarceLOJA - Pedido #${pedidoID}\nData: ${dataVenda}\nPagamento: ${pagamento}\n---\n${produtosTextoQR}---\nTOTAL: R$ ${totalGeral.toFixed(2)}`;

    // Integração com QuickChart (Mantendo o estilo anterior)
    const urlQRCode = `https://quickchart.io/qr?text=${encodeURIComponent(textoQR)}&size=200`;

    /**
     * MONTAGEM DO HTML FINAL
     * Injeta a estrutura completa no DOM.
     */
    container.innerHTML = `
        <div class="recibo-logo">
            <span class="logo-main">Marce</span><span class="logo-sub">LOJA</span>
        </div>
        
        <div class="info-venda">
            <strong>PEDIDO #${pedidoID}</strong><br>
            Data: ${dataVenda}<br>
            Pagamento: ${pagamento}<br>
            CUPOM NÃO FISCAL
        </div>

        <div class="itens-lista">
            ${itensHtml}
        </div>

        <div class="total-bloco">
            <span>TOTAL</span>
            <span>R$ ${totalGeral.toFixed(2)}</span>
        </div>

        <div class="qr-container">
            <img src="${urlQRCode}" class="qr-code" alt="QR Code da Venda">
            <p style="font-size: 10px; margin-top: 10px; color: #b2bec3;">Consulte seu pedido digital</p>
        </div>

        <p style="text-align: center; font-size: 0.8rem; margin-top: 20px; color: #636e72;">
            Obrigado pela preferência!
        </p>
    `;
}

// Executa a função
gerarRecibo();
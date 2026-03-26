// 简单的前端演示逻辑
(function(){
    const form = document.getElementById('create-deposit-form');
    const merchantsSel = document.getElementById('deposit-merchant');
    const modal = document.getElementById('myModal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-btn');

    let nextTxStatus = 'success'; // 默认下次交易状态为成功

    // 刷新统计面板
    function renderDashboard() {
        document.getElementById('stat-merchants').textContent = mockData.merchants.length;
        const consumerIds = new Set(mockData.ledgers.map(l => l.consumer));
        document.getElementById('stat-consumers').textContent = consumerIds.size;
        const totalAmount = mockData.ledgers.reduce((sum, l) => sum + l.balance, 0);
        document.getElementById('stat-total-amount').textContent = `¥${totalAmount.toFixed(2)}`;
    }

    // 渲染商户列表
    function renderMerchants(){
        merchantsSel.innerHTML = '';
        mockData.merchants.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id; opt.text = m.name;
            merchantsSel.appendChild(opt);
        });
    }

    // 渲染 Ledger 列表
    function renderLedger(){
        const tbl = document.getElementById('ledger-list');
        tbl.innerHTML = '';
        mockData.ledgers.forEach(l => {
            const tr = document.createElement('tr');
            const merchant = mockData.merchants.find(m => m.id === l.merchantId) || { name: l.merchantId };
            tr.innerHTML = `
                <td>${l.ledgerId}</td>
                <td>${merchant.name} (${l.merchantId})</td>
                <td>${l.consumer}</td>
                <td>¥${l.balance.toFixed(2)}</td>
                <td><span class="badge ${l.status === 'active' ? 'success' : 'danger'}">${l.status === 'active' ? '活跃' : '非活跃'}</span></td>
                <td><button onclick="openModal('ledger','${l.ledgerId}')" class="btn-outline">详情</button></td>
            `;
            tbl.appendChild(tr);
        });
    }

    // 渲染交易列表
    function renderTransactions(){
        const tbl = document.getElementById('transaction-list');
        tbl.innerHTML = '';
        mockData.transactions.forEach(tx => {
            const tr = document.createElement('tr');
            const merchant = mockData.merchants.find(m => m.id === tx.merchantId) || { name: tx.merchantId };
            tr.innerHTML = `
                <td>${tx.time}</td>
                <td>${tx.tid}</td>
                <td>${merchant.name}</td>
                <td style="color:${tx.amount < 0 ? 'var(--red)' : 'var(--green)'}">${tx.amount > 0 ? '+' : ''}¥${Math.abs(tx.amount).toFixed(2)}</td>
                <td><span class="badge ${tx.status === 'completed' ? 'success' : 'danger'}">${tx.status === 'completed' ? '成功' : '失败'}</span></td>
                <td><button onclick="openModal('tx','${tx.tid}')" class="btn-outline">详情</button></td>
            `;
            tbl.appendChild(tr);
        });
    }

    // 打开弹窗
    window.openModal = function(type, id){
        modal.classList.remove('hidden');
        if(type === 'ledger'){
            const ledger = mockData.ledgers.find(l => l.ledgerId === id);
            const merchant = mockData.merchants.find(m => m.id === ledger.merchantId);
            modalTitle.textContent = 'Ledger 详情';
            modalBody.innerHTML = `
                <p><strong>Ledger ID:</strong> ${ledger.ledgerId}</p>
                <p><strong>商户:</strong> ${merchant ? merchant.name : '未知'}</p>
                <p><strong>消费者:</strong> ${ledger.consumer}</p>
                <p><strong>余额:</strong> ¥${ledger.balance.toFixed(2)}</p>
                <p><strong>状态:</strong> <span class="badge ${ledger.status === 'active' ? 'success' : 'danger'}">${ledger.status === 'active' ? '活跃' : '非活跃'}</span></p>
            `;
        } else if(type === 'tx'){
            const tx = mockData.transactions.find(t => t.tid === id);
            const ledger = mockData.ledgers.find(l => l.ledgerId === tx.ledgerId);
            const merchant = mockData.merchants.find(m => m.id === tx.merchantId);
            modalTitle.textContent = '交易详情';
            modalBody.innerHTML = `
                <p><strong>交易流水号:</strong> ${tx.tid}</p>
                <p><strong>商户:</strong> ${merchant ? merchant.name : '未知'}</p>
                <p><strong>Ledger:</strong> ${ledger ? ledger.ledgerId : '未知'}</p>
                <p><strong>金额:</strong> ¥${Math.abs(tx.amount).toFixed(2)}</p>
                <p><strong>时间:</strong> ${tx.time}</p>
                <p><strong>状态:</strong> <span class="badge ${tx.status === 'completed' ? 'success' : 'danger'}">${tx.status === 'completed' ? '成功' : '失败'}</span></p>
            `;
        }
    };

    // 关闭弹窗
    closeBtn.onclick = function(){
        modal.classList.add('hidden');
    };
    modal.onclick = function(e){
        if(e.target === modal) modal.classList.add('hidden');
    };

    // 设置下一笔状态
    window.setNextStatus = function(status){
        nextTxStatus = status;
        const indicator = document.getElementById('next-status-indicator');
        if(status === 'success'){
            indicator.innerHTML = '下笔状态: <span class="badge success">正常</span>';
        } else {
            indicator.innerHTML = '下笔状态: <span class="badge danger">模拟失败</span>';
        }
    };

    // 表单提交
    form.onsubmit = function(e){
        e.preventDefault();
        const merchantId = merchantsSel.value;
        const consumerId = document.getElementById('deposit-consumer').value;
        const amount = parseFloat(document.getElementById('deposit-amount').value);

        if(amount <= 0) return alert('金额必须大于0');

        // 创建新的 Ledger 或交易
        const ledgerId = 'ld-' + Date.now();
        const tid = 't-' + Date.now();

        const newLedger = {
            ledgerId: ledgerId,
            merchantId: merchantId,
            consumer: consumerId,
            balance: amount,
            status: 'active'
        };

        const newTx = {
            tid: tid,
            ledgerId: ledgerId,
            merchantId: merchantId,
            consumerId: consumerId,
            amount: -amount,
            time: new Date().toLocaleString('zh-CN'),
            status: nextTxStatus
        };

        mockData.ledgers.push(newLedger);
        mockData.transactions.unshift(newTx);

        renderDashboard();
        renderLedger();
        renderTransactions();
        form.reset();
    };

    // 初始化
    renderDashboard();
    renderMerchants();
    renderLedger();
    renderTransactions();
})();
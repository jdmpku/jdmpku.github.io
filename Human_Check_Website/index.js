// Load chunks index and display chunk cards
document.addEventListener('DOMContentLoaded', function() {
    loadChunks();
});

async function loadChunks() {
    try {
        const response = await fetch('data/chunks_index.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const chunks = await response.json();
        
        const chunkGrid = document.getElementById('chunkGrid');
        chunkGrid.innerHTML = '';
        
        chunks.forEach(chunk => {
            const card = document.createElement('a');
            card.href = `check.html?chunk=${chunk.chunk_id}`;
            card.className = 'chunk-card';
            card.innerHTML = `
                <h2>Chunk ${chunk.chunk_id}</h2>
                <p><strong>数据条数:</strong> ${chunk.count}</p>
                <p><strong>索引范围:</strong> ${chunk.start_index} - ${chunk.end_index}</p>
            `;
            chunkGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading chunks:', error);
        const chunkGrid = document.getElementById('chunkGrid');
        
        // 检查是否是 CORS 或文件协议问题
        let errorMessage = '';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || 
            window.location.protocol === 'file:') {
            errorMessage = `
                <div style="color: red; padding: 20px; background: #ffe6e6; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">⚠️ 无法加载数据文件</h3>
                    <p><strong>原因：</strong>浏览器安全策略阻止了直接打开 HTML 文件时的数据加载。</p>
                    <p><strong>解决方案：</strong>请使用本地服务器运行网站。</p>
                    <div style="margin-top: 15px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
                        <p style="margin: 5px 0;"><strong>方法 1（Python）：</strong></p>
                        <code style="display: block; padding: 10px; background: white; border-radius: 3px; margin: 5px 0;">
                            cd /Users/dongming/Desktop/Human_Check_Website<br>
                            python3 -m http.server 8000
                        </code>
                        <p style="margin: 10px 0 5px 0;">然后在浏览器中访问：<code>http://localhost:8000</code></p>
                        
                        <p style="margin: 15px 0 5px 0;"><strong>方法 2（Node.js）：</strong></p>
                        <code style="display: block; padding: 10px; background: white; border-radius: 3px; margin: 5px 0;">
                            npx http-server -p 8000
                        </code>
                    </div>
                </div>
            `;
        } else {
            errorMessage = `
                <div style="color: red; padding: 20px; background: #ffe6e6; border-radius: 8px;">
                    <h3 style="margin-top: 0;">加载 chunks 失败</h3>
                    <p>错误信息：${error.message}</p>
                    <p>请检查数据文件是否存在：<code>data/chunks_index.json</code></p>
                </div>
            `;
        }
        
        chunkGrid.innerHTML = errorMessage;
    }
}


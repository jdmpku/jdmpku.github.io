let currentChunk = null;
let currentData = null;
let currentIndex = -1;
let editingImplicitIndex = -1;

// Get chunk ID from URL
const urlParams = new URLSearchParams(window.location.search);
const chunkId = urlParams.get('chunk');

if (!chunkId) {
    alert('未指定 Chunk ID，将返回首页');
    window.location.href = 'index.html';
}

document.getElementById('chunkIdDisplay').textContent = chunkId;

// Load chunk data
document.addEventListener('DOMContentLoaded', function() {
    loadChunkData();
});

async function loadChunkData() {
    try {
        const response = await fetch(`data/chunk_${chunkId}.json`);
        currentChunk = await response.json();
        
        // Populate data selector
        const dataSelect = document.getElementById('dataSelect');
        dataSelect.innerHTML = '<option value="">请选择...</option>';
        
        currentChunk.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${index + 1}. ${item.name || 'Unnamed'}`;
            dataSelect.appendChild(option);
        });
        
        document.getElementById('dataCounter').textContent = `共 ${currentChunk.length} 条数据`;
        
        // Load from localStorage if exists
        const savedData = localStorage.getItem(`chunk_${chunkId}_data`);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (Array.isArray(parsed) && parsed.length === currentChunk.length) {
                    currentChunk = parsed;
                    console.log('已加载本地保存的数据');
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    } catch (error) {
        console.error('Error loading chunk data:', error);
        alert('加载数据失败，请检查数据文件是否存在。');
    }
}

function loadDataItem() {
    const select = document.getElementById('dataSelect');
    const index = parseInt(select.value);
    
    if (isNaN(index) || index < 0 || index >= currentChunk.length) {
        document.getElementById('dataEditor').style.display = 'none';
        return;
    }
    
    currentIndex = index;
    currentData = currentChunk[index];
    
    // Populate fields
    document.getElementById('nameField').value = currentData.name || '';
    document.getElementById('initialReqField').value = currentData.initial_requirements || '';
    
    // URL field - convert array to text
    const urlText = Array.isArray(currentData.URL) 
        ? currentData.URL.join('\n') 
        : (currentData.URL || '');
    document.getElementById('urlField').value = urlText;
    
    // Load implicit requirements
    loadImplicitRequirements();
    
    document.getElementById('dataEditor').style.display = 'block';
}

function loadImplicitRequirements() {
    const tbody = document.getElementById('implicitTableBody');
    tbody.innerHTML = '';
    
    const implicitReqs = currentData['Implicit Requirements'] || [];
    
    implicitReqs.forEach((req, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="cell-content">${escapeHtml(req.Aspect || '')}</td>
            <td class="cell-content">${escapeHtml(req.RequirementText || '')}</td>
            <td class="cell-content">${escapeHtml(req['Corresponding User Story'] || '')}</td>
            <td>
                <button class="btn btn-edit" onclick="editImplicitRequirement(${index})">编辑</button>
                <button class="btn btn-danger" onclick="deleteImplicitRequirement(${index})">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addImplicitRequirement() {
    editingImplicitIndex = -1;
    document.getElementById('modalAspect').value = '';
    document.getElementById('modalRequirementText').value = '';
    document.getElementById('modalCorrespondingStory').value = '';
    document.getElementById('editModal').style.display = 'block';
}

function editImplicitRequirement(index) {
    editingImplicitIndex = index;
    const req = currentData['Implicit Requirements'][index];
    
    document.getElementById('modalAspect').value = req.Aspect || '';
    document.getElementById('modalRequirementText').value = req.RequirementText || '';
    document.getElementById('modalCorrespondingStory').value = req['Corresponding User Story'] || '';
    document.getElementById('editModal').style.display = 'block';
}

function saveImplicitRequirement() {
    const aspect = document.getElementById('modalAspect').value.trim();
    const requirementText = document.getElementById('modalRequirementText').value.trim();
    const correspondingStory = document.getElementById('modalCorrespondingStory').value.trim();
    
    if (!requirementText) {
        alert('Requirement Text 不能为空');
        return;
    }
    
    const newReq = {
        Aspect: aspect,
        RequirementText: requirementText,
        'Corresponding User Story': correspondingStory
    };
    
    if (!currentData['Implicit Requirements']) {
        currentData['Implicit Requirements'] = [];
    }
    
    if (editingImplicitIndex >= 0) {
        // Edit existing
        currentData['Implicit Requirements'][editingImplicitIndex] = newReq;
    } else {
        // Add new
        currentData['Implicit Requirements'].push(newReq);
    }
    
    currentChunk[currentIndex] = currentData;
    loadImplicitRequirements();
    closeEditModal();
}

function deleteImplicitRequirement(index) {
    if (confirm('确定要删除这条隐式需求吗？')) {
        currentData['Implicit Requirements'].splice(index, 1);
        currentChunk[currentIndex] = currentData;
        loadImplicitRequirements();
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingImplicitIndex = -1;
}

function saveCurrentItem() {
    if (currentIndex < 0) {
        alert('请先选择一条数据');
        return;
    }
    
    // Update URL from text field
    const urlText = document.getElementById('urlField').value.trim();
    currentData.URL = urlText ? urlText.split('\n').filter(line => line.trim()) : [];
    
    // Update current chunk
    currentChunk[currentIndex] = currentData;
    
    // Save to localStorage
    localStorage.setItem(`chunk_${chunkId}_data`, JSON.stringify(currentChunk));
    
    alert('数据已保存到本地存储！');
}

function resetCurrentItem() {
    if (confirm('确定要重置当前数据吗？未保存的修改将丢失。')) {
        loadDataItem();
    }
}

function exportChunk() {
    if (!currentChunk) {
        alert('没有可导出的数据');
        return;
    }
    
    // Get data from localStorage if exists
    const savedData = localStorage.getItem(`chunk_${chunkId}_data`);
    const dataToExport = savedData ? JSON.parse(savedData) : currentChunk;
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chunk_${chunkId}_exported.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}


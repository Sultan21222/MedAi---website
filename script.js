//темный/светлый
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isDark ? '☀️' : '🌙';
}

function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.innerText = '☀️';
    }
}

//навигация
function showSection(id) {
    const sections = ['home', 'services', 'cabinet']; 
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

//авторизация
function login() {
    closeModal('login-modal');
    document.getElementById('auth-buttons').classList.add('hidden');
    document.getElementById('user-profile-btn').classList.remove('hidden');
    document.querySelector('#user-profile-btn span').innerText = 'Хасен Султан';
    showSection('cabinet');
}

function logout() {
    document.getElementById('auth-buttons').classList.remove('hidden');
    document.getElementById('user-profile-btn').classList.add('hidden');
    showSection('home');
}


function openFileWindow(inputId) {
    document.getElementById(inputId).click();
}

function handleFileSelect(input, type) {
    if (input.files && input.files[0]) {
        startAnalysis(type, input.files[0]);
    }
}

async function startAnalysis(type, fileObject) {
    const analysisContainer = document.getElementById('analysis-container');
    const resultText = document.getElementById('result-text');
    const loader = document.getElementById('loader');
    const segView = document.getElementById('segmentation-result');

    analysisContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    resultText.classList.add('hidden');
    segView.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', fileObject);

    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        loader.classList.add('hidden');

        if (data.success) {
            //маска
            const maskSrc = `data:image/png;base64,${data.mask}`;
            
            segView.innerHTML = `
                <p class="text-sm font-bold mb-2">Результат сегментации ИИ:</p>
                <img src="${maskSrc}" class="w-64 h-64 border-2 border-indigo-500 rounded-lg shadow-lg bg-black">
            `;
            segView.classList.remove('hidden');

            //сохраняем в кабинет
            saveToCabinet(type, fileObject.name, maskSrc);
        }
    } catch (error) {
        loader.classList.add('hidden');
        resultText.classList.remove('hidden');
        resultText.innerHTML = "Ошибка сервера";
    }
}
let analysisHistory = JSON.parse(localStorage.getItem('medai_history')) || [];

//сброс анализа
function resetAnalysisUI() {
    const container = document.getElementById('analysis-container');
    const segResult = document.getElementById('segmentation-result');
    const resultText = document.getElementById('result-text');
    const fileInfo = document.getElementById('file-info');

    container.classList.add('hidden'); 
    segResult.innerHTML = '';        
    segResult.classList.add('hidden'); 
    resultText.innerHTML = '';        
    fileInfo.innerHTML = '';         
}

function saveToCabinet(type, fileName, maskSrc) {
    const newEntry = {
        id: Date.now(),
        type: type,
        file: fileName,
        mask: maskSrc,
        date: new Date().toLocaleString()
    };
    analysisHistory.unshift(newEntry); 
    localStorage.setItem('medai_history', JSON.stringify(analysisHistory)); // Сохраняем
    renderHistory(); 
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (analysisHistory.length === 0) {
        historyList.innerHTML = '<p style="color: #94a3b8; font-style: italic; text-align: center;">История пуста...</p>';
        return;
    }

    historyList.innerHTML = analysisHistory.map(item => `
        <div class="history-item">
            <img src="${item.mask}" style="width: 50px; height: 50px; border-radius: 8px; background: black; border: 1px solid #ddd;">
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 0.9rem;">${item.type}</h4>
                <p style="margin: 0; font-size: 0.75rem; color: #64748b;">${item.file} • ${item.date}</p>
            </div>
            <span style="font-size: 0.7rem; color: #10b981; font-weight: bold;">Успешно</span>
        </div>
    `).join('');
}

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    if (sectionId === 'home'||sectionId === 'services') {
        resetAnalysisUI();
    }
    if (sectionId === 'cabinet') {
        renderHistory();
    }
}

//инициализация

document.addEventListener('DOMContentLoaded', renderHistory);
document.addEventListener('DOMContentLoaded', initTheme);
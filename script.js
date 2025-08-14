// 1. 初始化地图 (无变化)
const map = L.map('map').setView([55.6928, 12.5992], 13);
const minZoomLevel = 11.5;

// 创建图层面板 (无变化)
map.createPane('linesPane');
map.getPane('linesPane').style.zIndex = 400;
map.createPane('pointsPane');
map.getPane('pointsPane').style.zIndex = 600;
map.createPane('labelsPane');
map.getPane('labelsPane').style.zIndex = 650;

// 2. 添加OSM底图 (无变化)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 定义图标和样式 (无变化)
const attractionIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#ff7300ff"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});
const walkingRouteStyle = { color: '#0000FF', weight: 4, opacity: 0.9, dashArray: '10, 10' };
const seaRouteStyle = { color: '#FF0000', weight: 4, opacity: 0.85 };
const stationPointStyle = { radius: 6, fillColor: "#0000FF", color: "#fff", weight: 2.5, opacity: 1, fillOpacity: 1 };

// --- 数据管理模块 (无变化) ---
const userDataManager = {
    saveData: function(id, data) {
        const allData = this.getAllData();
        allData[id] = { ...allData[id], ...data };
        localStorage.setItem('copenhagenMapUserData', JSON.stringify(allData));
    },
    loadData: function(id) {
        const allData = this.getAllData();
        return allData[id] || {};
    },
    getAllData: function() {
        const data = localStorage.getItem('copenhagenMapUserData');
        return data ? JSON.parse(data) : {};
    }
};

// --- 图层管理模块 (无变化) ---
const layerManager = {
    layers: {}, 
    
    addFeature: function(feature, layer) {
        const category = feature.properties.class || 'uncategorized';
        if (!this.layers[category]) {
            this.layers[category] = [];
        }
        this.layers[category].push(layer);
    },

    filter: function(category) {
        Object.values(this.layers).flat().forEach(layer => {
            map.removeLayer(layer);
        });

        let layersToShow = [];
        if (category === 'all') {
            layersToShow = Object.values(this.layers).flat();
        } else if (this.layers[category]) {
            layersToShow = this.layers[category];
        }

        layersToShow.forEach(layer => {
            map.addLayer(layer);
        });
    }
};


// --- 弹窗内容生成函数 (系列) ---

// 函数1: 生成默认的“展示”弹窗内容
function createPopupContent(feature, layer) {
    const { id, name_en, name_zh, description, default_image_url } = feature.properties;
    const userData = userDataManager.loadData(id);
    const title = name_en ? `${name_en} (${name_zh})` : name_zh || "详情";
    const imageUrl = userData.userImage || default_image_url;
    const moodRecord = userData.userMood ? `<div class="user-mood-record"><b>我的心情:</b> ${userData.userMood}</div>` : '';
    let html = `<div class="popup-header">${title}</div>`;
    if (imageUrl) {
        html += `<img src="${imageUrl}" alt="${title}" class="popup-image">`;
    }
    html += `<hr>${description || ''}`;
    html += moodRecord;
    const isVisited = userData.visited || false;
    html += `<div class="visited-checkbox-container"><label><input type="checkbox" class="visited-checkbox" data-feature-id="${id}" ${isVisited ? 'checked' : ''}> 我来过这里</label></div>`;
    // 这个div现在只包含“添加/修改”按钮
    html += `<div id="popup-interaction-${id}" class="popup-interaction-form"><button class="add-story-btn" data-feature-id="${id}">添加/修改我的足迹</button></div>`;
    return html;
}

// 函数2: 生成“编辑”状态的弹窗内容
function createEditFormContent(feature, layer) {
    const { id, name_en, name_zh, description } = feature.properties;
    const userData = userDataManager.loadData(id);
    const title = name_en ? `${name_en} (${name_zh})` : name_zh || "详情";
    // 在编辑界面，我们依然可以显示已有的图片
    const imageUrl = userData.userImage || feature.properties.default_image_url;
    
    let html = `<div class="popup-header">${title}</div>`;
    if (imageUrl) {
        html += `<img src="${imageUrl}" alt="${title}" class="popup-image">`;
    }
    html += `<hr>${description || ''}`;
    
    // 生成表单部分
    html += `
        <div id="popup-interaction-${id}" class="popup-interaction-form">
            <label for="mood-input-${id}">我的心情：</label>
            <input type="text" id="mood-input-${id}" placeholder="记录下此刻的心情吧！" value="${userData.userMood || ''}">
            <label for="photo-input-${id}">上传新照片：</label>
            <input type="file" id="photo-input-${id}" accept="image/*">
            <button class="save-story-btn" data-feature-id="${id}">保存足迹</button>
        </div>
    `;
    return html;
}


// --- 样式和图片压缩函数 (无变化) ---
function toggleVisitedStyle(layer, isVisited) {
    const iconElement = layer.getElement();
    if (!iconElement) return;
    if (isVisited) { L.DomUtil.addClass(iconElement, 'marker-visited'); }
    else { L.DomUtil.removeClass(iconElement, 'marker-visited'); }
}
function compressImage(file, maxSize = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
                else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// 4. 加载并渲染GeoJSON数据 (无变化)
fetch('copenhagen.geojson') 
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                if (feature.geometry.type.includes("LineString")) {
                    return feature.properties.class === 'walkingroutes' ? walkingRouteStyle : seaRouteStyle;
                }
            },
            pointToLayer: function (feature, latlng) {
                const pointOptions = {}; 
                if (feature.properties.class === 'attractions') {
                    return L.marker(latlng, { ...pointOptions, icon: attractionIcon });
                }
                return L.circleMarker(latlng, { ...pointOptions, ...stationPointStyle });
            },
            onEachFeature: function (feature, layer) {
                if (feature.geometry.type.includes("LineString")) {
                    layer.options.pane = 'linesPane';
                } else {
                    layer.options.pane = 'pointsPane';
                }
                layerManager.addFeature(feature, layer);
                const properties = feature.properties;
                if (properties && properties.id) {
                    // 绑定初始弹窗内容生成函数
                    layer.bindPopup(() => createPopupContent(feature, layer), { minWidth: 250, maxWidth: 300 });
                    layer.on('add', function() {
                        const userData = userDataManager.loadData(feature.properties.id);
                        if (userData.visited) { toggleVisitedStyle(this, true); }
                    });
                } else if (properties && typeof properties.description !== 'undefined') {
                    layer.bindPopup(`<b>${properties.name_en ? `${properties.name_en} (${properties.name_zh})` : properties.name_zh || "详情"}</b><br><hr>${properties.description}`);
                }
                if (properties) {
                    const tooltipOptions = { permanent: true, className: 'my-labels', interactive: true, pane: 'labelsPane' };
                    let labelText = '';
                    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                        labelText = properties.name_en ? `${properties.name_en} (${properties.name_zh})` : properties.name_zh || '';
                        if (layer instanceof L.Marker) { tooltipOptions.direction = 'left'; tooltipOptions.offset = [-8, 0]; } 
                        else { tooltipOptions.direction = 'right'; tooltipOptions.offset = [5, 0]; }
                        if (labelText) {
                           const tooltip = layer.bindTooltip(labelText, tooltipOptions);
                           tooltip.on('click', () => layer.openPopup());
                        }
                    } else if (layer instanceof L.Polyline) {
                        const textClass = feature.properties.class === 'walkingroutes' ? 'walking-route-label' : 'sea-route-label';
                        labelText = properties.name_zh || '';
                        if (labelText) { layer.setText(labelText, { center: true, attributes: { class: textClass } }); }
                    }
                }
            }
        });
        setupFilterControls();
    })
    .catch(error => {
        console.error('加载GeoJSON时出错:', error);
        map.openPopup(`无法加载地图数据 (copenhagen.geojson)。`, map.getCenter());
    });

// --- 筛选器控件 (无变化) ---
function setupFilterControls() {
    const controlsContainer = L.DomUtil.get('filter-controls');
    const categories = {
        'all': '显示全部',
        'attractions': '景点',
        'stations': '交通站点',
        'walkingroutes': '步行路线',
        'searoutes': '海上路线',
    };
    let buttonsHtml = '';
    Object.keys(categories).forEach(cat => {
        buttonsHtml += `<button data-filter="${cat}" class="${cat === 'all' ? 'active' : ''}">${categories[cat]}</button>`;
    });
    controlsContainer.innerHTML = buttonsHtml;
    controlsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const filter = e.target.dataset.filter;
            controlsContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            layerManager.filter(filter);
        }
    });
    layerManager.filter('all');
}


// --- 弹窗事件处理 (最终修正版) ---
map.on('popupopen', function (e) {
    const popup = e.popup;
    const container = popup.getElement();
    if (!container) return;

    const clickHandler = async (event) => {
        // 关键：在处理任何点击前，先阻止其传播到地图，避免弹窗关闭
        L.DomEvent.stopPropagation(event);

        const target = event.target;
        const layer = popup._source;
        const feature = layer.feature;

        // 分支1: 点击 "添加/修改我的足迹" - 采纳您的建议
        if (target.matches('.add-story-btn')) {
            // 使用 setContent 重新生成整个弹窗为“编辑”模式
            popup.setContent(createEditFormContent(feature, layer));
        }
        
        // 分支2: 点击 "保存足迹"
        else if (target.matches('.save-story-btn')) {
            target.disabled = true;
            target.textContent = '保存中...';

            const featureId = target.dataset.featureId;
            const moodInput = container.querySelector(`#mood-input-${featureId}`);
            const photoInput = container.querySelector(`#photo-input-${featureId}`);
            const dataToSave = { userMood: moodInput.value };
            const file = photoInput.files[0];

            if (file) {
                try {
                    dataToSave.userImage = await compressImage(file);
                } catch (error) {
                    console.error("图片压缩失败:", error);
                    alert("图片处理失败，请尝试另一张图片。");
                    target.disabled = false;
                    target.textContent = '保存足迹';
                    return;
                }
            }
            
            userDataManager.saveData(featureId, dataToSave);
            // 保存后，使用 setContent 重新生成整个弹窗为“展示”模式
            popup.setContent(createPopupContent(feature, layer));
        }
    };

    const changeHandler = (event) => {
        if (event.target.matches('.visited-checkbox')) {
            const layer = popup._source;
            const featureId = event.target.dataset.featureId;
            const isVisited = event.target.checked;
            userDataManager.saveData(featureId, { visited: isVisited });
            toggleVisitedStyle(layer, isVisited);
        }
    };

    // 统一绑定事件
    L.DomEvent.on(container, 'click', clickHandler);
    L.DomEvent.on(container, 'change', changeHandler);

    // 清理事件，防止内存泄漏
    popup.on('remove', function () {
        L.DomEvent.off(container, 'click', clickHandler);
        L.DomEvent.off(container, 'change', changeHandler);
    });
});


// 5. 定位和可见性控制 (无变化)
const locateControl = L.control.locate({
    position: 'topleft',
    strings: { title: "显示我的位置" },
    setView: false,
    showCompass: true,
    keepCurrentZoomLevel: true,
    pane: 'pointsPane',
    showPopup: false
}).addTo(map);
locateControl.start(); 
map.on('locationerror', function(e) {
    alert("定位失败: " + e.message + "\n\n请检查您是否已授权浏览器获取位置信息。");
});
function updateVisibility() {
    const currentZoom = map.getZoom();
    const show = currentZoom >= minZoomLevel;
    map.getPane('linesPane').style.display = show ? 'block' : 'none'; 
    map.getPane('pointsPane').style.display = show ? 'block' : 'none';
    map.getPane('labelsPane').style.display = show ? 'block' : 'none';
    document.querySelectorAll('.leaflet-text-path').forEach(path => {
        path.style.display = show ? 'block' : 'none';
    });
}
map.on('zoomend', updateVisibility);
setTimeout(updateVisibility, 500);
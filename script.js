// 1. 初始化地图
const map = L.map('map').setView([55.6928, 12.5992], 13);

// *** FIX 3.1: 定义控制可见性的最小缩放级别 ***
const minZoomLevel = 12.5; 

// 创建图层面板
map.createPane('linesPane');
map.getPane('linesPane').style.zIndex = 400; // 线条
map.createPane('pointsPane');
map.getPane('pointsPane').style.zIndex = 600; // 点图标
// *** FIX 3.1: 为标签创建专用面板，以便统一控制 ***
map.createPane('labelsPane');
map.getPane('labelsPane').style.zIndex = 650; // 确保标签在点之上


// 2. 添加OSM底图
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 定义图标和样式 (这部分无变化)
const attractionIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#ff7300ff"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});
const walkingRouteStyle = { color: '#0000FF', weight: 4, opacity: 0.9, dashArray: '10, 10' };
const seaRouteStyle = { color: '#FF0000', weight: 4, opacity: 0.85 };
const stationPointStyle = { radius: 6, fillColor: "#0000FF", color: "#fff", weight: 2.5, opacity: 1, fillOpacity: 1 };


// 4. 加载并渲染GeoJSON数据
fetch('copenhagen.geojson') 
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pane: 'linesPane',
            style: function (feature) {
                if (feature.geometry.type.includes("LineString")) {
                    return feature.properties.class === 'walkingroutes' ? walkingRouteStyle : seaRouteStyle;
                }
            },
            pointToLayer: function (feature, latlng) {
                const pointOptions = { pane: 'pointsPane' };
                if (feature.properties.class === 'attractions') {
                    return L.marker(latlng, { ...pointOptions, icon: attractionIcon });
                }
                return L.circleMarker(latlng, { ...pointOptions, ...stationPointStyle });
            },
            onEachFeature: function (feature, layer) {
                const properties = feature.properties;
                
                if (properties && typeof properties.description !== 'undefined') {
                    let popupTitle = properties.name_en ? `${properties.name_en} (${properties.name_zh})` : properties.name_zh || "详情";
                    layer.bindPopup(`<b>${popupTitle}</b><br><hr>${properties.description}`);
                }

                if (properties) {
                    const tooltipOptions = {
                        permanent: true,
                        className: 'my-labels',
                        interactive: true,
                        // *** FIX 3.1: 将所有标签都放入专用的 'labelsPane' ***
                        pane: 'labelsPane'
                    };
                    
                    let labelText = '';

                    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                        labelText = properties.name_en ? `${properties.name_en} (${properties.name_zh})` : properties.name_zh || '';
                        
                        if (layer instanceof L.Marker) {
                             tooltipOptions.direction = 'left';
                             tooltipOptions.offset = [-8, 0];
                        } else {
                             tooltipOptions.direction = 'right';
                             tooltipOptions.offset = [5, 0];
                        }

                        if (labelText) {
                           const tooltip = layer.bindTooltip(labelText, tooltipOptions);
                           tooltip.on('click', () => layer.openPopup());
                        }

                    } else if (layer instanceof L.Polyline) {
                        if (feature.properties.class === 'walkingroutes') {
                            if (properties.name_zh) {
                                layer.setText(properties.name_zh, {
                                    center: true,
                                    attributes: { class: 'walking-route-label' }
                                });
                            }
                        } else {
                            labelText = properties.name_zh || '';
                            if (labelText) {
                                layer.setText(labelText, {
                                    center: true,
                                    attributes: { class: 'sea-route-label' }
                                });
                            }
                        }
                    }
                }
            }
        }).addTo(map);
    })
    .catch(error => {
        console.error('加载GeoJSON时出错:', error);
        map.openPopup(`无法加载地图数据 (copenhagen.geojson)。`, map.getCenter());
    });


// 5. 添加实时定位功能
const locateControl = L.control.locate({
    position: 'topleft',
    strings: { title: "显示我的位置" },
    flyTo: true,
    pane: 'pointsPane',
    showPopup: false // 不显示默认的成功弹窗
}).addTo(map);

// *** FIX 3.2: 添加定位失败的错误处理 ***
map.on('locationerror', function(e) {
    // e.message 中包含了具体的错误信息
    alert("定位失败: " + e.message + "\n\n请检查您是否已授权浏览器获取位置信息，并确保您在 HTTPS 安全环境下访问本页面。");
});


// *** FIX 3.1: 控制可见性的核心函数 ***
function updateVisibility() {
    const currentZoom = map.getZoom();
    const show = currentZoom >= minZoomLevel;

    // 控制线路面板的可见性 ***
    map.getPane('linesPane').style.display = show ? 'block' : 'none'; 
    
    // 控制点图标和标签面板的显示或隐藏
    map.getPane('pointsPane').style.display = show ? 'block' : 'none';
    map.getPane('labelsPane').style.display = show ? 'block' : 'none';
    
    // 对于沿线文字，我们需要更精细的控制
    // 注意：setText插件的文本不是放在Pane里的，需要单独处理
    document.querySelectorAll('.leaflet-text-path').forEach(path => {
        path.style.display = show ? 'block' : 'none';
    });
}

// *** FIX 3.1: 监听地图缩放事件，并立即执行一次以设置初始状态 ***
map.on('zoomend', updateVisibility);
// 等待一小段时间让地图元素完全加载后再执行第一次，避免元素还未创建
setTimeout(updateVisibility, 500); 
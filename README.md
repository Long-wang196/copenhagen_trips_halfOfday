#哥本哈根半日游地图 (Copenhagen Half-Day Tour Map)

这是一个基于 Leaflet.js 构建的、功能丰富的交互式网页地图，旨在为哥本哈根的半日游提供清晰的路线和景点指引。
This is a feature-rich interactive web map built with Leaflet.js, designed to provide clear routes and points of interest for a half-day tour in Copenhagen.



您可以在这里访问在线演示版本：https://long-wang196.github.io/copenhagen_trips_halfOfday/

功能特性

交互式地图: 使用 OpenStreetMap 作为底图，提供流畅的缩放和平移体验。
自定义数据渲染: 加载并渲染本地的 copenhagen.geojson 文件，清晰区分不同类型的地理要素。
丰富的符号系统:
旅游景点 (class: attractions): 以醒目的橙色五角星图标显示。
海上公交站点 (无class属性的点): 以蓝色实心圆点显示。
步行观光路线 (class: walkingroutes): 以蓝色虚线表示，并附有平行的红色文字标签。
海上公交路线 (无class属性的线): 以红色实线表示，并附有平行的蓝色文字标签。

智能标签系统:
所有点状要素的标签均以 "英文名称 (中文名称)" 的格式永久显示在地图上。
海上公交路线的标签仅显示中文名称，以保持简洁。
所有标签和点状符号在视觉上分离，避免重叠。

统一的交互体验: 无论点击地图符号还是其文字标签，都可以弹出包含详细描述信息 (description) 的信息框。
图层顺序管理: 通过 Leaflet Panes 技术，确保所有点状要素（景点、站点）始终显示在线状要素（路线）之上。

实时定位: 地图左上角提供一个定位按钮，可以快速移动到用户的当前位置（需要在安全环境 https 下使用）。
分级缩放显示 (Zoom-based Visibility): 为了保持地图在不同尺度下的清晰度，所有要素（点、线、标签）仅在地图缩放级别达到11.5级或以上时才可见。

技术栈
HTML5
CSS3
JavaScript (ES6+)
Leaflet.js v1.9.4
Leaflet.locatecontrol (定位插件)
Leaflet.Polyline.TextPath (文字沿线插件)

项目结构
code
Code
/
├── index.html          # HTML主文件
├── script.js           # 地图交互核心逻辑
├── style.css           # 自定义样式 (可留空)
├── copenhagen.geojson  # 地图数据源
└── README.md           # 项目说明文件

安装与使用
克隆或下载此仓库到本地。
确保 copenhagen.geojson 文件与 index.html 在同一目录下。
由于浏览器的CORS安全策略，不能直接通过 file:// 协议打开 index.html 文件来加载GeoJSON数据。您需要启动一个本地Web服务器。

如果您安装了Python 3, 可以在项目根目录下运行:
code
Bash
python -m http.server
然后，在浏览器中访问 http://localhost:8000。
将整个项目文件夹上传到GitHub仓库，并开启GitHub Pages功能，即可获得一个公开的 https 网址，该网址下所有功能（包括实时定位）均可正常使用。

数据格式要求
copenhagen.geojson 文件中的要素属性（properties）需要遵循以下格式以保证所有功能正常运行：
class: 用于区分要素类型。"attractions" 表示景点, "walkingroutes" 表示步行路线。
name_zh: 中文名称，用于标签和弹窗。
name_en: 英文名称，用于标签和弹窗。
description: 详细描述信息，在点击要素时于弹窗中显示。

版本
v1.0.0 (2025-08-10)

English Version

You can access the live demo here:
(https://long-wang196.github.io/copenhagen_trips_halfOfday/)

Features
Interactive Map: Utilizes OpenStreetMap as a base layer, providing a smooth zoom and pan experience.
Custom Data Rendering: Loads and renders a local copenhagen.geojson file, clearly distinguishing different types of geographic features.

Rich Symbology:
Attractions (class: attractions): Displayed as prominent orange star icons.
Harbour Bus Stations (Points without a class): Displayed as solid blue circle markers.
Walking Routes (class: walkingroutes): Represented by blue dashed lines with parallel red text labels.
Harbour Bus Routes (Lines without a class): Represented by red solid lines with parallel blue text labels.

Intelligent Labeling System:
Permanent labels for all point features are displayed in the "English Name (Chinese Name)" format.
Harbour bus route labels show only the Chinese name for conciseness.
Labels and point symbols are visually offset to prevent overlap.

Unified Interaction: Clicking on either a map symbol or its text label will open a popup window with detailed information (description).
Layer Order Management: Using Leaflet Panes, it ensures that all point features (attractions, stations) are always displayed on top of line features (routes).
Real-time Geolocation: A location button on the top-left corner allows users to quickly navigate to their current position (requires a secure https context to function).
Zoom-based Visibility: To maintain clarity at different scales, all features (points, lines, labels) are only visible at map zoom level 11.5 or higher.

Technology Stack
HTML5
CSS3
JavaScript (ES6+)
Leaflet.js v1.9.4
Leaflet.locatecontrol (Geolocation Plugin)
Leaflet.Polyline.TextPath (Text on Path Plugin)
Project Structure

code
Code
/
├── index.html          # Main HTML file
├── script.js           # Core map interaction logic
├── style.css           # Custom styles (can be empty)
├── copenhagen.geojson  # Map data source
└── README.md           # Project documentation

Setup and Usage
Clone or download this repository to your local machine.
Ensure the copenhagen.geojson file is in the same directory as index.html.
Due to browser CORS policies, you cannot load the GeoJSON data by opening index.html directly via the file:// protocol. You need to run a local web server.
If you have Python 3, you can run this command in the project's root directory:
code
Bash
python -m http.server
```    *   Then, open `http://localhost:8000` in your browser.

For full functionality (including geolocation), upload the entire project folder to a GitHub repository and enable GitHub Pages. This will provide a public https URL where all features work correctly.

Data Requirements
The properties of features within copenhagen.geojson must adhere to the following format for all functionalities to work as intended:
class: Distinguishes feature types. Key values are "attractions" and "walkingroutes".
name_zh: The Chinese name, used for labels and popups.
name_en: The English name, used for labels and popups.
description: Detailed information displayed in the popup upon clicking a feature.

Versioning
v1.0.0 (2025-08-10)

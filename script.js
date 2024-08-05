const url = 'Book1.pdf'; // Đường dẫn đến tệp PDF trong cùng thư mục

const inputNumber = document.getElementById('input-number');
const suggestions = document.getElementById('suggestions');
const pdfContainer = document.getElementById('pdf-container');

let pdfDoc = null;
let textItems = [];
let svg = null;

// Tạo SVG để vẽ các vòng tròn
function createSVG() {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pdfContainer.appendChild(svg);
}

// Tải tài liệu PDF
pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc = pdf;
    renderAllPages();
    createSVG();
}).catch(error => {
    console.error("Error loading PDF: ", error);
});

// Hiển thị tất cả các trang của PDF
function renderAllPages() {
    const numPages = pdfDoc.numPages;
    pdfContainer.innerHTML = ''; // Xóa nội dung trước đó
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
        pdfDoc.getPage(pageNumber).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.classList.add('pdf-page');
            canvas.setAttribute('data-page-number', pageNumber); // Lưu số trang vào thuộc tính data
            canvas.setAttribute('data-viewport', JSON.stringify(viewport.transform)); // Lưu viewport transform vào thuộc tính data

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            pdfContainer.appendChild(canvas);

            page.render(renderContext).promise.then(() => {
                page.getTextContent().then(textContent => {
                    textItems.push(...textContent.items.map(item => ({ ...item, pageNumber, viewport })));
                    inputNumber.addEventListener('input', showSuggestions);
                }).catch(error => {
                    console.error("Error getting text content: ", error);
                });
            }).catch(error => {
                console.error("Error rendering page: ", error);
            });
        }).catch(error => {
            console.error("Error getting page: ", error);
        });
    }
}

// Hiển thị danh sách gợi ý
function showSuggestions() {
    const query = inputNumber.value.trim();
    suggestions.innerHTML = '';
    if (query) {
        const matches = textItems
            .filter(item => item.str.startsWith(query)) // Chỉ khớp các số bắt đầu với query
            .sort((a, b) => parseInt(a.str) - parseInt(b.str)); // Sắp xếp theo thứ tự từ nhỏ tới lớn

        if (matches.length > 0) {
            suggestions.style.display = 'block';
            matches.forEach(item => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = item.str;
                div.addEventListener('click', () => {
                    inputNumber.value = item.str; // Đặt giá trị đã chọn vào ô nhập liệu
                    suggestions.style.display = 'none';
                    circleNumber(item);
                });
                suggestions.appendChild(div);
            });
        } else {
            suggestions.style.display = 'none';
        }
    } else {
        suggestions.style.display = 'none';
    }
}

// Xóa tất cả các vòng tròn hiện có
function clearCircles() {
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
}

// Khoanh tròn số đã chọn
function circleNumber(item) {
    clearCircles(); // Xóa các vòng tròn hiện có trước khi vẽ mới

    const canvas = pdfContainer.querySelector(`canvas[data-page-number="${item.pageNumber}"]`);
    const context = canvas.getContext('2d');
    const viewport = item.viewport;

    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const x = tx[4];
    const y = tx[5];
    const width = context.measureText(item.str).width;
    const height = 10; // Chiều cao ước tính của chữ

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x + width / 2);
    circle.setAttribute("cy", y - height / 2);
    circle.setAttribute("r", Math.max(width, height) * 1.5); // Tăng kích thước vòng tròn
    circle.setAttribute("class", "blinking-circle");

    svg.appendChild(circle);
}

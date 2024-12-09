// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

let originalFile = null;

// 上传区域点击事件
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// 拖拽上传
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0071e3';
    uploadArea.style.background = 'rgba(0,113,227,0.05)';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#86868b';
    uploadArea.style.background = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

// 文件选择处理
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

// 图片上传处理
function handleImageUpload(file) {
    originalFile = file;
    
    // 显示原始图片大小
    originalSize.textContent = formatFileSize(file.size);
    
    // 预览原始图片
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        // 压缩图片
        compressImage(e.target.result, qualitySlider.value / 100);
    };
    reader.readAsDataURL(file);
    
    // 显示预览区域
    uploadArea.style.display = 'none';
    previewArea.style.display = 'block';
}

// 图片压缩
function compressImage(base64, quality) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // 压缩图片
        canvas.toBlob((blob) => {
            compressedImage.src = URL.createObjectURL(blob);
            compressedSize.textContent = formatFileSize(blob.size);
            
            // 更新下载按钮
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `compressed_${originalFile.name}`;
                link.click();
            };
        }, 'image/jpeg', quality);
    };
    img.src = base64;
}

// 质量滑块事件
qualitySlider.addEventListener('input', (e) => {
    const quality = e.target.value;
    qualityValue.textContent = quality + '%';
    if (originalImage.src) {
        compressImage(originalImage.src, quality / 100);
    }
});

// 重置按钮
resetBtn.addEventListener('click', () => {
    uploadArea.style.display = 'block';
    previewArea.style.display = 'none';
    fileInput.value = '';
    originalFile = null;
});

// 文件大小格式化
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
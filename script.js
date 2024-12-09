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
const formatSelect = document.getElementById('formatSelect');

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
        if (validateFile(file)) {
            handleImageUpload(file);
        }
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
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // 获取选择的输出格式
            const outputFormat = formatSelect.value;
            
            // 检查格式支持
            if (outputFormat === 'image/avif' && !supportsAVIF()) {
                showError('您的浏览器不支持AVIF格式');
                formatSelect.value = 'image/webp';
                reject(new Error('AVIF not supported'));
                return;
            }
            
            // 压缩图片
            canvas.toBlob((blob) => {
                if (!blob) {
                    showError('格式转换失败,请尝试其他格式');
                    reject(new Error('Compression failed'));
                    return;
                }
                
                compressedImage.src = URL.createObjectURL(blob);
                compressedSize.textContent = formatFileSize(blob.size);
                
                // 计算压缩率
                const compressionRate = ((originalFile.size - blob.size) / originalFile.size * 100).toFixed(1);
                document.getElementById('compressionRate').textContent = compressionRate + '%';
                document.getElementById('spaceSaved').textContent = 
                    formatFileSize(originalFile.size - blob.size);
                
                // 更新下载按钮
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    const ext = outputFormat.split('/')[1];
                    link.download = `compressed_${originalFile.name.split('.')[0]}.${ext}`;
                    link.click();
                };
                
                resolve(blob);
            }, outputFormat, quality);
        };
        
        img.onerror = () => {
            showError('图片加载失败');
            reject(new Error('Image load failed'));
        };
        
        img.src = base64;
    });
}

// 检查AVIF支持
function supportsAVIF() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
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

// 图片懒加载
document.addEventListener("DOMContentLoaded", function() {
  const images = document.querySelectorAll("img[data-src]");
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
});

// 回到顶部功能
window.onscroll = function() {
  const backToTop = document.querySelector('.back-to-top');
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    backToTop.style.display = "block";
  } else {
    backToTop.style.display = "none";
  }
}; 

// 修改文件输入为支持多选
fileInput.removeAttribute('multiple');

// 添加批量处理功能
function handleMultipleFiles(files) {
    const queue = Array.from(files);
    const results = [];
    
    async function processNext() {
        if (queue.length === 0) {
            showBatchResults(results);
            return;
        }
        
        const file = queue.shift();
        const result = await compressImage(file);
        results.push(result);
        updateProgress(results.length, files.length);
        processNext();
    }
    
    processNext();
}

// 添加历史记录功能
const compressionHistory = {
    add(original, compressed) {
        const history = this.get();
        history.unshift({
            timestamp: Date.now(),
            originalSize: original.size,
            compressedSize: compressed.size,
            thumbnail: URL.createObjectURL(compressed)
        });
        localStorage.setItem('compressionHistory', JSON.stringify(history.slice(0, 10)));
    },
    
    get() {
        return JSON.parse(localStorage.getItem('compressionHistory') || '[]');
    },
    
    clear() {
        localStorage.removeItem('compressionHistory');
    }
};

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 3000);
}

// 文件类型检查
function validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('不支持的文件格式');
        return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showError('文件大小超过限制');
        return false;
    }
    
    return true;
}

// 格式变化时重新压缩
formatSelect.addEventListener('change', () => {
    if (originalImage.src) {
        compressImage(originalImage.src, qualitySlider.value / 100);
    }
});

// 添加预估文件大小显示
function updateSizeEstimate() {
    const format = formatSelect.value;
    const quality = qualitySlider.value;
    
    let estimatedSize = originalFile.size;
    
    // 根据格式和质量预估大小
    switch(format) {
        case 'image/jpeg':
            estimatedSize *= (quality / 100);
            break;
        case 'image/png':
            estimatedSize *= 0.8;
            break;
        case 'image/webp':
            estimatedSize *= (quality / 100) * 0.7;
            break;
        case 'image/avif':
            estimatedSize *= (quality / 100) * 0.5;
            break;
    }
    
    document.getElementById('estimatedSize').textContent = 
        `预计大小: ${formatFileSize(estimatedSize)}`;
}

// 在格式或质量变化时更新预估
formatSelect.addEventListener('change', updateSizeEstimate);
qualitySlider.addEventListener('input', updateSizeEstimate);
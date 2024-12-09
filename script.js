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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        if (files.length === 1) {
            const file = files[0];
            if (file && validateFile(file)) {
                handleImageUpload(file);
            }
        } else {
            handleMultipleFiles(Array.from(files).filter(validateFile));
        }
    }
});

// 修改文件选择处理
fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        if (files.length === 1) {
            const file = files[0];
            if (validateFile(file)) {
                handleImageUpload(file);
            }
        } else {
            // 过滤无效文件
            const validFiles = Array.from(files).filter(validateFile);
            if (validFiles.length > 0) {
                handleMultipleFiles(validFiles);
            }
        }
    }
});

// 图片上传处理
function handleImageUpload(file) {
    originalFile = file;
    
    originalSize.textContent = formatFileSize(file.size);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        compressImage(e.target.result, qualitySlider.value / 100, file);
    };
    reader.readAsDataURL(file);
    
    uploadArea.style.display = 'none';
    previewArea.style.display = 'block';
}

// 图片压缩
function compressImage(base64, quality, originalFile) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const outputFormat = formatSelect.value;
            
            if (outputFormat === 'image/avif' && !supportsAVIF()) {
                showError('您的浏览器不支持AVIF格式');
                formatSelect.value = 'image/webp';
                reject(new Error('AVIF not supported'));
                return;
            }
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    showError('格式转换失败,请尝试其他格式');
                    reject(new Error('Compression failed'));
                    return;
                }
                
                // 单文件模式下更新UI
                if (previewArea.style.display === 'block') {
                    compressedImage.src = URL.createObjectURL(blob);
                    compressedSize.textContent = formatFileSize(blob.size);
                    
                    const compressionRate = ((originalFile.size - blob.size) / originalFile.size * 100).toFixed(1);
                    document.getElementById('compressionRate').textContent = compressionRate + '%';
                    document.getElementById('spaceSaved').textContent = 
                        formatFileSize(originalFile.size - blob.size);
                    
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        const ext = outputFormat.split('/')[1];
                        link.download = `compressed_${originalFile.name.split('.')[0]}.${ext}`;
                        link.click();
                    };
                }
                
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
    if (originalImage.src && originalFile) {
        compressImage(originalImage.src, quality / 100, originalFile);
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

// 添加批量处理功能
async function handleMultipleFiles(files) {
    if (files.length === 0) return;
    
    if (files.length > 20) {
        showError('一次最多只能处理20张图片');
        return;
    }
    
    uploadArea.style.display = 'none';
    previewArea.style.display = 'none';
    const progressBar = createProgressBar(files.length);
    document.querySelector('.container').appendChild(progressBar);
    
    const results = [];
    const quality = qualitySlider.value / 100;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const base64 = await readFileAsBase64(file);
            const blob = await compressImage(base64, quality, file);
            results.push({
                original: file,
                compressed: blob
            });
            updateProgress(i + 1, files.length);
        } catch (error) {
            console.error(`处理文件 ${file.name} 时出错:`, error);
            showError(`处理 ${file.name} 失败`);
        }
    }
    
    showBatchResults(results);
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
    if (originalImage.src && originalFile) {
        compressImage(originalImage.src, qualitySlider.value / 100, originalFile);
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

// 添加进度显示
function createProgressBar(total) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
        <div class="progress-inner"></div>
        <div class="progress-text">处理中 0/${total}</div>
    `;
    return progressBar;
}

// 更新进度条
function updateProgress(current, total) {
    const progressBar = document.querySelector('.progress-bar');
    const progressInner = progressBar.querySelector('.progress-inner');
    const progressText = progressBar.querySelector('.progress-text');
    
    const percentage = (current / total) * 100;
    progressInner.style.width = percentage + '%';
    progressText.textContent = `处理中 ${current}/${total}`;
}

// 读取文件为base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 修改showBatchResults函数
function showBatchResults(results) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) progressBar.remove();
    
    const oldBatchPreview = document.querySelector('.batch-preview');
    if (oldBatchPreview) oldBatchPreview.remove();
    
    const batchPreview = document.createElement('div');
    batchPreview.className = 'batch-preview';
    
    // 添加批量格式控制
    const batchControls = document.createElement('div');
    batchControls.className = 'batch-controls';
    batchControls.innerHTML = `
        <div class="format-control">
            <label>批量设置格式:</label>
            <select class="batch-format-select">
                <option value="image/jpeg">JPEG - 适合照片</option>
                <option value="image/png">PNG - 支持透明</option>
                <option value="image/webp">WebP - 更小体积</option>
                <option value="image/avif">AVIF - 最佳压缩</option>
            </select>
            <button class="apply-format-btn">应用到全部</button>
        </div>
    `;
    
    // 创建结果网格
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'batch-results';
    
    // 处理每个结果项
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'batch-item';
        
        const originalSize = formatFileSize(result.original.size);
        const compressedSize = formatFileSize(result.compressed.size);
        const savingsPercent = ((result.original.size - result.compressed.size) / result.original.size * 100).toFixed(1);
        
        resultItem.innerHTML = `
            <div class="item-controls">
                <select class="format-select">
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/avif">AVIF</option>
                </select>
            </div>
            <div class="batch-image">
                <img src="${URL.createObjectURL(result.compressed)}" alt="${result.original.name}">
            </div>
            <div class="batch-info">
                <div class="filename">${result.original.name}</div>
                <div class="size-info">
                    原始: ${originalSize} → 压缩后: ${compressedSize}
                    <span class="savings">(节省 ${savingsPercent}%)</span>
                </div>
            </div>
            <button class="download-single">下载</button>
        `;
        
        // 处理单个文件的格式选择
        const formatSelect = resultItem.querySelector('.format-select');
        formatSelect.value = formatSelect.value || 'image/jpeg';
        
        formatSelect.addEventListener('change', async () => {
            try {
                const base64 = await readFileAsBase64(result.original);
                const newBlob = await compressImage(base64, qualitySlider.value / 100, result.original);
                result.compressed = newBlob;
                
                // 更新预览和大小信息
                const img = resultItem.querySelector('img');
                img.src = URL.createObjectURL(newBlob);
                
                const newSize = formatFileSize(newBlob.size);
                const newSavings = ((result.original.size - newBlob.size) / result.original.size * 100).toFixed(1);
                
                resultItem.querySelector('.size-info').innerHTML = `
                    原始: ${originalSize} → 压缩后: ${newSize}
                    <span class="savings">(节省 ${newSavings}%)</span>
                `;
            } catch (error) {
                showError('格式转换失败');
            }
        });
        
        // 处理下载按钮
        const downloadBtn = resultItem.querySelector('.download-single');
        downloadBtn.addEventListener('click', () => {
            const format = formatSelect.value;
            const ext = format.split('/')[1];
            const link = document.createElement('a');
            link.href = URL.createObjectURL(result.compressed);
            link.download = `compressed_${result.original.name.split('.')[0]}.${ext}`;
            link.click();
        });
        
        resultsGrid.appendChild(resultItem);
    });
    
    // 处理批量格式设置
    const batchFormatSelect = batchControls.querySelector('.batch-format-select');
    const applyFormatBtn = batchControls.querySelector('.apply-format-btn');
    
    applyFormatBtn.addEventListener('click', () => {
        const selectedFormat = batchFormatSelect.value;
        resultsGrid.querySelectorAll('.format-select').forEach(select => {
            select.value = selectedFormat;
            select.dispatchEvent(new Event('change'));
        });
    });
    
    // 添加批量下载按钮
    const batchActions = document.createElement('div');
    batchActions.className = 'batch-actions';
    batchActions.innerHTML = `
        <button class="download-all-btn">下载所有文件</button>
        <button class="reset-btn">返回上传</button>
    `;
    
    // 处理批量下载
    const downloadAllBtn = batchActions.querySelector('.download-all-btn');
    downloadAllBtn.addEventListener('click', () => {
        results.forEach((result, index) => {
            setTimeout(() => {
                const format = resultsGrid.querySelectorAll('.format-select')[index].value;
                const ext = format.split('/')[1];
                const link = document.createElement('a');
                link.href = URL.createObjectURL(result.compressed);
                link.download = `compressed_${result.original.name.split('.')[0]}.${ext}`;
                link.click();
            }, index * 500);
        });
    });
    
    // 处理返回按钮
    const resetBtn = batchActions.querySelector('.reset-btn');
    resetBtn.addEventListener('click', () => {
        batchPreview.remove();
        uploadArea.style.display = 'block';
        fileInput.value = '';
    });
    
    batchPreview.appendChild(batchControls);
    batchPreview.appendChild(resultsGrid);
    batchPreview.appendChild(batchActions);
    document.querySelector('.container').appendChild(batchPreview);
}

// 添加错误提示样式
const style = document.createElement('style');
style.textContent = `
.error-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 59, 48, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);

// 修改上传区域的提示文字
document.querySelector('.upload-content p').textContent = '支持 PNG、JPG 等格式，可同时选择多张图片';
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fromFormat = document.getElementById('fromFormat');
    const toFormat = document.getElementById('toFormat');
    const removeBg = document.getElementById('removeBg');
    const bulkMode = document.getElementById('bulkMode');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const bulkFileInput = document.getElementById('bulkFileInput');
    const bulkUploadBtn = document.getElementById('bulkUploadBtn');
    const bulkUpload = document.getElementById('bulkUpload');
    const bulkPreviewContainer = document.getElementById('bulkPreviewContainer');
    const singleUpload = document.getElementById('singleUpload');
    const convertBtn = document.getElementById('convertBtn');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const loadingModal = document.getElementById('loadingModal');
    const loadingText = document.getElementById('loadingText');

    // State
    let selectedFiles = [];
    let convertedFiles = [];

    // Event Listeners
    bulkMode.addEventListener('change', toggleBulkMode);
    uploadBtn.addEventListener('click', () => fileInput.click());
    bulkUploadBtn.addEventListener('click', () => bulkFileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    bulkFileInput.addEventListener('change', handleBulkFileSelect);
    convertBtn.addEventListener('click', convertImages);
    downloadAllBtn.addEventListener('click', downloadAll);

    // Setup drag and drop
    setupDragAndDrop();

    function toggleBulkMode() {
        if (bulkMode.checked) {
            singleUpload.classList.add('hidden');
            bulkUpload.classList.remove('hidden');
        } else {
            singleUpload.classList.remove('hidden');
            bulkUpload.classList.add('hidden');
        }
        clearPreviews();
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        selectedFiles = [file];
        displayPreview(file);
    }

    function handleBulkFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        selectedFiles = files;
        displayBulkPreviews(files);
    }

    function displayPreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    function displayBulkPreviews(files) {
        bulkPreviewContainer.innerHTML = '';
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'w-full h-full object-cover';
                img.title = file.name;
                
                const div = document.createElement('div');
                div.className = 'relative';
                div.appendChild(img);
                
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '&times;';
                removeBtn.className = 'absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs';
                removeBtn.onclick = () => removeFileFromBulk(file);
                
                div.appendChild(removeBtn);
                bulkPreviewContainer.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }

    function removeFileFromBulk(fileToRemove) {
        selectedFiles = selectedFiles.filter(file => file !== fileToRemove);
        displayBulkPreviews(selectedFiles);
    }

    function clearPreviews() {
        selectedFiles = [];
        previewContainer.classList.add('hidden');
        bulkPreviewContainer.innerHTML = '';
    }

    function setupDragAndDrop() {
        const uploadAreas = [singleUpload.querySelector('div'), bulkUpload.querySelector('div')];
        
        uploadAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('drag-over');
            });
            
            area.addEventListener('dragleave', () => {
                area.classList.remove('drag-over');
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (!files.length) return;
                
                if (bulkMode.checked) {
                    selectedFiles = Array.from(files);
                    displayBulkPreviews(selectedFiles);
                } else {
                    selectedFiles = [files[0]];
                    displayPreview(files[0]);
                }
            });
        });
    }

    async function convertImages() {
        if (selectedFiles.length === 0) {
            alert('Please select at least one image to convert');
            return;
        }

        showLoading(true, `Converting ${selectedFiles.length} image(s)...`);
        convertedFiles = [];

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                loadingText.textContent = `Processing ${i + 1} of ${selectedFiles.length}: ${file.name}`;
                
                const result = await processImage(file);
                if (result) {
                    convertedFiles.push(result);
                }
            }

            displayResults();
        } catch (error) {
            console.error('Conversion error:', error);
            alert('An error occurred during conversion. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    async function processImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const img = new Image();
                img.onload = async function() {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0);
                    
                    // Background removal would go here (would need a proper API/service)
                    if (removeBg.checked) {
                        // This is a placeholder - actual implementation would require a background removal API
                        // For demo purposes, we'll just add a red border to simulate processing
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 10;
                        ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // Convert to target format
                    let mimeType;
                    switch (toFormat.value) {
                        case 'jpg': mimeType = 'image/jpeg'; break;
                        case 'png': mimeType = 'image/png'; break;
                        case 'webp': mimeType = 'image/webp'; break;
                    }
                    
                    const quality = 0.92; // Default quality
                    canvas.toBlob((blob) => {
                        const convertedFile = new File([blob], 
                            `${file.name.split('.')[0]}.${toFormat.value}`, 
                            { type: mimeType });
                        resolve({
                            original: file,
                            converted: convertedFile,
                            url: URL.createObjectURL(blob)
                        });
                    }, mimeType, quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function displayResults() {
        resultsContainer.innerHTML = '';
        
        convertedFiles.forEach((fileData, index) => {
            const div = document.createElement('div');
            div.className = 'border rounded-lg p-3 flex flex-col items-center';
            
            const img = document.createElement('img');
            img.src = fileData.url;
            img.alt = `Converted ${fileData.converted.name}`;
            
            const info = document.createElement('div');
            info.className = 'mt-2 text-center';
            
            const originalSize = document.createElement('p');
            originalSize.className = 'text-sm text-gray-500';
            originalSize.textContent = `Original: ${formatFileSize(fileData.original.size)}`;
            
            const convertedSize = document.createElement('p');
            convertedSize.className = 'text-sm text-gray-500';
            convertedSize.textContent = `Converted: ${formatFileSize(fileData.converted.size)}`;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm';
            downloadBtn.textContent = 'Download';
            downloadBtn.onclick = () => downloadImage(fileData);
            
            info.appendChild(originalSize);
            info.appendChild(convertedSize);
            info.appendChild(downloadBtn);
            
            div.appendChild(img);
            div.appendChild(info);
            
            resultsContainer.appendChild(div);
        });
        
        resultsSection.classList.remove('hidden');
        downloadAllBtn.classList.toggle('hidden', convertedFiles.length <= 1);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function downloadImage(fileData) {
        const a = document.createElement('a');
        a.href = fileData.url;
        a.download = fileData.converted.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function downloadAll() {
        convertedFiles.forEach((fileData, index) => {
            // Add slight delay to prevent browser blocking multiple downloads
            setTimeout(() => {
                downloadImage(fileData);
            }, index * 200);
        });
    }

    function showLoading(show, message = '') {
        if (show) {
            loadingText.textContent = message;
            loadingModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            loadingModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
});
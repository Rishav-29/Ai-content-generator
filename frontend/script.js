document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const contentType = document.getElementById('content-type');
    const promptInput = document.getElementById('prompt');
    const generateBtn = document.getElementById('generate-btn');
    const errorMessage = document.getElementById('error-message');
    
    const outputContent = document.getElementById('output-content');
    const loading = document.getElementById('loading');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');
    
    // Image handling elements
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const fileUploadWrapper = document.querySelector('.file-upload-wrapper');

    let generatedText = '';
    let selectedImage = null; // Store base64 data and mimeType

    // Theme handling
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
    }

    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = "<i class='bx bx-moon'></i>";
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
        }
    });

    // Image Upload Handling
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target.result;
                imagePreview.src = result;
                
                // Extract base64 data and mime type
                const base64Data = result.split(',')[1];
                selectedImage = {
                    data: base64Data,
                    mimeType: file.type
                };

                imagePreviewContainer.classList.remove('hidden');
                fileUploadWrapper.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', () => {
        imageUpload.value = '';
        selectedImage = null;
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
        fileUploadWrapper.classList.remove('hidden');
    });

    // Helper functions
    const updateStats = (text) => {
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
        wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    };

    const enableButtons = (enable) => {
        copyBtn.disabled = !enable;
        downloadBtn.disabled = !enable;
        clearBtn.disabled = !enable;
    };

    const showError = (msg) => {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.innerHTML = "<i class='bx bx-magic-wand'></i> Generate Magic";
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    // Generate Content via SSE
    generateBtn.addEventListener('click', async () => {
        const type = contentType.value;
        const prompt = promptInput.value.trim();

        if (!prompt) {
            showError('Please enter a prompt to generate content.');
            return;
        }

        hideError();
        generatedText = '';
        outputContent.innerHTML = '';
        updateStats('');
        enableButtons(false);
        
        generateBtn.disabled = true;
        generateBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Generating...";
        loading.classList.remove('hidden');

        try {
            const payload = { contentType: type, prompt };
            if (selectedImage) {
                payload.image = selectedImage;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate content');
            }

            // Setup SSE reading
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            loading.classList.add('hidden');

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                const lines = buffer.split('\n\n');
                // keep the last chunk in buffer if it doesn't end with \n\n
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        
                        if (dataStr === '[DONE]') {
                            break;
                        }

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.text) {
                                generatedText += data.text;
                                outputContent.textContent = generatedText;
                                updateStats(generatedText);
                                // Auto scroll to bottom
                                outputContent.parentElement.scrollTop = outputContent.parentElement.scrollHeight;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE JSON:', e, dataStr);
                        }
                    } else if (line.startsWith('event: error')) {
                        // Handle server-side error during stream
                        const errorLine = lines.find(l => l.startsWith('data: '));
                        if(errorLine) {
                            try {
                                const errorData = JSON.parse(errorLine.substring(6));
                                throw new Error(errorData.message);
                            } catch (e) {
                                throw new Error('Error during stream generation');
                            }
                        }
                    }
                }
            }

            enableButtons(true);

        } catch (error) {
            showError(error.message);
            // If we generated some text before error, keep it and enable buttons
            if (generatedText) {
                enableButtons(true);
            }
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = "<i class='bx bx-magic-wand'></i> Generate Magic";
            loading.classList.add('hidden');
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        if (!generatedText) return;
        
        navigator.clipboard.writeText(generatedText).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = "<i class='bx bx-check'></i>";
            copyBtn.setAttribute('data-tooltip', 'Copied!');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.setAttribute('data-tooltip', 'Copy');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard.');
        });
    });

    // Download TXT
    downloadBtn.addEventListener('click', () => {
        if (!generatedText) return;

        const blob = new Blob([generatedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const typeSlug = contentType.value.toLowerCase().replace(/\s+/g, '-');
        const filename = `${typeSlug}-ai-generated.txt`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Clear output
    clearBtn.addEventListener('click', () => {
        generatedText = '';
        outputContent.innerHTML = '<div class="placeholder-text">Your generated content will appear here...</div>';
        updateStats('');
        enableButtons(false);
    });
});

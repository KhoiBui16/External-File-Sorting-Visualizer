/**
 * =============================================================================
 * Module: App (Điểm khởi đầu ứng dụng)
 * =============================================================================
 * 
 * @description
 * Module chính điều phối toàn bộ ứng dụng minh họa sắp xếp ngoại.
 * Quản lý việc khởi tạo các module con và xử lý tương tác người dùng.
 * 
 * @flow
 * Quy trình hoạt động 3 bước:
 * 1. Cấu hình (Config): Người dùng chọn file, điều chỉnh tham số M và K.
 * 2. Minh họa (Visualization): Chạy và hiển thị từng bước của thuật toán.
 * 3. Kết quả (Result): Hiển thị dữ liệu đã sắp xếp và cho phép tải xuống.
 * 
 * @author CS523 - DSA Nâng Cao
 * @version 2.0.0
 */

class App {
    /**
     * Khởi tạo ứng dụng.
     * 
     * @constructor
     * @description
     * Thiết lập các thuộc tính ban đầu và đăng ký sự kiện DOMContentLoaded.
     */
    constructor() {
        // Các module con
        this.visualizer = null;       // Module hiển thị animation
        this.generator = null;        // Bộ sắp xếp (ExternalSort)
        this.educationGuide = null;   // Module hướng dẫn học tập
        
        // Trạng thái dữ liệu
        this.data = null;             // Dữ liệu đầu vào (Float64Array hoặc Array)
        this.memoryLimit = 4;         // Giới hạn RAM (M) - mặc định 4 phần tử
        this.kWay = 2;                // Số đường merge (K) - mặc định 2
        this.sortedData = null;       // Kết quả sắp xếp
        
        // Khởi tạo khi DOM sẵn sàng
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    /**
     * Khởi tạo ứng dụng sau khi DOM đã load xong.
     * 
     * @async
     * @returns {Promise<void>}
     * @description
     * - Lấy tham chiếu đến các phần tử DOM.
     * - Thiết lập event listeners.
     * - Khởi tạo các module phụ thuộc.
     */
    async init() {
        console.log('🚀 App đang khởi tạo...');
        
        // ====== LẤY THAM CHIẾU DOM - VIEW 1 (CONFIG) ======
        this.fileInput = document.getElementById('fileInput');
        this.ramInput = document.getElementById('ramInput');
        this.ramDisplay = document.getElementById('ramDisplay');
        this.kInput = document.getElementById('kInput');
        this.kDisplay = document.getElementById('kDisplay');
        
        // Các nút bấm
        this.btnStart = document.getElementById('btnStartSimulation');
        this.btnBackToConfig = document.getElementById('btnBackToConfig');
        this.btnReset = document.getElementById('btnReset');
        this.btnStep = document.getElementById('btnStep');
        this.btnNewSort = document.getElementById('btnNewSort');
        
        // Thống kê dự kiến
        this.estChunks = document.getElementById('estChunks');
        this.estPasses = document.getElementById('estPasses');
        
        // Xem trước dữ liệu
        this.previewTableBody = document.getElementById('previewBody');
        this.fileNameDisplay = document.getElementById('fileNameDisplay');
        this.previewContainer = document.getElementById('previewContainer');

        // Thiết lập sự kiện
        this._setupEventListeners();
        
        // Khởi tạo giá trị mặc định từ DOM
        if (this.ramInput) this.memoryLimit = parseInt(this.ramInput.value);
        if (this.kInput) this.kWay = parseInt(this.kInput.value);
        
        // Khởi tạo các module
        this.visualizer = new Visualizer();
        this.educationGuide = new EducationGuide();
        
        // Kiểm tra và khôi phục kết quả từ sessionStorage (nếu có)
        if (this._restoreResultFromStorage()) {
            console.log('📦 Đã khôi phục kết quả từ session trước');
            return; // Đã hiển thị Result View, không cần show Config
        }
        
        // Hiển thị view cấu hình
        viewManager.showConfig();
        
        console.log('✅ App đã khởi tạo xong!');
    }

    /**
     * Thiết lập tất cả event listeners cho ứng dụng.
     * 
     * @private
     * @returns {void}
     * @description
     * Đăng ký các sự kiện:
     * - Click các nút điều khiển
     * - Kéo thả file
     * - Thay đổi input cấu hình
     */
    _setupEventListeners() {
        // ====== NÚT HÀNH ĐỘNG ======
        if (this.btnStart) {
            this.btnStart.addEventListener('click', () => this.startSimulation());
        }
        
        // ====== NÚT ĐIỀU HƯỚNG ======
        if (this.btnBackToConfig) {
            this.btnBackToConfig.addEventListener('click', () => {
                this.reset();
                viewManager.showConfig();
            });
        }
        
        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => {
                this.visualizer.reset();
                this.startSimulation(); // Chạy lại từ đầu
            });
        }
        
        // NÚT STEP (từng bước một)
        if (this.btnStep) {
            this.btnStep.addEventListener('click', () => {
                if (this.visualizer) {
                    this.visualizer.stepOnce();
                }
            });
        }
        
        if (this.btnNewSort) {
            this.btnNewSort.addEventListener('click', () => {
                this.reset();
                viewManager.showConfig();
            });
        }

        // ====== TẢI XUỐNG KẾT QUẢ ======
        const btnDownloadBin = document.getElementById('btnDownloadBin');
        const btnDownloadTxt = document.getElementById('btnDownloadTxt');
        
        if (btnDownloadBin) {
            btnDownloadBin.addEventListener('click', () => this._downloadBinaryFile());
        }
        
        if (btnDownloadTxt) {
            btnDownloadTxt.addEventListener('click', () => this._downloadTextFile());
        }

        // ====== TẠO DỮ LIỆU NGẪU NHIÊN ======
        const btnGenRandom = document.getElementById('btnGenRandom');
        const randomCountInput = document.getElementById('randomCountInput');
        
        if (btnGenRandom && randomCountInput) {
            btnGenRandom.addEventListener('click', (e) => { 
                e.stopPropagation();
                let count = parseInt(randomCountInput.value) || 20;
                // Giới hạn từ 5 đến 1000
                count = Math.max(5, Math.min(1000, count));
                randomCountInput.value = count;
                this.generateData(count); 
            });
            
            // Cho phép Enter để tạo
            randomCountInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    btnGenRandom.click();
                }
            });
        }
        
        // ====== KÉO THẢ FILE ======
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('click', () => this.fileInput.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-primary');
            });
            
            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-primary');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-primary');
                if (e.dataTransfer.files.length) {
                    this._handleFileSelect({ target: { files: e.dataTransfer.files } });
                }
            });
        }

        // ====== CHỌN FILE ======
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
        }
        
        // ====== CẤU HÌNH RAM (M) ======
        if (this.ramInput) {
            this.ramInput.addEventListener('input', (e) => {
                this.memoryLimit = parseInt(e.target.value);
                if (this.ramDisplay) this.ramDisplay.textContent = this.memoryLimit;
                
                // Cập nhật label ở View 2
                const lblConfigM = document.getElementById('lblConfigM');
                if (lblConfigM) lblConfigM.textContent = this.memoryLimit;
                
                this._updateStats();
            });
        }
        
        // ====== CẤU HÌNH K-WAY ======
        if (this.kInput) {
            this.kInput.addEventListener('input', (e) => {
                this.kWay = parseInt(e.target.value);
                if (this.kDisplay) this.kDisplay.textContent = this.kWay;
                
                // Cập nhật label ở View 2
                const lblConfigK = document.getElementById('lblConfigK');
                if (lblConfigK) lblConfigK.textContent = this.kWay;
                
                this._updateStats();
            });
        }
    }
    
    /**
     * Tính toán và cập nhật thống kê dự kiến.
     * 
     * @private
     * @returns {void}
     * @description
     * Hiển thị số Run và số Pass dự kiến dựa trên:
     * - Kích thước dữ liệu (N)
     * - Giới hạn RAM (M)
     * - Số đường merge (K)
     * 
     * Công thức:
     * - Số Run = ceil(N / M)
     * - Số Pass = ceil(log_K(Số Run))
     */
    _updateStats() {
        if (!this.data) return;
        
        const totalItems = this.data.length;
        const numChunks = Math.ceil(totalItems / this.memoryLimit);
        
        // Tính số pass: ceil(log_K(numChunks))
        let passes = 0;
        if (numChunks > 1) {
            passes = Math.ceil(Math.log(numChunks) / Math.log(this.kWay));
        }
        
        if (this.estChunks) this.estChunks.textContent = numChunks;
        if (this.estPasses) this.estPasses.textContent = passes;
    }

    /**
     * Tạo dữ liệu ngẫu nhiên để test.
     * 
     * @async
     * @param {number} size - Số lượng phần tử cần tạo.
     * @returns {Promise<void>}
     * @description
     * Tạo mảng Float64Array chứa các số ngẫu nhiên trong khoảng [0, 1000).
     * Sau đó tự động load vào ứng dụng như thể người dùng đã upload file.
     */
    async generateData(size) {
        console.log(`📊 Đang tạo ${size} số ngẫu nhiên...`);
        
        const data = new Float64Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.random() * 1000;
        }
        this.data = data;
        
        // Tạo file giả để xử lý thống nhất
        const blob = new Blob([data.buffer], { type: 'application/octet-stream' });
        const file = new File([blob], `random_${size}.bin`);
        
        // Gọi handler như khi chọn file thật
        this._handleFileSelect({ target: { files: [file] } });
    }

    /**
     * Xử lý khi người dùng chọn file.
     * 
     * @private
     * @async
     * @param {Event} event - Sự kiện change từ input file hoặc drop.
     * @returns {Promise<void>}
     * @description
     * - Đọc file nhị phân.
     * - Chuyển đổi thành Float64Array (mỗi số 8 bytes).
     * - Cập nhật giao diện xem trước.
     */
    async _handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (this.fileNameDisplay) {
            this.fileNameDisplay.textContent = file.name;
        }
        
        try {
            const buffer = await FileHandler.readFileAsArrayBuffer(file);
            this.data = new Float64Array(buffer);
            
            console.log(`✅ Đã đọc file: ${file.name} (${this.data.length} phần tử)`);
            
            this._updateStats();
            this._updatePreview();
            
            // Hiển thị bảng xem trước
            if (this.previewContainer) {
                this.previewContainer.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('❌ Lỗi đọc file:', error);
            alert("Lỗi đọc file: " + error.message);
        }
    }
    
    /**
     * Cập nhật bảng xem trước dữ liệu.
     * 
     * @private
     * @returns {void}
     * @description
     * Hiển thị tối đa 100 phần tử đầu tiên của dữ liệu.
     * Nếu có nhiều hơn, hiển thị thông báo "còn X dòng nữa".
     */
    _updatePreview() {
        if (!this.data || !this.previewTableBody) return;
        
        this.previewTableBody.innerHTML = '';
        
        // Hiển thị tối đa 100 phần tử
        const limit = Math.min(this.data.length, 100);
        
        for (let i = 0; i < limit; i++) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100';
            tr.innerHTML = `
                <td class="px-6 py-3 text-slate-500 font-mono text-sm">${i}</td>
                <td class="px-6 py-3 text-blue-600 font-bold font-mono text-right text-sm">${this.data[i].toFixed(2)}</td>
            `;
            this.previewTableBody.appendChild(tr);
        }
        
        // Thông báo nếu còn dữ liệu chưa hiển thị
        if (this.data.length > 100) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="2" class="px-6 py-3 text-center text-slate-400 italic text-sm">
                    ... còn ${this.data.length - limit} dòng nữa ...
                </td>
            `;
            this.previewTableBody.appendChild(tr);
        }
    }

    /**
     * Bắt đầu chạy mô phỏng sắp xếp.
     * 
     * @async
     * @returns {Promise<void>}
     * @description
     * - Kiểm tra dữ liệu đã được chọn chưa.
     * - Chuyển sang view minh họa.
     * - Khởi tạo ExternalSort với cấu hình hiện tại.
     * - Chạy animation từng bước.
     */
    async startSimulation() {
        if (!this.data) {
            alert("Vui lòng chọn tệp dữ liệu trước!");
            return;
        }
        
        console.log(`🎬 Bắt đầu mô phỏng: M=${this.memoryLimit}, K=${this.kWay}`);
        
        // Enable navigation và chuyển sang view minh họa
        viewManager.enableVizNav();
        viewManager.showVisualization();
        
        // Cập nhật labels cấu hình trên View 2
        const lblConfigM = document.getElementById('lblConfigM');
        const lblConfigK = document.getElementById('lblConfigK');
        if (lblConfigM) lblConfigM.textContent = this.memoryLimit;
        if (lblConfigK) lblConfigK.textContent = this.kWay;
        
        // Khởi tạo bộ sắp xếp với cấu hình
        this.generator = new ExternalSort(this.data, {
            memoryLimit: this.memoryLimit,
            kWay: this.kWay
        });

        // Reset visualizer và guide
        this.visualizer.reset();
        this.educationGuide.reset();
        
        // Vẽ dữ liệu đầu vào
        this.visualizer.initInputData(this.data);

        // Chạy thuật toán
        await this._runSort();
    }
    
    /**
     * Vòng lặp chạy animation sắp xếp.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     * @description
     * Lặp qua từng bước của generator, gọi visualizer để vẽ
     * và cập nhật education guide.
     */
    async _runSort() {
        // Sử dụng generator sort() thay vì sortGenerator()
        for (const step of this.generator.sort()) {
            // Vẽ bước hiện tại
            await this.visualizer.processStep(step);
            
            // Lưu kết quả khi hoàn tất
            if (step.phase === 'complete') {
                this.sortedData = step.sortedData;
                console.log('✅ Sắp xếp hoàn tất!', step);
                
                // Lưu vào sessionStorage để giữ khi reload
                this._saveResultToStorage(step);
            }

            // Cập nhật hướng dẫn
            this.educationGuide.update(step);
        }
    }
    
    /**
     * Tải xuống kết quả dạng file nhị phân.
     * 
     * @private
     * @returns {void}
     */
    _downloadBinaryFile() {
        if (!this.sortedData || this.sortedData.length === 0) {
            alert('Chưa có dữ liệu để tải xuống!');
            return;
        }
        
        const blob = FileHandler.createBinaryFile(this.sortedData);
        FileHandler.downloadFile(blob, 'sorted_output.bin');
    }
    
    /**
     * Tải xuống kết quả dạng file text.
     * 
     * @private
     * @returns {void}
     */
    _downloadTextFile() {
        if (!this.sortedData || this.sortedData.length === 0) {
            alert('Chưa có dữ liệu để tải xuống!');
            return;
        }
        
        const blob = FileHandler.createTextFile(this.sortedData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sorted_output.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Reset ứng dụng về trạng thái ban đầu.
     * 
     * @returns {void}
     * @description
     * Xóa dữ liệu, reset giao diện, chuẩn bị cho lần sắp xếp mới.
     */
    reset() {
        this.data = null;
        this.sortedData = null;
        
        if (this.fileNameDisplay) {
            this.fileNameDisplay.textContent = "File nhị phân (8-byte doubles)";
        }
        if (this.previewContainer) {
            this.previewContainer.classList.add('hidden');
        }
        if (this.visualizer) {
            this.visualizer.reset();
        }
        
        // Xóa sessionStorage khi reset
        sessionStorage.removeItem('externalSortResult');
        
        console.log('🔄 App đã được reset');
    }
    
    /**
     * Lưu kết quả sắp xếp vào sessionStorage.
     * 
     * @private
     * @param {Object} step - Bước complete từ generator
     */
    _saveResultToStorage(step) {
        try {
            const resultData = {
                sortedData: Array.from(step.sortedData),
                totalSteps: step.totalSteps || 0,
                totalCompares: step.totalCompares || 0,
                ioCount: step.ioCount || 0,
                runs: step.runs ? step.runs.map(r => Array.from(r)) : [],
                memoryLimit: this.memoryLimit,
                kWay: this.kWay,
                timestamp: Date.now()
            };
            sessionStorage.setItem('externalSortResult', JSON.stringify(resultData));
            console.log('💾 Đã lưu kết quả vào sessionStorage');
        } catch (e) {
            console.warn('⚠️ Không thể lưu vào sessionStorage:', e);
        }
    }
    
    /**
     * Khôi phục kết quả từ sessionStorage.
     * 
     * @private
     * @returns {boolean} - True nếu khôi phục thành công
     */
    _restoreResultFromStorage() {
        try {
            const saved = sessionStorage.getItem('externalSortResult');
            if (!saved) return false;
            
            const resultData = JSON.parse(saved);
            
            // Kiểm tra timeout (30 phút)
            if (Date.now() - resultData.timestamp > 30 * 60 * 1000) {
                sessionStorage.removeItem('externalSortResult');
                return false;
            }
            
            // Khôi phục dữ liệu
            this.sortedData = new Float64Array(resultData.sortedData);
            this.memoryLimit = resultData.memoryLimit;
            this.kWay = resultData.kWay;
            
            // Tạo step giả để render kết quả
            const step = {
                phase: 'complete',
                sortedData: this.sortedData,
                totalSteps: resultData.totalSteps,
                totalCompares: resultData.totalCompares,
                ioCount: resultData.ioCount,
                runs: resultData.runs.map(r => new Float64Array(r)),
                memoryLimit: resultData.memoryLimit,
                kWay: resultData.kWay
            };
            
            // Hiển thị kết quả
            this.visualizer._renderComplete(step);
            viewManager.showResult();
            
            return true;
        } catch (e) {
            console.warn('⚠️ Không thể khôi phục từ sessionStorage:', e);
            sessionStorage.removeItem('externalSortResult');
            return false;
        }
    }
}

// Xuất instance global
window.App = new App();

/**
 * =============================================================================
 * Module: Visualizer (Hiển thị trực quan)
 * =============================================================================
 * 
 * @description
 * Module quản lý việc hiển thị và tạo hiệu ứng animation cho quá trình
 * sắp xếp ngoại. Hỗ trợ 2 giai đoạn:
 * - Giai đoạn 1: Tạo Run (Input → RAM → Disk)
 * - Giai đoạn 2: Merge (Runs → Min Heap → Output)
 * 
 * @author CS523 - DSA Nâng Cao
 * @version 3.0.0 - Enhanced với Inspector, Statistics, Legend
 */

class Visualizer {
    /**
     * Khởi tạo Visualizer.
     * 
     * @constructor
     * @description
     * Lấy tham chiếu đến các container DOM và thiết lập điều khiển.
     */
    constructor() {
        // ====== PHASE 1: RUN GENERATION ======
        this.inputStreamContainer = document.getElementById('viz-input-stream');
        this.ramBufferContainer = document.getElementById('viz-ram-buffer');
        this.diskRunsContainer = document.getElementById('viz-disk-runs');
        
        // ====== PHASE 2: MERGE ======
        this.mergeLanesContainer = document.getElementById('viz-merge-lanes');
        this.minHeapContainer = document.getElementById('viz-min-heap-tree'); // Updated to tree container
        this.finalOutputContainer = document.getElementById('viz-final-output');
        
        // ====== ĐIỀU KHIỂN & TRẠNG THÁI ======
        this.stepCountLabel = document.getElementById('lblStepCount');
        this.vizStatusText = document.getElementById('vizStatusText');
        this.vizPhaseTitle = document.getElementById('vizPhaseTitle');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedPercent = document.getElementById('speedPercent');
        
        // Nút điều khiển
        this.btnPlay = document.getElementById('btnPlay');
        this.btnPause = document.getElementById('btnPause');
        this.btnStep = document.getElementById('btnStep');
        
        // ====== HƯỚNG DẪN ======
        this.eduStepTitle = document.getElementById('eduStepTitle');
        this.eduStepDesc = document.getElementById('eduStepDesc');
        this.eduActionDetails = document.getElementById('eduActionDetails');
        
        // ====== MỚI: INSPECTOR & STATISTICS ======
        this.inspectorContent = document.getElementById('inspectorContent');
        this.statCompares = document.getElementById('statCompares');
        this.statReads = document.getElementById('statReads');
        this.statWrites = document.getElementById('statWrites');
        this.statRuns = document.getElementById('statRuns');
        
        // ====== MỚI: PHASE 1 DETAILS ======
        this.inputRemaining = document.getElementById('inputRemaining');
        this.ramStatus = document.getElementById('ramStatus');
        this.runsCount = document.getElementById('runsCount');
        this.currentCompareBox = document.getElementById('currentCompareBox');
        this.compareDetail = document.getElementById('compareDetail');
        
        // ====== MỚI: PHASE 2 DETAILS ======
        this.mergeInputInfo = document.getElementById('mergeInputInfo');
        this.outputCount = document.getElementById('outputCount');
        this.minValueIndicator = document.getElementById('minValueIndicator');
        this.minValueDisplay = document.getElementById('minValueDisplay');
        this.mergeCompareExplain = document.getElementById('mergeCompareExplain');

        // ====== TRẠNG THÁI NỘI BỘ ======
        this.delay = 200;       // Độ trễ giữa các bước (ms) - mặc định nhanh
        this.isPaused = false;  // Trạng thái tạm dừng
        this.stepOnceFlag = false; // Flag để step từng bước
        this.stepCount = 0;     // Đếm số bước
        
        // Statistics tracking
        this.stats = {
            compares: 0,
            reads: 0,
            writes: 0,
            runs: 0,
            outputItems: 0
        };
        
        this._setupControls();
    }
    
    /**
     * Thiết lập các điều khiển (speed slider, play/pause).
     * 
     * @private
     * @returns {void}
     */
    _setupControls() {
        // Slider tốc độ
        if (this.speedSlider) {
            this.speedSlider.addEventListener('input', (e) => {
                // Logic đảo ngược: Giá trị cao = Delay thấp (Nhanh)
                // Slider: 100 (chậm nhất) -> 2000 (nhanh nhất)
                // Delay:  2000ms (chậm)   -> 10ms (nhanh)
                const val = parseInt(e.target.value);
                this.delay = Math.max(10, 2010 - val);
                
                // Cập nhật % hiển thị
                const percent = Math.round((val - 100) / 1900 * 100);
                if (this.speedPercent) this.speedPercent.textContent = `${percent}%`;
            });
            // Khởi tạo delay ban đầu
            const initVal = parseInt(this.speedSlider.value);
            this.delay = Math.max(10, 2010 - initVal);
            const initPercent = Math.round((initVal - 100) / 1900 * 100);
            if (this.speedPercent) this.speedPercent.textContent = `${initPercent}%`;
        }

        // Nút Play
        if (this.btnPlay) {
            this.btnPlay.addEventListener('click', () => {
                this.isPaused = false;
                this._togglePlayPause(true);
            });
        }
        
        // Nút Pause
        if (this.btnPause) {
            this.btnPause.addEventListener('click', () => {
                this.isPaused = true;
                this._togglePlayPause(false);
            });
        }
    }
    
    /**
     * Step từng bước một (cho nút Step).
     * 
     * @returns {void}
     */
    stepOnce() {
        this.stepOnceFlag = true;
        this.isPaused = false;
    }
    
    /**
     * Chuyển đổi hiển thị nút Play/Pause.
     * 
     * @private
     * @param {boolean} isPlaying - True nếu đang chạy.
     * @returns {void}
     */
    _togglePlayPause(isPlaying) {
        if (isPlaying) {
            this.btnPlay?.classList.add('hidden');
            this.btnPause?.classList.remove('hidden');
            if (this.vizStatusText) this.vizStatusText.textContent = "Đang chạy...";
        } else {
            this.btnPlay?.classList.remove('hidden');
            this.btnPause?.classList.add('hidden');
            if (this.vizStatusText) this.vizStatusText.textContent = "Tạm dừng";
        }
    }

    /**
     * Reset visualizer về trạng thái ban đầu.
     * 
     * @returns {void}
     * @description
     * Xóa tất cả nội dung đã vẽ, reset bộ đếm, hiển thị Phase 1.
     */
    reset() {
        this.stepCount = 0;
        this.isPaused = false;
        
        // Reset statistics
        this.stats = {
            compares: 0,
            reads: 0,
            writes: 0,
            runs: 0,
            outputItems: 0
        };
        this._updateStatistics();
        
        if (this.stepCountLabel) this.stepCountLabel.textContent = '0';
        
        // Xóa nội dung các container
        this._clearContainer(this.inputStreamContainer);
        this._clearContainer(this.ramBufferContainer);
        this._clearContainer(this.diskRunsContainer);
        this._clearContainer(this.mergeLanesContainer);
        this._clearContainer(this.minHeapContainer);
        this._clearContainer(this.finalOutputContainer);
        
        // Reset Inspector
        if (this.inspectorContent) {
            this.inspectorContent.innerHTML = '<span class="text-slate-500">Chưa có thao tác nào</span>';
        }
        
        // Reset Phase 1 details
        if (this.inputRemaining) this.inputRemaining.textContent = '0';
        if (this.ramStatus) this.ramStatus.textContent = 'READY';
        if (this.runsCount) this.runsCount.textContent = '0 runs';
        if (this.currentCompareBox) this.currentCompareBox.classList.add('hidden');
        
        // Reset Phase 2 details
        if (this.outputCount) this.outputCount.textContent = '0';
        if (this.minValueIndicator) this.minValueIndicator.classList.add('hidden');
        
        // Hiển thị Phase 1, ẩn Phase 2
        const phase1 = document.getElementById('viz-phase-1');
        const phase2 = document.getElementById('viz-phase-2');
        if (phase1) phase1.classList.remove('hidden');
        if (phase2) phase2.classList.add('hidden');
        
        if (this.vizPhaseTitle) {
            this.vizPhaseTitle.textContent = "Giai đoạn 1: Tạo Run";
        }
        
        this._updateEdu("Khởi tạo", "Sẵn sàng chạy mô phỏng.", "");
        this._togglePlayPause(true);
    }
    
    /**
     * Cập nhật panel Statistics realtime.
     * 
     * @private
     * @returns {void}
     */
    _updateStatistics() {
        if (this.statCompares) this.statCompares.textContent = this.stats.compares;
        if (this.statReads) this.statReads.textContent = this.stats.reads;
        if (this.statWrites) this.statWrites.textContent = this.stats.writes;
        if (this.statRuns) this.statRuns.textContent = this.stats.runs;
    }
    
    /**
     * Cập nhật Inspector panel với thông tin chi tiết.
     * 
     * @private
     * @param {Object} stepData - Dữ liệu bước hiện tại.
     * @returns {void}
     */
    _updateInspector(stepData) {
        if (!this.inspectorContent) return;
        
        const phase = stepData.phase || 'unknown';
        const step = stepData.step || 'unknown';
        
        let html = '';
        
        // Phase badge - Enhanced for light theme
        const phaseBadge = phase.includes('merge') 
            ? '<span class="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">🔀 MERGE PHASE</span>'
            : '<span class="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">📝 RUN GENERATION</span>';
        
        // Step badge
        const stepBadge = `<span class="bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-mono font-bold">${step}</span>`;
        
        html += `<div class="flex items-center gap-2 mb-3">${phaseBadge} ${stepBadge}</div>`;
        
        // Chi tiết theo loại step
        switch (step) {
            case 'read_chunk':
                html += `
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-slate-50 rounded-lg p-2"><span class="text-slate-500">Vị trí đọc:</span> <span class="text-blue-600 font-bold">${stepData.position || 0}</span></div>
                        <div class="bg-slate-50 rounded-lg p-2"><span class="text-slate-500">Số phần tử:</span> <span class="text-blue-600 font-bold">${stepData.chunkSize || 0}</span></div>
                    </div>
                    <div class="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-xs">
                        <span class="text-blue-600 font-bold">📥 Đọc:</span> 
                        <span class="text-slate-700 font-mono font-bold">[${(stepData.chunk || []).slice(0, 5).map(v => v.toFixed(1)).join(', ')}${(stepData.chunk?.length || 0) > 5 ? '...' : ''}]</span>
                    </div>`;
                break;
                
            case 'sorting_compare':
                const comparing = stepData.comparing || [];
                const key = stepData.key;
                const arr = stepData.array || [];
                html += `
                    <div class="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl text-xs">
                        <div class="text-amber-700 font-bold mb-2">🔍 SO SÁNH (Insertion Sort)</div>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${comparing.length >= 2 ? `
                                <span class="bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-3 py-1.5 rounded-lg font-mono font-bold shadow-md">${arr[comparing[0]]?.toFixed(2) || '?'}</span>
                                <span class="text-slate-500 font-bold">vs</span>
                                <span class="bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-3 py-1.5 rounded-lg font-mono font-bold shadow-md">${key?.toFixed(2) || '?'}</span>
                            ` : `<span class="text-slate-600">Xét phần tử key = <strong class="text-amber-600">${key?.toFixed(2) || '?'}</strong></span>`}
                        </div>
                        ${arr[comparing[0]] > key ? `<div class="mt-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">↪ ${arr[comparing[0]]?.toFixed(2)} > ${key?.toFixed(2)} → <strong>Dịch phải</strong></div>` : ''}
                    </div>`;
                break;
                
            case 'sorting_complete':
                html += `
                    <div class="p-3 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl text-xs">
                        <div class="text-emerald-700 font-bold mb-2">✅ SẮP XẾP XONG</div>
                        <div class="text-slate-700 font-mono font-bold bg-white rounded-lg p-2 border border-emerald-200">[${(stepData.sortedArray || []).map(v => v.toFixed(1)).join(', ')}]</div>
                    </div>`;
                break;
                
            case 'write_run':
                html += `
                    <div class="p-3 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl text-xs">
                        <div class="text-emerald-700 font-bold mb-2">💾 GHI RUN #${(stepData.runIndex || 0) + 1}</div>
                        <div class="text-slate-700 font-mono text-[10px] bg-white rounded-lg p-2 border border-emerald-200">[${(stepData.run || []).map(v => v.toFixed(1)).join(', ')}]</div>
                    </div>`;
                break;
                
            case 'merge_compare':
                const comparingItems = stepData.comparing || [];
                html += `
                    <div class="p-3 bg-gradient-to-r from-cyan-50 to-sky-50 border-2 border-cyan-300 rounded-xl text-xs">
                        <div class="text-cyan-700 font-bold mb-2">🔄 SO SÁNH K-WAY MERGE</div>
                        <div class="flex flex-wrap gap-2">
                            ${comparingItems.map(item => `
                                <div class="flex flex-col items-center bg-white border border-cyan-200 p-2 rounded-lg shadow-sm">
                                    <span class="text-[10px] text-slate-500 font-medium">Run ${item.runIndex + 1}</span>
                                    <span class="text-lg font-bold text-cyan-600">${item.value.toFixed(1)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2 text-purple-700 font-bold">
                            → Min = <strong class="text-purple-600">${Math.min(...comparingItems.map(i => i.value)).toFixed(2)}</strong>
                        </div>
                    </div>`;
                break;
                
            case 'merge_select':
                html += `
                    <div class="p-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-2 border-purple-300 rounded-xl text-xs">
                        <div class="text-purple-700 font-bold mb-2">📤 CHỌN MIN & GHI OUTPUT</div>
                        <div class="text-slate-700">
                            Giá trị: <span class="text-xl font-bold text-purple-600 bg-white px-2 py-1 rounded-lg border border-purple-200">${stepData.selectedValue?.toFixed(2) || '?'}</span>
                            <span class="text-slate-500 ml-2">(từ Run ${(stepData.selectedRunIndex || 0) + 1})</span>
                        </div>
                    </div>`;
                break;
                
            default:
                html += `<div class="text-slate-600 text-xs bg-slate-50 rounded-lg p-2">${stepData.message || 'Đang xử lý...'}</div>`;
        }
        
        this.inspectorContent.innerHTML = html;
        
        // Sync với Right Inspector (nếu có)
        const rightInspectorContent = document.getElementById('rightInspectorContent');
        if (rightInspectorContent) {
            rightInspectorContent.innerHTML = html;
        }
    }
    
    /**
     * Xóa nội dung của một container.
     * 
     * @private
     * @param {HTMLElement|null} el - Phần tử cần xóa nội dung.
     * @returns {void}
     */
    _clearContainer(el) {
        if (el) el.innerHTML = '';
    }

    /**
     * Khởi tạo hiển thị dữ liệu đầu vào (Input Stream).
     * 
     * @param {Float64Array|Array<number>} data - Dữ liệu cần hiển thị.
     * @returns {void}
     * @description
     * Vẽ các block đại diện cho dữ liệu đầu vào.
     * Giới hạn hiển thị 25 block để tránh lag.
     */
    initInputData(data) {
        if (!this.inputStreamContainer) return;
        
        this.inputStreamContainer.innerHTML = '';
        const limit = Math.min(data.length, 25);
        
        // Cập nhật số lượng còn lại
        if (this.inputRemaining) {
            this.inputRemaining.textContent = data.length;
        }
        
        for (let i = 0; i < limit; i++) {
            const block = document.createElement('div');
            block.className = 'w-full h-9 bg-white hover:bg-blue-50 rounded-lg text-sm flex items-center justify-between px-3 font-mono transition-all border-2 border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300';
            block.innerHTML = `
                <span class="text-slate-500 font-bold">[${i}]</span>
                <span class="text-slate-800 font-bold">${data[i].toFixed(1)}</span>
            `;
            block.dataset.index = i;
            this.inputStreamContainer.appendChild(block);
        }
        
        // Thêm indicator nếu có nhiều hơn limit
        if (data.length > limit) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'w-full h-8 bg-gradient-to-r from-slate-100 to-blue-100 rounded-lg text-xs flex items-center justify-center text-slate-600 font-bold border border-slate-200';
            moreIndicator.textContent = `... và ${data.length - limit} phần tử nữa`;
            this.inputStreamContainer.appendChild(moreIndicator);
        }
    }

    /**
     * Xử lý và hiển thị một bước của thuật toán.
     * 
     * @async
     * @param {Object} stepData - Dữ liệu của bước hiện tại từ generator.
     * @param {string} stepData.phase - Giai đoạn ('run_generation', 'merge_pass', 'complete').
     * @param {string} stepData.step - Bước cụ thể.
     * @param {string} stepData.message - Mô tả hành động.
     * @returns {Promise<void>}
     * @description
     * Đây là hàm chính để visualize. Nó:
     * 1. Đợi nếu đang tạm dừng.
     * 2. Tăng bộ đếm bước.
     * 3. Cập nhật panel hướng dẫn.
     * 4. Cập nhật Inspector panel.
     * 5. Cập nhật Statistics.
     * 6. Gọi renderer phù hợp với phase.
     * 7. Đợi delay để tạo hiệu ứng animation.
     */
    async processStep(stepData) {
        // Đợi nếu đang tạm dừng (ngoại trừ khi step-by-step)
        while (this.isPaused && !this.stepOnceFlag) {
            await new Promise(r => setTimeout(r, 100));
        }
        
        // Nếu đang step-by-step, pause ngay sau khi xử lý bước này
        const shouldPauseAfter = this.stepOnceFlag;
        this.stepOnceFlag = false;

        // Cập nhật bộ đếm
        this.stepCount++;
        if (this.stepCountLabel) {
            this.stepCountLabel.textContent = this.stepCount;
        }
        
        // Cập nhật statistics dựa trên step type
        this._trackStatistics(stepData);
        
        // Cập nhật hướng dẫn với mô tả chi tiết hơn
        const detailedMessage = this._getDetailedMessage(stepData);
        this._updateEdu(stepData.step || "Đang xử lý", detailedMessage, this._getActionChips(stepData));
        
        // Cập nhật Inspector panel
        this._updateInspector(stepData);

        // Router theo phase
        switch (stepData.phase) {
            case 'run_generation':
            case 'run_generation_start':
            case 'run_generation_complete':
                this._renderPhase1(stepData);
                break;
                
            case 'merge_start':
            case 'merge_pass_start':
            case 'merge_pass':
            case 'merge_pass_complete':
            case 'merge_complete':
                this._renderPhase2(stepData);
                break;
                
            case 'complete':
                this._renderComplete(stepData);
                break;
        }

        // Đợi delay
        await new Promise(r => setTimeout(r, this.delay));
        
        // Nếu đang step-by-step, pause sau khi hoàn thành bước này
        if (shouldPauseAfter) {
            this.isPaused = true;
            this._togglePlayPause(false);
        }
    }
    
    /**
     * Theo dõi và cập nhật thống kê.
     * 
     * @private
     * @param {Object} stepData - Dữ liệu bước.
     * @returns {void}
     */
    _trackStatistics(stepData) {
        switch (stepData.step) {
            case 'read_chunk':
                this.stats.reads++;
                break;
            case 'sorting_compare':
                this.stats.compares++;
                break;
            case 'write_run':
                this.stats.writes++;
                this.stats.runs++;
                break;
            case 'merge_compare':
                this.stats.compares++;
                break;
            case 'merge_select':
                this.stats.outputItems++;
                break;
        }
        this._updateStatistics();
    }
    
    /**
     * Tạo message chi tiết hơn cho mỗi step.
     * 
     * @private
     * @param {Object} stepData - Dữ liệu bước.
     * @returns {string} Message chi tiết.
     */
    _getDetailedMessage(stepData) {
        const step = stepData.step;
        const message = stepData.message || '';
        
        switch (step) {
            case 'read_chunk':
                return `📥 Đọc ${stepData.chunkSize || 0} phần tử từ vị trí ${stepData.position || 0} vào RAM. Đây là chunk thứ ${(stepData.runIndex || 0) + 1}.`;
                
            case 'sort_chunk':
                return `🔄 Bắt đầu sắp xếp ${(stepData.currentChunk || []).length} phần tử trong RAM bằng Insertion Sort.`;
                
            case 'sorting_compare':
                const key = stepData.key;
                const comparing = stepData.comparing || [];
                const arr = stepData.array || [];
                if (comparing.length >= 2) {
                    const leftVal = arr[comparing[0]];
                    return `🔍 So sánh: ${leftVal?.toFixed(2)} ${leftVal > key ? '>' : '≤'} ${key?.toFixed(2)} (key)${leftVal > key ? ' → Dịch phải' : ' → Chèn tại đây'}`;
                }
                return `🔍 Xét phần tử tại vị trí ${comparing[0] || 0}, key = ${key?.toFixed(2)}`;
                
            case 'sorting_complete':
                return `✅ Sắp xếp xong chunk trong RAM! Kết quả: [${(stepData.sortedArray || []).map(v => v.toFixed(1)).join(', ')}]`;
                
            case 'write_run':
                return `💾 Ghi Run #${(stepData.runIndex || 0) + 1} ra đĩa (${(stepData.run || []).length} phần tử đã sắp xếp)`;
                
            case 'merge_compare':
                const items = stepData.comparing || [];
                const minVal = Math.min(...items.map(i => i.value));
                return `🔄 So sánh đầu các Run: ${items.map(i => `Run${i.runIndex+1}=${i.value.toFixed(1)}`).join(', ')} → Min = ${minVal.toFixed(2)}`;
                
            case 'merge_select':
                return `📤 Chọn Min = ${stepData.selectedValue?.toFixed(2)} từ Run ${(stepData.selectedRunIndex || 0) + 1}, ghi vào Output`;
                
            case 'init':
            case 'pass_init':
                return `🚀 Khởi tạo K-Way Merge với ${(stepData.runs || []).length} runs`;
                
            default:
                return message;
        }
    }
    
    /**
     * Tạo action chips HTML cho comparison display.
     * 
     * @private
     * @param {Object} stepData - Dữ liệu bước.
     * @returns {string} HTML của action chips.
     */
    _getActionChips(stepData) {
        const step = stepData.step;
        
        switch (step) {
            case 'sorting_compare':
                const comparing = stepData.comparing || [];
                const arr = stepData.array || [];
                const key = stepData.key;
                if (comparing.length >= 2) {
                    return `
                        <span class="px-3 py-1.5 rounded-lg bg-yellow-100 border-2 border-yellow-400 text-yellow-700 text-sm font-mono font-bold shadow-sm">
                            arr[${comparing[0]}] = ${arr[comparing[0]]?.toFixed(2)}
                        </span>
                        <span class="text-slate-400 font-bold">vs</span>
                        <span class="px-3 py-1.5 rounded-lg bg-blue-100 border-2 border-blue-400 text-blue-700 text-sm font-mono font-bold shadow-sm">
                            key = ${key?.toFixed(2)}
                        </span>
                        ${arr[comparing[0]] > key ? '<span class="px-2 py-1 rounded bg-red-100 border border-red-300 text-red-600 text-xs font-bold">→ SHIFT</span>' : ''}
                    `;
                }
                return '';
                
            case 'merge_compare':
                const items = stepData.comparing || [];
                const minVal = Math.min(...items.map(i => i.value));
                return items.map(item => `
                    <span class="px-3 py-1.5 rounded-lg ${item.value === minVal ? 'bg-purple-100 border-2 border-purple-400 ring-2 ring-purple-300' : 'bg-slate-100 border-2 border-slate-300'} text-sm font-mono font-bold ${item.value === minVal ? 'text-purple-700' : 'text-slate-600'} shadow-sm">
                        Run ${item.runIndex + 1}: ${item.value.toFixed(2)} ${item.value === minVal ? '✓ MIN' : ''}
                    </span>
                `).join('');
                
            default:
                return '';
        }
    }
    
    /**
     * Cập nhật panel hướng dẫn học tập.
     * 
     * @private
     * @param {string} title - Tiêu đề bước.
     * @param {string} desc - Mô tả chi tiết.
     * @param {string} detailHtml - HTML bổ sung (chips so sánh).
     * @returns {void}
     */
    _updateEdu(title, desc, detailHtml) {
        if (this.eduStepTitle) this.eduStepTitle.textContent = title;
        if (this.eduStepDesc) this.eduStepDesc.textContent = desc;
        if (this.eduActionDetails) this.eduActionDetails.innerHTML = detailHtml;
    }

    // ==================== PHASE 1: RUN GENERATION ====================

    /**
     * Render các bước của Giai đoạn 1 (Tạo Run).
     * 
     * @private
     * @param {Object} step - Dữ liệu bước từ generator.
     * @returns {void}
     */
    _renderPhase1(step) {
        // Đảm bảo Phase 1 visible
        const p1 = document.getElementById('viz-phase-1');
        const p2 = document.getElementById('viz-phase-2');
        
        if (p1?.classList.contains('hidden')) {
            p1.classList.remove('hidden');
            p2?.classList.add('hidden');
            if (this.vizPhaseTitle) {
                this.vizPhaseTitle.textContent = "Giai đoạn 1: Tạo Run";
            }
        }

        // Xử lý theo step
        switch (step.step) {
            case 'read_chunk':
                if (this.ramStatus) this.ramStatus.textContent = 'Đang đọc...';
                this._renderRAMBuffer(step.currentChunk || step.chunk, false);
                this._animateInputRead(step.chunkIndex, step.chunkSize || (step.chunk?.length || 0));
                // Ẩn compare box khi đọc mới
                if (this.currentCompareBox) this.currentCompareBox.classList.add('hidden');
                break;
                
            case 'sort_chunk':
                if (this.ramStatus) this.ramStatus.textContent = 'Đang sắp xếp...';
                this._renderRAMBuffer(step.currentChunk || step.array, false, step.comparing);
                break;
                
            case 'sorting_compare':
            case 'sorting_insert':
                if (this.ramStatus) {
                    this.ramStatus.innerHTML = '<span class="animate-pulse">🔍 So sánh</span>';
                }
                this._renderRAMBuffer(step.currentChunk || step.array, false, step.comparing);
                // Hiển thị chi tiết so sánh
                this._showComparisonDetail(step);
                break;
                
            case 'sorting_complete':
                if (this.ramStatus) this.ramStatus.textContent = '✅ Đã sắp xếp';
                this._renderRAMBuffer(step.currentChunk || step.sortedArray, true);
                if (this.currentCompareBox) this.currentCompareBox.classList.add('hidden');
                break;
                
            case 'write_run':
                if (this.ramStatus) this.ramStatus.textContent = 'Chờ dữ liệu';
                this._renderDiskRun(step.runIndex, step.date || step.run);
                this._clearContainer(this.ramBufferContainer);
                // Cập nhật run count
                if (this.runsCount) this.runsCount.textContent = `${(step.runIndex || 0) + 1} runs`;
                break;
        }
    }
    
    /**
     * Hiển thị chi tiết so sánh trong Phase 1.
     * 
     * @private
     * @param {Object} step - Dữ liệu bước.
     * @returns {void}
     */
    _showComparisonDetail(step) {
        if (!this.currentCompareBox || !this.compareDetail) return;
        
        const comparing = step.comparing || [];
        const arr = step.array || step.currentChunk || [];
        const key = step.key;
        
        if (comparing.length >= 2 && key !== undefined) {
            const leftVal = arr[comparing[0]];
            const comparison = leftVal > key ? '>' : '≤';
            const result = leftVal > key ? '→ Dịch phải' : '→ Chèn';
            
            this.compareDetail.innerHTML = `
                <span class="text-yellow-400 font-bold">${leftVal?.toFixed(2)}</span>
                <span class="text-slate-400 mx-2">${comparison}</span>
                <span class="text-blue-400 font-bold">${key?.toFixed(2)}</span>
                <span class="ml-3 ${leftVal > key ? 'text-red-400' : 'text-green-400'}">${result}</span>
            `;
            this.currentCompareBox.classList.remove('hidden');
        }
    }
    
    /**
     * Render RAM Buffer với các thanh bar chart.
     * 
     * @private
     * @param {Array<number>} data - Dữ liệu trong RAM.
     * @param {boolean} [isSorted=false] - True nếu đã sắp xếp xong.
     * @param {Array<number>} [comparing=[]] - Các index đang được so sánh.
     * @returns {void}
     */
    _renderRAMBuffer(data, isSorted = false, comparing = []) {
        if (!this.ramBufferContainer || !data) return;
        
        this.ramBufferContainer.innerHTML = '';
        const maxVal = Math.max(...data);
        const minVal = Math.min(...data);
        
        // Cập nhật thông tin chart
        const chartInfo = document.getElementById('ramChartInfo');
        const maxValueLabel = document.getElementById('ramMaxValue');
        if (chartInfo) chartInfo.textContent = `Insertion Sort - ${data.length} elements`;
        if (maxValueLabel) maxValueLabel.textContent = `Max: ${maxVal.toFixed(0)}`;
        
        // Container cho chart với label trên đầu
        const chartContainer = document.createElement('div');
        chartContainer.className = 'w-full h-full flex items-end justify-center gap-1 px-2';
        
        data.forEach((val, idx) => {
            // Bar wrapper - bao gồm value label trên đầu + bar + index
            const barWrapper = document.createElement('div');
            barWrapper.className = 'flex flex-col items-center justify-end h-full relative';
            barWrapper.style.flex = '1';
            barWrapper.style.maxWidth = '60px';
            barWrapper.style.minWidth = '40px';
            
            const isComparing = comparing && comparing.includes(idx);
            
            // Tính chiều cao - scale từ 15% đến 85% container
            const normalizedHeight = ((val - minVal) / (maxVal - minVal || 1)) * 70 + 15;
            
            // Bar chính
            const bar = document.createElement('div');
            
            // Màu sắc dựa trên trạng thái
            let bgColor = 'bg-slate-400'; // Mặc định màu xám như Bubble Sort
            let textColor = 'text-slate-700';
            let extraStyles = '';
            
            if (isSorted) {
                bgColor = 'bg-gradient-to-t from-emerald-500 to-emerald-400';
                textColor = 'text-emerald-600';
                extraStyles = 'shadow-md';
            } else if (isComparing) {
                bgColor = 'bg-gradient-to-t from-orange-500 to-yellow-400';
                textColor = 'text-orange-600';
                extraStyles = 'ring-2 ring-orange-300 shadow-lg animate-pulse';
            }
            
            bar.className = `w-full rounded-t-md transition-all duration-300 relative ${bgColor} ${extraStyles}`;
            bar.style.height = `${normalizedHeight}%`;
            bar.style.minHeight = '25px';
            
            // Value label - BÊN TRONG THANH, trên cùng
            const valueLabel = document.createElement('div');
            valueLabel.className = `absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold font-mono whitespace-nowrap ${textColor}`;
            valueLabel.textContent = val.toFixed(0);
            bar.appendChild(valueLabel);
            
            // Index label - DƯỚI THANH
            const indexLabel = document.createElement('div');
            indexLabel.className = `text-xs font-bold mt-1 ${isComparing ? 'text-orange-600' : 'text-slate-500'}`;
            indexLabel.textContent = idx;
            
            bar.title = `Giá trị: ${val.toFixed(2)}\nIndex: ${idx}`;
            
            barWrapper.appendChild(bar);
            barWrapper.appendChild(indexLabel);
            
            chartContainer.appendChild(barWrapper);
        });
        
        this.ramBufferContainer.appendChild(chartContainer);
    }
    
    /**
     * Animation đọc dữ liệu từ Input Stream.
     * 
     * @private
     * @param {number} chunkIndex - Chỉ số chunk.
     * @param {number} chunkSize - Số phần tử đọc.
     * @returns {void}
     */
    _animateInputRead(chunkIndex, chunkSize) {
        if (!this.inputStreamContainer) return;
        
        for (let i = 0; i < chunkSize; i++) {
            if (this.inputStreamContainer.firstChild) {
                this.inputStreamContainer.removeChild(this.inputStreamContainer.firstChild);
            }
        }
    }
    
    /**
     * Render một Run đã được ghi ra đĩa.
     * 
     * @private
     * @param {number} runIndex - Chỉ số Run.
     * @param {Array<number>} data - Dữ liệu của Run.
     * @returns {void}
     */
    _renderDiskRun(runIndex, data) {
        if (!this.diskRunsContainer) return;
        
        // Color palette cho các run - Enhanced for light theme
        const colorConfigs = [
            { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', codeBg: 'bg-white border-emerald-200' },
            { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', codeBg: 'bg-white border-blue-200' },
            { bg: 'from-purple-50 to-fuchsia-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', codeBg: 'bg-white border-purple-200' },
            { bg: 'from-orange-50 to-amber-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', codeBg: 'bg-white border-orange-200' },
            { bg: 'from-pink-50 to-rose-50', border: 'border-pink-300', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700', codeBg: 'bg-white border-pink-200' }
        ];
        const config = colorConfigs[runIndex % colorConfigs.length];
        
        const runBlock = document.createElement('div');
        runBlock.className = `w-full p-3 bg-gradient-to-r ${config.bg} border-2 ${config.border} rounded-xl animate-fade-in shadow-sm`;
        
        // Hiển thị chi tiết data của run
        const dataPreview = data ? data.slice(0, 4).map(v => v.toFixed(1)).join(', ') + (data.length > 4 ? '...' : '') : '';
        
        runBlock.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-bold ${config.text} text-base">📁 Run ${runIndex + 1}</span>
                <span class="${config.badge} px-2.5 py-1 rounded-full text-xs font-bold">${data ? data.length : '?'} phần tử</span>
            </div>
            <div class="text-xs text-slate-700 font-mono ${config.codeBg} p-2.5 rounded-lg border overflow-hidden font-bold">
                [${dataPreview}]
            </div>
        `;
        this.diskRunsContainer.appendChild(runBlock);
        
        // Auto scroll
        this.diskRunsContainer.scrollTop = this.diskRunsContainer.scrollHeight;
    }

    // ==================== PHASE 2: MERGE ====================

    /**
     * Render các bước của Giai đoạn 2 (Merge).
     * 
     * @private
     * @param {Object} step - Dữ liệu bước từ generator.
     * @returns {void}
     */
    _renderPhase2(step) {
        // Đảm bảo Phase 2 visible
        const p1 = document.getElementById('viz-phase-1');
        const p2 = document.getElementById('viz-phase-2');
        
        if (p2?.classList.contains('hidden')) {
            p1?.classList.add('hidden');
            p2.classList.remove('hidden');
            if (this.vizPhaseTitle) {
                this.vizPhaseTitle.textContent = "Giai đoạn 2: Trộn K-Run";
            }
        }
        
        // Xử lý theo step
        switch (step.step) {
            case 'init':
            case 'pass_init':
                if (step.runs) {
                    this._initMergeLanes(step.runs);
                    if (this.mergeInputInfo) {
                        this.mergeInputInfo.textContent = `${step.runs.length} runs`;
                    }
                }
                break;
                
            case 'merge_start':
                if (step.runs) {
                    this._initMergeLanes(step.runs);
                    if (this.mergeInputInfo) {
                        this.mergeInputInfo.textContent = `${step.runs.length} runs`;
                    }
                }
                break;
                
            case 'merge_compare':
                this._renderMinHeap(step.comparing);
                // Hiển thị chi tiết so sánh
                if (step.comparing && step.comparing.length > 0) {
                    this._highlightComparingRuns(step.comparing);
                    // Hiển thị min value
                    const minVal = Math.min(...step.comparing.map(i => i.value));
                    if (this.minValueIndicator && this.minValueDisplay) {
                        this.minValueDisplay.textContent = minVal.toFixed(2);
                        this.minValueIndicator.classList.remove('hidden');
                    }
                    // Update merge explanation
                    if (this.mergeCompareExplain) {
                        this.mergeCompareExplain.innerHTML = `
                            <p class="text-xs text-cyan-600 font-bold mb-1">So sánh ${step.comparing.length} phần tử đầu:</p>
                            <p class="text-sm text-slate-700">
                                ${step.comparing.map(i => `<span class="text-slate-500">Run${i.runIndex+1}:</span><strong class="text-blue-600">${i.value.toFixed(1)}</strong>`).join(' | ')}
                            </p>
                            <p class="text-xs text-purple-600 mt-1 font-semibold">→ Min = <strong class="text-purple-700">${minVal.toFixed(2)}</strong></p>
                        `;
                    }
                }
                break;
                
            case 'merge_select':
                this._renderToOutput(step.selectedValue);
                this._updateLaneAfterSelect(step.selectedRunIndex);
                // Update output count
                this.stats.outputItems++;
                if (this.outputCount) {
                    this.outputCount.textContent = `${this.stats.outputItems} phần tử`;
                }
                // Hide min indicator briefly
                if (this.minValueIndicator) {
                    this.minValueIndicator.classList.add('hidden');
                }
                break;
        }
    }
    
    /**
     * Highlight các run đang được so sánh.
     * 
     * @private
     * @param {Array<Object>} comparingItems - Các phần tử đang so sánh.
     * @returns {void}
     */
    _highlightComparingRuns(comparingItems) {
        // Reset all lanes highlight
        const allLanes = this.mergeLanesContainer?.querySelectorAll('[id^="lane-"]');
        allLanes?.forEach(lane => {
            lane.classList.remove('ring-2', 'ring-cyan-400');
        });
        
        // Highlight comparing lanes
        comparingItems.forEach(item => {
            const lane = document.getElementById(`lane-${item.runIndex}`);
            if (lane) {
                lane.classList.add('ring-2', 'ring-cyan-400');
            }
        });
    }
    
    /**
     * Khởi tạo các lane cho merge visualization.
     * 
     * @private
     * @param {Array<Array<number>>} runs - Danh sách các Run.
     * @returns {void}
     */
    _initMergeLanes(runs) {
        if (!this.mergeLanesContainer) return;
        
        this.mergeLanesContainer.innerHTML = '';
        
        // Color palette for light theme
        const colorConfigs = [
            { bg: 'from-blue-100 to-blue-50', border: 'border-blue-400', text: 'text-blue-700', block: 'bg-gradient-to-br from-blue-500 to-indigo-500', header: 'bg-blue-500' },
            { bg: 'from-emerald-100 to-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', block: 'bg-gradient-to-br from-emerald-500 to-green-500', header: 'bg-emerald-500' },
            { bg: 'from-purple-100 to-purple-50', border: 'border-purple-400', text: 'text-purple-700', block: 'bg-gradient-to-br from-purple-500 to-fuchsia-500', header: 'bg-purple-500' },
            { bg: 'from-orange-100 to-orange-50', border: 'border-orange-400', text: 'text-orange-700', block: 'bg-gradient-to-br from-orange-500 to-amber-500', header: 'bg-orange-500' },
            { bg: 'from-pink-100 to-pink-50', border: 'border-pink-400', text: 'text-pink-700', block: 'bg-gradient-to-br from-pink-500 to-rose-500', header: 'bg-pink-500' },
            { bg: 'from-cyan-100 to-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700', block: 'bg-gradient-to-br from-cyan-500 to-sky-500', header: 'bg-cyan-500' },
            { bg: 'from-red-100 to-red-50', border: 'border-red-400', text: 'text-red-700', block: 'bg-gradient-to-br from-red-500 to-rose-500', header: 'bg-red-500' },
            { bg: 'from-teal-100 to-teal-50', border: 'border-teal-400', text: 'text-teal-700', block: 'bg-gradient-to-br from-teal-500 to-emerald-500', header: 'bg-teal-500' },
            { bg: 'from-indigo-100 to-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700', block: 'bg-gradient-to-br from-indigo-500 to-violet-500', header: 'bg-indigo-500' },
            { bg: 'from-amber-100 to-amber-50', border: 'border-amber-400', text: 'text-amber-700', block: 'bg-gradient-to-br from-amber-500 to-yellow-500', header: 'bg-amber-500' }
        ];
        
        runs.forEach((run, idx) => {
            const config = colorConfigs[idx % colorConfigs.length];
            const lane = document.createElement('div');
            lane.className = `flex flex-col gap-2 animate-fade-in rounded-xl bg-gradient-to-b ${config.bg} border-2 ${config.border} transition-all duration-300 shadow-md min-w-[140px] max-w-[180px] shrink-0`;
            lane.id = `lane-${idx}`;
            
            // Hiển thị các phần tử dọc
            const displayCount = Math.min(run.length, 4);
            const blocks = run.slice(0, displayCount).map((v, i) => 
                `<div class="w-full h-8 ${config.block} rounded-lg text-xs text-white flex items-center justify-center shadow font-mono font-bold ${i === 0 ? 'ring-2 ring-yellow-300 animate-pulse' : ''}" title="${v.toFixed(2)}">
                    ${i === 0 ? '👉 ' : ''}${v.toFixed(1)}
                </div>`
            ).join('');
            
            lane.innerHTML = `
                <div class="${config.header} text-white text-xs font-bold px-3 py-1.5 rounded-t-lg flex justify-between items-center">
                    <span>Run ${idx + 1}</span>
                    <span class="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">${run.length} items</span>
                </div>
                <div class="p-2 flex flex-col gap-1.5">
                    ${blocks}
                    ${run.length > displayCount ? `<div class="text-[10px] text-slate-500 text-center font-medium">... +${run.length - displayCount} more</div>` : ''}
                </div>
            `;
            this.mergeLanesContainer.appendChild(lane);
        });
    }
    
    /**
     * Render Min Heap visualization cho K-Way Merge.
     * 
     * Trong K-Way Merge, ta so sánh K phần tử đầu từ K Run,
     * chọn phần tử nhỏ nhất (MIN) để đưa vào Output.
     * 
     * Hiển thị dạng: các phần tử xếp hàng, highlight MIN, mũi tên chỉ Output.
     * 
     * @private
     * @param {Array<Object>} comparingItems - Các phần tử đang so sánh.
     * @returns {void}
     */
    _renderMinHeap(comparingItems) {
        if (!this.minHeapContainer || !comparingItems || comparingItems.length === 0) return;
        
        this.minHeapContainer.innerHTML = '';
        
        const heapItems = [...comparingItems];
        const n = heapItems.length;
        
        // Tìm min value
        const minVal = Math.min(...heapItems.map(item => item.value));
        const minItem = heapItems.find(item => item.value === minVal);
        
        // Color palette cho các run  
        const runColors = [
            '#3B82F6', // blue
            '#10B981', // emerald
            '#8B5CF6', // purple
            '#F59E0B', // amber
            '#EC4899', // pink
            '#06B6D4', // cyan
            '#EF4444', // red
            '#14B8A6', // teal
            '#6366F1', // indigo
            '#F97316'  // orange
        ];
        
        // Container chính
        const mainContainer = document.createElement('div');
        mainContainer.className = 'w-full bg-white rounded-xl p-4 border-2 border-slate-200 shadow-lg';
        
        // Title
        const title = document.createElement('div');
        title.className = 'text-center mb-4';
        title.innerHTML = `
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-sm font-bold shadow">
                <span>⚖️</span>
                <span>K-Way Merge: So sánh ${n} phần tử đầu</span>
            </div>
        `;
        mainContainer.appendChild(title);
        
        // === PHẦN 1: HIỂN THỊ CÁC PHẦN TỬ ĐANG SO SÁNH ===
        const comparisonContainer = document.createElement('div');
        comparisonContainer.className = 'flex flex-wrap justify-center items-end gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200';
        
        heapItems.forEach((item, idx) => {
            const isMin = item.value === minVal;
            const color = runColors[item.runIndex % runColors.length];
            
            const itemDiv = document.createElement('div');
            itemDiv.className = `flex flex-col items-center transition-all duration-300 ${isMin ? 'scale-110' : ''}`;
            
            // Label Run
            const runLabel = document.createElement('div');
            runLabel.className = 'text-xs font-bold mb-1';
            runLabel.style.color = color;
            runLabel.textContent = `Run ${item.runIndex + 1}`;
            itemDiv.appendChild(runLabel);
            
            // Box chứa giá trị
            const valueBox = document.createElement('div');
            valueBox.className = `relative flex flex-col items-center justify-center rounded-xl font-bold transition-all duration-300 shadow-lg`;
            valueBox.style.width = '70px';
            valueBox.style.height = '70px';
            valueBox.style.background = isMin 
                ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
                : `linear-gradient(135deg, ${color}, ${color}dd)`;
            valueBox.style.border = isMin ? '3px solid #FCD34D' : '2px solid white';
            valueBox.style.boxShadow = isMin ? '0 0 20px rgba(245, 158, 11, 0.5)' : '';
            
            // Giá trị
            const valueText = document.createElement('div');
            valueText.className = 'text-white text-lg font-mono font-bold';
            valueText.textContent = item.value.toFixed(1);
            valueBox.appendChild(valueText);
            
            // Crown cho min
            if (isMin) {
                const crown = document.createElement('div');
                crown.className = 'absolute -top-6 text-xl';
                crown.textContent = '👑';
                valueBox.appendChild(crown);
                
                // Label MIN
                const minLabel = document.createElement('div');
                minLabel.className = 'absolute -bottom-6 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full';
                minLabel.textContent = '← MIN';
                valueBox.appendChild(minLabel);
            }
            
            itemDiv.appendChild(valueBox);
            comparisonContainer.appendChild(itemDiv);
            
            // Dấu "vs" giữa các phần tử (trừ phần tử cuối)
            if (idx < n - 1) {
                const vsDiv = document.createElement('div');
                vsDiv.className = 'text-slate-400 font-bold text-sm self-center';
                vsDiv.textContent = 'vs';
                comparisonContainer.appendChild(vsDiv);
            }
        });
        
        mainContainer.appendChild(comparisonContainer);
        
        // === PHẦN 2: HIỂN THỊ QUÁ TRÌNH SO SÁNH ===
        const processSection = document.createElement('div');
        processSection.className = 'bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200';
        
        const sortedByValue = [...heapItems].sort((a, b) => a.value - b.value);
        const comparisonText = sortedByValue.map((item, idx) => {
            const color = runColors[item.runIndex % runColors.length];
            return `<span style="color: ${color}; font-weight: bold;">${item.value.toFixed(1)}</span>`;
        }).join(' < ');
        
        processSection.innerHTML = `
            <div class="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">compare_arrows</span>
                Quá trình so sánh:
            </div>
            <div class="text-center text-sm">
                ${comparisonText}
            </div>
            <div class="text-center text-xs text-slate-500 mt-1">
                (sắp xếp tăng dần → chọn nhỏ nhất)
            </div>
        `;
        mainContainer.appendChild(processSection);
        
        // === PHẦN 3: KẾT QUẢ - MIN ĐƯỢC CHỌN ===
        const resultSection = document.createElement('div');
        resultSection.className = 'text-center';
        
        resultSection.innerHTML = `
            <div class="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl shadow-lg animate-pulse">
                <span class="text-lg">🏆</span>
                <div class="text-left">
                    <div class="text-xs opacity-90">Giá trị nhỏ nhất</div>
                    <div class="font-bold font-mono text-xl">${minVal.toFixed(2)}</div>
                </div>
                <span class="material-symbols-outlined text-2xl">arrow_forward</span>
                <div class="text-left">
                    <div class="text-xs opacity-90">Đưa vào</div>
                    <div class="font-bold">OUTPUT</div>
                </div>
            </div>
            <div class="mt-2 text-xs text-slate-500">
                Lấy từ <span class="font-bold" style="color: ${runColors[minItem.runIndex % runColors.length]}">Run ${minItem.runIndex + 1}</span>, 
                sau đó nạp phần tử tiếp theo từ Run ${minItem.runIndex + 1}
            </div>
        `;
        mainContainer.appendChild(resultSection);
        
        this.minHeapContainer.appendChild(mainContainer);
    }
    
    /**
     * Render phần tử vào Output.
     * 
     * @private
     * @param {number} value - Giá trị được chọn.
     * @returns {void}
     */
    _renderToOutput(value) {
        if (!this.finalOutputContainer) return;
        
        // Hiển thị dạng mảng ngang - mỗi phần tử là 1 ô nhỏ
        const block = document.createElement('div');
        block.className = 'inline-flex flex-col items-center px-1.5 py-1 bg-gradient-to-b from-emerald-500 to-green-600 rounded-lg shadow-md animate-fade-in border border-emerald-400/50 min-w-[50px]';
        block.innerHTML = `
            <span class="text-[8px] text-emerald-200 font-medium">#${this.stats.outputItems + 1}</span>
            <span class="font-mono text-white text-xs font-bold">${value.toFixed(1)}</span>
        `;
        
        // Thêm vào container 
        this.finalOutputContainer.appendChild(block);
        
        // Cập nhật counter
        const outputCount = document.getElementById('outputCount');
        if (outputCount) {
            outputCount.textContent = `${this.stats.outputItems + 1} phần tử`;
        }
        
        // Auto scroll to see newest
        this.finalOutputContainer.scrollTop = this.finalOutputContainer.scrollHeight;
    }
    
    /**
     * Cập nhật lane sau khi chọn phần tử.
     * 
     * @private
     * @param {number} runIndex - Chỉ số Run.
     * @returns {void}
     */
    _updateLaneAfterSelect(runIndex) {
        const lane = document.getElementById(`lane-${runIndex}`);
        if (lane) {
            const container = lane.querySelector('.flex-1');
            if (container?.firstElementChild) {
                container.removeChild(container.firstElementChild);
            }
        }
    }

    // ==================== COMPLETE ====================

    /**
     * Render màn hình kết quả khi hoàn tất.
     * 
     * @private
     * @param {Object} step - Dữ liệu bước complete.
     * @returns {void}
     */
    _renderComplete(step) {
        const sortedData = step.sortedData || [];
        
        // === THỐNG KÊ CHÍNH ===
        const totalElements = document.getElementById('resTotalElements');
        const totalRuns = document.getElementById('resTotalRuns');
        const totalSteps = document.getElementById('resTotalSteps');
        const totalCompares = document.getElementById('resTotalCompares');
        
        if (totalElements) totalElements.textContent = sortedData.length.toLocaleString();
        if (totalRuns) totalRuns.textContent = this.stats.totalRuns || Math.ceil(sortedData.length / this.memoryLimit);
        if (totalSteps) totalSteps.textContent = this.stepCount.toLocaleString();
        if (totalCompares) totalCompares.textContent = (step.comparisonCount || 0).toLocaleString();
        
        // === THÔNG TIN THUẬT TOÁN ===
        const memoryLimit = document.getElementById('resMemoryLimit');
        const kWay = document.getElementById('resKWay');
        const ioCount = document.getElementById('resIOCount');
        
        if (memoryLimit) memoryLimit.textContent = `${this.memoryLimit} phần tử`;
        if (kWay) kWay.textContent = `${this.kWay}-way`;
        if (ioCount) ioCount.textContent = `${(step.readCount || 0) + (step.writeCount || 0)} lần`;
        
        // === MIN/MAX ===
        const minValue = document.getElementById('resMinValue');
        const maxValue = document.getElementById('resMaxValue');
        
        if (sortedData.length > 0) {
            if (minValue) minValue.textContent = sortedData[0].toFixed(2);
            if (maxValue) maxValue.textContent = sortedData[sortedData.length - 1].toFixed(2);
        }
        
        // === ARRAY PREVIEW (dạng mảng) ===
        const arrayPreview = document.getElementById('resultArrayPreview');
        const previewCount = document.getElementById('resPreviewCount');
        
        if (arrayPreview && sortedData.length > 0) {
            arrayPreview.innerHTML = '';
            
            const limit = Math.min(sortedData.length, 100);
            if (previewCount) previewCount.textContent = `${sortedData.length} phần tử (hiển thị ${limit})`;
            
            sortedData.slice(0, limit).forEach((v, i) => {
                const item = document.createElement('div');
                item.className = 'inline-flex flex-col items-center px-2 py-1.5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-lg shadow text-white min-w-[55px]';
                item.innerHTML = `
                    <span class="text-[8px] text-emerald-200">#${i + 1}</span>
                    <span class="font-mono text-xs font-bold">${v.toFixed(1)}</span>
                `;
                arrayPreview.appendChild(item);
            });
            
            // Nếu còn nhiều hơn
            if (sortedData.length > limit) {
                const moreItem = document.createElement('div');
                moreItem.className = 'inline-flex items-center px-3 py-2 bg-slate-200 rounded-lg text-slate-600 text-xs font-bold';
                moreItem.textContent = `+${sortedData.length - limit} more...`;
                arrayPreview.appendChild(moreItem);
            }
        }
        
        // === TABLE PREVIEW ===
        const tbody = document.getElementById('resultTableBody');
        if (tbody && sortedData.length > 0) {
            tbody.innerHTML = '';
            
            const limit = Math.min(sortedData.length, 100);
            sortedData.slice(0, limit).forEach((v, i) => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-blue-50 transition-colors duration-150';
                tr.innerHTML = `
                    <td class="px-4 py-2 text-slate-500 font-mono text-sm">${i + 1}</td>
                    <td class="px-4 py-2 text-emerald-600 font-bold font-mono text-sm">${v.toFixed(4)}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Enable result navigation và chuyển sang view kết quả
        viewManager.enableResultNav();
        viewManager.showResult();
    }
}

// Xuất ra phạm vi global
window.Visualizer = Visualizer;

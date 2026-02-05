/**
 * =============================================================================
 * Module: ExternalSort (Sắp Xếp Ngoại)
 * =============================================================================
 * 
 * @description
 * Module này triển khai thuật toán Sắp xếp ngoại Balanced K-Way Merge Sort.
 * 
 * Sắp xếp ngoại là lớp các thuật toán sắp xếp có thể xử lý lượng dữ liệu lớn 
 * không thể chứa vừa trong bộ nhớ chính (RAM).
 * 
 * @algorithm
 * Quy trình thực hiện gồm 2 Giai đoạn chính:
 * 
 * 1. Giai Đoạn Tạo Run (Run Generation):
 *    - Đọc từng phần (chunk) của dữ liệu vào RAM (theo giới hạn bộ nhớ M).
 *    - Sắp xếp nội bộ (Internal Sort) chunk đó (dùng Insertion Sort để dễ minh họa).
 *    - Ghi chunk đã sắp xếp (gọi là 1 "Run") ra đĩa tạm.
 * 
 * 2. Giai Đoạn Trộn (Merge Phase):
 *    - Sử dụng mô hình K-Way Merge.
 *    - Đọc phần tử đầu tiên của K Runs vào bộ đệm đầu vào.
 *    - Tìm phần tử nhỏ nhất và ghi ra bộ đệm đầu ra (Output).
 *    - Lặp lại cho đến khi hết dữ liệu.
 * 
 * @author CS523 - DSA Nâng Cao
 * @version 2.0.0
 */

class ExternalSort {
    /**
     * Khởi tạo bộ sắp xếp ngoại.
     * 
     * @constructor
     * @param {Float64Array|Array<number>} data - Mảng dữ liệu đầu vào cần sắp xếp.
     * @param {Object} options - Các tùy chọn cấu hình.
     * @param {number} [options.memoryLimit=4] - Giới hạn số phần tử trong RAM (M).
     * @param {number} [options.kWay=2] - Số lượng Run merge cùng lúc (K).
     * 
     * @example
     * const sorter = new ExternalSort([5, 2, 8, 1], { memoryLimit: 2, kWay: 2 });
     */
    constructor(data, options = {}) {
        // Cấu hình thuật toán
        this.memoryLimit = options.memoryLimit || 4;  // M: Giới hạn bộ nhớ
        this.kWay = options.kWay || 2;                // K: Số đường merge
        
        // Lưu trữ dữ liệu
        this.originalData = Array.isArray(data) ? [...data] : Array.from(data);
        this.runs = [];          // Danh sách các "Run" (các mảng con đã sắp xếp)
        this.sortedData = [];    // Kết quả cuối cùng
        
        // Thống kê hiệu năng
        this.comparisonCount = 0;  // Đếm số phép so sánh
        this.readCount = 0;        // Đếm số lần đọc từ đĩa
        this.writeCount = 0;       // Đếm số lần ghi ra đĩa
    }

    /**
     * Reset trạng thái bộ sắp xếp để bắt đầu lại từ đầu.
     * Giữ nguyên dữ liệu gốc và cấu hình.
     * 
     * @returns {void}
     */
    reset() {
        this.runs = [];
        this.sortedData = [];
        this.comparisonCount = 0;
        this.readCount = 0;
        this.writeCount = 0;
    }

    /**
     * Generator chính quản lý toàn bộ quá trình sắp xếp.
     * 
     * @description
     * Sử dụng Generator (function*) để có thể tạm dừng/tiếp tục sau mỗi bước.
     * Điều này cho phép Visualizer vẽ lại UI sau mỗi hành động nhỏ,
     * tạo hiệu ứng animation từng bước.
     * 
     * @generator
     * @yields {Object} Đối tượng chứa thông tin về bước hiện tại:
     *   - phase: Giai đoạn ('run_generation', 'merge_pass', 'complete')
     *   - step: Bước cụ thể trong giai đoạn
     *   - message: Mô tả hành động hiện tại (tiếng Việt)
     *   - ...data: Dữ liệu bổ sung tùy theo bước
     * 
     * @example
     * const sorter = new ExternalSort(data, options);
     * for (const step of sorter.sort()) {
     *     console.log(step.message);
     * }
     */
    *sort() {
        const data = [...this.originalData];
        
        // ====== GIAI ĐOẠN 1: TẠO RUNS ======
        yield* this._generateRunsPhase(data);
        
        // ====== GIAI ĐOẠN 2: MERGE (TRỘN) ======
        yield* this._mergePhase();
        
        // Lưu kết quả cuối cùng
        if (this.runs.length === 1) {
            this.sortedData = [...this.runs[0]];
        }
        
        // Thông báo hoàn tất
        yield {
            phase: 'complete',
            step: 'finished',
            message: 'Chúc mừng! Quá trình sắp xếp đã hoàn tất.',
            sortedData: this.sortedData,
            comparisonCount: this.comparisonCount,
            readCount: this.readCount,
            writeCount: this.writeCount
        };
    }

    /**
     * GIAI ĐOẠN 1: RUN GENERATION - Tạo các Run ban đầu.
     * 
     * @description
     * Chia file lớn thành các file nhỏ (Run) vừa với RAM và sắp xếp chúng.
     * Mỗi Run là một mảng đã được sắp xếp tăng dần.
     * 
     * @private
     * @generator
     * @param {Array<number>} data - Mảng dữ liệu cần xử lý.
     * @yields {Object} Thông tin về tiến trình tạo Run.
     */
    *_generateRunsPhase(data) {
        yield {
            phase: 'run_generation_start',
            step: 'init',
            message: `Bắt đầu Giai đoạn 1: Chia để trị (Tạo các Run). Tổng ${data.length} phần tử, RAM chứa được ${this.memoryLimit} phần tử.`,
            totalElements: data.length,
            memoryLimit: this.memoryLimit
        };

        let runIndex = 0;
        let position = 0;

        // Duyệt qua toàn bộ dữ liệu, cắt từng miếng M phần tử
        while (position < data.length) {
            // === Bước 1.1: Đọc chunk vào RAM ===
            const chunk = data.slice(position, position + this.memoryLimit);
            this.readCount++;
            
            yield {
                phase: 'run_generation',
                step: 'read_chunk',
                message: `Đọc ${chunk.length} phần tử (từ vị trí ${position}) vào RAM`,
                runIndex: runIndex,
                chunk: [...chunk],
                chunkIndex: runIndex,
                chunkSize: chunk.length,
                position: position,
                currentChunk: [...chunk]
            };

            // === Bước 1.2: Sắp xếp chunk trong RAM ===
            const sortedChunk = yield* this._sortChunkWithVisualization(chunk, runIndex);
            
            // === Bước 1.3: Ghi Run ra đĩa ===
            this.runs.push([...sortedChunk]);
            this.writeCount++;

            yield {
                phase: 'run_generation',
                step: 'write_run',
                message: `Ghi Run #${runIndex + 1} xuống đĩa tạm (${sortedChunk.length} phần tử)`,
                runIndex: runIndex,
                run: [...sortedChunk],
                date: [...sortedChunk], // Alias cho visualizer
                allRuns: this.runs.map(r => [...r])
            };

            position += this.memoryLimit;
            runIndex++;
        }

        yield {
            phase: 'run_generation_complete',
            step: 'phase_complete',
            message: `Hoàn tất Giai đoạn 1. Đã tạo ${this.runs.length} Run.`,
            runs: this.runs.map(r => [...r]),
            totalRuns: this.runs.length
        };
    }

    /**
     * Sắp xếp một chunk trong RAM với visualization từng bước.
     * 
     * @description
     * Sử dụng Insertion Sort để dễ minh họa từng bước so sánh.
     * Mỗi lần so sánh và chèn đều yield để visualizer có thể vẽ.
     * 
     * @private
     * @generator
     * @param {Array<number>} chunk - Mảng con cần sắp xếp.
     * @param {number} runIndex - Chỉ số Run hiện tại (để hiển thị).
     * @yields {Object} Thông tin về từng bước sắp xếp.
     * @returns {Array<number>} Mảng đã được sắp xếp.
     */
    *_sortChunkWithVisualization(chunk, runIndex) {
        const arr = [...chunk];
        
        yield {
            phase: 'run_generation',
            step: 'sort_chunk',
            message: 'RAM: Bắt đầu sắp xếp nội bộ (Insertion Sort)...',
            runIndex: runIndex,
            array: [...arr],
            currentChunk: [...arr]
        };

        // === INSERTION SORT ===
        for (let i = 1; i < arr.length; i++) {
            const key = arr[i];
            let j = i - 1;

            yield {
                phase: 'run_generation',
                step: 'sorting_compare',
                message: `RAM: Xét phần tử arr[${i}] = ${key.toFixed(2)}`,
                runIndex: runIndex,
                array: [...arr],
                comparing: [i],
                key: key,
                currentChunk: [...arr]
            };

            while (j >= 0) {
                this.comparisonCount++;
                
                yield {
                    phase: 'run_generation',
                    step: 'sorting_compare',
                    message: `RAM: So sánh ${key.toFixed(2)} với ${arr[j].toFixed(2)}`,
                    runIndex: runIndex,
                    array: [...arr],
                    comparing: [j, i],
                    key: key,
                    currentChunk: [...arr]
                };

                if (arr[j] > key) {
                    // Dời phần tử sang phải
                    arr[j + 1] = arr[j];
                    j--;
                } else {
                    break;
                }
            }

            // Chèn key vào vị trí đúng
            arr[j + 1] = key;

            yield {
                phase: 'run_generation',
                step: 'sorting_insert',
                message: `RAM: Chèn ${key.toFixed(2)} vào vị trí ${j + 1}`,
                runIndex: runIndex,
                array: [...arr],
                insertedAt: j + 1,
                currentChunk: [...arr]
            };
        }

        yield {
            phase: 'run_generation',
            step: 'sorting_complete',
            message: 'RAM: Sắp xếp xong! Chuẩn bị ghi ra đĩa.',
            runIndex: runIndex,
            sortedArray: [...arr],
            currentChunk: [...arr]
        };

        return arr;
    }

    /**
     * GIAI ĐOẠN 2: MERGE PHASE - Trộn các Run.
     * 
     * @description
     * Trộn các Run đã sắp xếp thành 1 Run duy nhất.
     * Sử dụng K-Way Merge: mỗi lần trộn K run cùng lúc.
     * Lặp lại cho đến khi chỉ còn 1 Run (kết quả cuối cùng).
     * 
     * @private
     * @generator
     * @yields {Object} Thông tin về tiến trình trộn.
     */
    *_mergePhase() {
        // Nếu chỉ có 1 run, không cần merge
        if (this.runs.length <= 1) {
            yield {
                phase: 'merge_start',
                step: 'skip',
                message: 'Chỉ có 1 Run, không cần trộn.',
                runs: this.runs.map(r => [...r]),
                kWay: this.kWay
            };
            return;
        }

        yield {
            phase: 'merge_start',
            step: 'init',
            message: `Bắt đầu Giai đoạn 2: Trộn K-Way (K=${this.kWay})`,
            runs: this.runs.map(r => [...r]),
            kWay: this.kWay
        };

        let passNumber = 1;

        // Lặp cho đến khi chỉ còn 1 Run
        while (this.runs.length > 1) {
            yield {
                phase: 'merge_pass_start',
                step: 'pass_init',
                message: `--- Pass trộn thứ ${passNumber} (còn ${this.runs.length} Run) ---`,
                passNumber: passNumber,
                runsCount: this.runs.length,
                runs: this.runs.map(r => [...r])
            };

            const newRuns = [];
            let groupIndex = 0;

            // Xử lý từng nhóm K Run
            while (this.runs.length > 0) {
                // Lấy tối đa K run để trộn
                const runsToMerge = this.runs.splice(0, Math.min(this.kWay, this.runs.length));

                if (runsToMerge.length === 1) {
                    // Run lẻ: giữ nguyên cho pass sau
                    newRuns.push(runsToMerge[0]);
                    
                    yield {
                        phase: 'merge_pass',
                        step: 'single_run',
                        message: `Run lẻ (${runsToMerge[0].length} phần tử), chuyển sang pass sau.`,
                        passNumber: passNumber,
                        groupIndex: groupIndex,
                        run: [...runsToMerge[0]]
                    };
                } else {
                    // Thực hiện K-Way Merge
                    const mergedRun = yield* this._mergeKRuns(runsToMerge, passNumber, groupIndex);
                    newRuns.push(mergedRun);
                }

                groupIndex++;
            }

            this.runs = newRuns;

            yield {
                phase: 'merge_pass_complete',
                step: 'pass_done',
                message: `Kết thúc Pass ${passNumber}. Còn ${this.runs.length} Run.`,
                passNumber: passNumber,
                runs: this.runs.map(r => [...r])
            };

            passNumber++;
        }

        yield {
            phase: 'merge_complete',
            step: 'done',
            message: 'Đã trộn xong tất cả! File kết quả sẵn sàng.',
            finalRun: this.runs.length > 0 ? [...this.runs[0]] : []
        };
    }

    /**
     * Trộn K Run thành 1 Run mới (K-Way Merge Algorithm).
     * 
     * @description
     * Thuật toán:
     * 1. Theo dõi vị trí hiện tại của mỗi Run bằng mảng indices.
     * 2. Mỗi bước: so sánh phần tử đầu của các Run, chọn nhỏ nhất.
     * 3. Đưa phần tử nhỏ nhất vào kết quả, tăng index của Run đó.
     * 4. Lặp lại cho đến khi tất cả Run đều hết.
     * 
     * @private
     * @generator
     * @param {Array<Array<number>>} runs - Danh sách các Run cần trộn.
     * @param {number} passNumber - Số thứ tự pass hiện tại.
     * @param {number} groupIndex - Chỉ số nhóm trong pass.
     * @yields {Object} Thông tin về từng bước trộn.
     * @returns {Array<number>} Run mới đã được trộn.
     */
    *_mergeKRuns(runs, passNumber, groupIndex) {
        yield {
            phase: 'merge_pass',
            step: 'merge_start',
            message: `Trộn nhóm ${groupIndex + 1}: ${runs.length} Run...`,
            passNumber: passNumber,
            groupIndex: groupIndex,
            runs: runs.map(r => [...r])
        };

        const result = [];
        // Con trỏ vị trí của mỗi Run
        const indices = new Array(runs.length).fill(0);

        // Vòng lặp chính
        while (true) {
            let minValue = Infinity;
            let minRunIndex = -1;
            const comparingElements = [];

            // Duyệt đầu các Run để tìm Min
            for (let i = 0; i < runs.length; i++) {
                if (indices[i] < runs[i].length) {
                    const currentValue = runs[i][indices[i]];
                    
                    comparingElements.push({
                        runIndex: i,
                        elementIndex: indices[i],
                        value: currentValue
                    });

                    this.comparisonCount++;

                    if (currentValue < minValue) {
                        minValue = currentValue;
                        minRunIndex = i;
                    }
                }
            }

            // Nếu không còn phần tử nào -> hoàn tất
            if (minRunIndex === -1) break;

            yield {
                phase: 'merge_pass',
                step: 'merge_compare',
                message: `So sánh các đầu Run: tìm Min = ${minValue.toFixed(2)}`,
                passNumber: passNumber,
                groupIndex: groupIndex,
                comparing: comparingElements,
                minElement: { runIndex: minRunIndex, value: minValue }
            };

            // Đưa Min vào kết quả
            result.push(minValue);
            indices[minRunIndex]++;
            this.writeCount++;

            yield {
                phase: 'merge_pass',
                step: 'merge_select',
                message: `Chọn ${minValue.toFixed(2)} (Run ${minRunIndex + 1}) → Output`,
                passNumber: passNumber,
                groupIndex: groupIndex,
                selectedValue: minValue,
                selectedRunIndex: minRunIndex,
                currentResult: [...result],
                currentIndices: [...indices]
            };
        }

        yield {
            phase: 'merge_pass',
            step: 'merge_complete',
            message: `Trộn xong nhóm ${groupIndex + 1}. Run mới: ${result.length} phần tử.`,
            passNumber: passNumber,
            groupIndex: groupIndex,
            mergedRun: [...result]
        };

        return result;
    }

    // ==================== GETTERS ====================

    /**
     * Lấy dữ liệu đã sắp xếp.
     * 
     * @returns {Array<number>} Mảng kết quả đã sắp xếp tăng dần.
     */
    getSortedData() {
        return [...this.sortedData];
    }

    /**
     * Lấy tổng số phép so sánh đã thực hiện.
     * 
     * @returns {number} Số phép so sánh.
     */
    getComparisonCount() {
        return this.comparisonCount;
    }

    /**
     * Lấy thống kê đầy đủ về quá trình sắp xếp.
     * 
     * @returns {Object} Đối tượng chứa các thống kê.
     */
    getStatistics() {
        return {
            comparisonCount: this.comparisonCount,
            readCount: this.readCount,
            writeCount: this.writeCount,
            memoryLimit: this.memoryLimit,
            kWay: this.kWay,
            originalSize: this.originalData.length
        };
    }
}

// Xuất ra phạm vi global để sử dụng trong browser
window.ExternalSort = ExternalSort;

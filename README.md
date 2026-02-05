# 📊 External Sort Visualization

> **Minh họa trực quan thuật toán Sắp Xếp Ngoại (External Sort)**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-2ea44f)](https://khoibui16.github.io/External-File-Sorting-Visualizer/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

| 📚 Môn học | CS523 - Cấu trúc dữ liệu và Giải thuật nâng cao |
|------------|-----------------------------------------------|
| 🏫 Trường  | Đại học Công nghệ Thông tin - ĐHQG TP.HCM (UIT) |
| 👨‍💻 Tác giả | Bùi Nhật Anh Khôi - 23520761 |

---

## 🚀 Demo Trực Tuyến

**👉 [Truy cập ứng dụng tại đây](https://khoibui16.github.io/External-File-Sorting-Visualizer/)**

> Không cần cài đặt, chỉ cần mở link và sử dụng ngay!

---

## 📖 Giới Thiệu

**External Sort** (Sắp xếp ngoại) là thuật toán sắp xếp được thiết kế để xử lý **dữ liệu lớn hơn bộ nhớ RAM**. Ứng dụng này minh họa trực quan toàn bộ quá trình:

1. **Phase 1 - Tạo Run**: Đọc từng chunk dữ liệu vừa RAM → Sắp xếp (Insertion Sort) → Ghi ra Run
2. **Phase 2 - K-Way Merge**: Gộp K Run đã sắp xếp thành output cuối cùng

---

## 🎯 Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| 🖥️ **3 bước rõ ràng** | Cấu hình → Minh họa → Kết quả |
| 📊 **Animation realtime** | Xem từng bước: đọc, sắp xếp, ghi, merge |
| 🎮 **Điều khiển linh hoạt** | Play/Pause, Step từng bước, tốc độ 10ms-2000ms |
| 📈 **Thống kê chi tiết** | Số bước, so sánh, I/O, MIN/MAX |
| 💾 **Lưu kết quả** | Reload trang vẫn giữ kết quả (sessionStorage) |
| 📥 **Xuất file** | Download .bin hoặc .txt |

---

## 🛠️ Cài Đặt Và Chạy Locally

### Yêu Cầu

- Trình duyệt web hiện đại (Chrome, Firefox, Edge)
- (Tùy chọn) Node.js hoặc Python để chạy server local

### Cách 1: Mở trực tiếp (Đơn giản nhất)

```bash
# Clone repository
git clone https://github.com/KhoiBui16/External-File-Sorting-Visualizer.git

# Mở file index.html trực tiếp bằng trình duyệt
# (Một số tính năng file có thể bị hạn chế do CORS)
```

### Cách 2: Dùng Live Server (Khuyến nghị cho VS Code)

```bash
# 1. Clone repository
git clone https://github.com/KhoiBui16/External-File-Sorting-Visualizer.git
cd External-File-Sorting-Visualizer

# 2. Mở VS Code
code .

# 3. Cài extension "Live Server" nếu chưa có
# 4. Click phải vào index.html → "Open with Live Server"
```

### Cách 3: Dùng Node.js

```bash
# 1. Clone repository
git clone https://github.com/KhoiBui16/External-File-Sorting-Visualizer.git
cd External-File-Sorting-Visualizer

# 2. Cài dependencies (không bắt buộc, chỉ cần cho test)
npm install

# 3. Chạy server
npx serve .

# 4. Mở http://localhost:3000
```

### Cách 4: Dùng Python

```bash
# 1. Clone repository
git clone https://github.com/KhoiBui16/External-File-Sorting-Visualizer.git
cd External-File-Sorting-Visualizer

# 2. Chạy server
python -m http.server 8000

# 3. Mở http://localhost:8000
```

---

## 📋 Hướng Dẫn Sử Dụng

### Bước 1: Tạo hoặc upload dữ liệu

- **Nhanh**: Click "Tạo 20 số" hoặc "Tạo 100 số" để tạo dữ liệu ngẫu nhiên
- **Upload**: Kéo thả file .bin vào vùng upload

### Bước 2: Cấu hình tham số

| Tham số | Ý nghĩa | Phạm vi | Gợi ý |
|---------|---------|---------|-------|
| **M (RAM)** | Số phần tử tối đa trong RAM | 2 - 20 | 4-6 để dễ quan sát |
| **K (K-Way)** | Số Run merge đồng thời | 2 - 10 | 2-3 cho demo |

### Bước 3: Chạy mô phỏng

1. Nhấn **"Bắt Đầu Mô Phỏng"**
2. Sử dụng các nút:
   - ▶️ **Play**: Chạy tự động
   - ⏸️ **Pause**: Tạm dừng
   - ⏭️ **Step**: Đi từng bước một
3. Điều chỉnh **tốc độ** bằng thanh trượt (mặc định 90%)

### Bước 4: Xem kết quả

- Xem thống kê tổng hợp
- Xem trước mảng đã sắp xếp
- Tải xuống file .bin hoặc .txt

---

## 🔬 Thuật Toán

### Phase 1: Tạo Run

```
Input: [8, 3, 7, 1, 5, 9, 2, 6, 4]  (9 phần tử)
RAM Limit (M) = 3

[8, 3, 7] → Insertion Sort → Run 1: [3, 7, 8]
[1, 5, 9] → Insertion Sort → Run 2: [1, 5, 9]  
[2, 6, 4] → Insertion Sort → Run 3: [2, 4, 6]
```

### Phase 2: K-Way Merge

```
K = 2 (merge 2 Run mỗi lần)

Run 1: [3, 7, 8]  ─┬─→ So sánh đầu: 3 vs 1 → chọn 1
Run 2: [1, 5, 9]  ─┘   Tiếp tục đến hết...

Kết quả: [1, 2, 3, 4, 5, 6, 7, 8, 9] ✅
```

### Độ Phức Tạp

| Metric | Độ phức tạp | Giải thích |
|--------|-------------|------------|
| Thời gian | O(N log N) | N = tổng số phần tử |
| Không gian | O(M) | Chỉ cần M phần tử trong RAM |
| Số Run | ⌈N/M⌉ | N phần tử, mỗi Run chứa M |
| Số Pass | ⌈logₖ(Runs)⌉ | Merge K Run mỗi lần |

---

## 📁 Cấu Trúc Dự Án

```
📦 External-File-Sorting-Visualizer/
├── 📄 index.html          # Giao diện chính (Single Page App)
├── 📄 package.json        # Cấu hình npm (cho testing)
├── 📄 requirements.txt    # Dependencies Python (cho testing)
├── 📄 .gitignore          # Git ignore rules
├── 📂 css/
│   └── styles.css         # Custom styles
├── 📂 js/
│   ├── app.js             # Module chính, điều phối ứng dụng
│   ├── externalSort.js    # Thuật toán External Sort (Generator)
│   ├── visualizer.js      # Animation và rendering
│   ├── viewManager.js     # Quản lý chuyển view
│   ├── fileHandler.js     # Xử lý đọc/ghi file binary
│   └── educationGuide.js  # Hướng dẫn học tập
├── 📂 tools/
│   └── generateTestData.html  # Công cụ tạo dữ liệu test
└── 📂 tests/
    ├── e2e.spec.js        # Playwright E2E tests
    ├── sanity.spec.js     # Basic sanity tests
    └── test_formulas.py   # Kiểm tra công thức tính toán
```

---

## 🛠️ Công Nghệ

- **HTML5** - Cấu trúc
- **Tailwind CSS** (CDN) - Styling
- **Vanilla JavaScript ES6+** - Logic
- **Material Symbols** - Icons
- **Generator Pattern** - Thuật toán step-by-step

---

## 🧪 Testing

```bash
# Cài dependencies
npm install

# Chạy E2E tests với Playwright
npx playwright test

# Kiểm tra công thức Python
pip install -r requirements.txt
python tests/test_formulas.py
```

---

## 📜 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 🙏 Acknowledgments

- Cảm ơn thầy/cô môn CS523 đã hướng dẫn
- Tham khảo: [Visualgo](https://visualgo.net/) cho ý tưởng visualization

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/KhoiBui16">Bùi Nhật Anh Khôi</a> | UIT 2026
</p>

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const { parseZenginFile } = require('./zenginParser');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

function isLikelyGarbage(text) {
  // 文字化け判定: 連続した?やが多い場合は文字化けとみなす
  const garbage = (text.match(/[?]/g) || []).length;
  return garbage > text.length * 0.05; // 5%以上が文字化けならNG
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    // まずShift-JISでデコード
    let content = iconv.decode(buffer, 'shift_jis');
    if (isLikelyGarbage(content)) {
      // 文字化けが多ければUTF-8で再読込
      content = buffer.toString('utf8');
    }
    const result = parseZenginFile(content, req.file.originalname);
    fs.unlinkSync(filePath); // 一時ファイル削除
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 
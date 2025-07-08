const iconv = require('iconv-lite');

const csvHeaders = [
  'データ区分', '銀行番号', '銀行名', '支店名', '支店番号', '預金種目', '口座番号', '受取人名', '振込金額', '新規コード',
  '顧客コード1', '顧客コード2', '未使用1', '未使用2', '振込指定区分', '識別表示'
];

const parseZenginFixed = (content) => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map((line, idx) => {
    // 改行を除いた長さで判定
    const pureLine = line.replace(/\r|\n/g, '');
    const sjisBytes = iconv.encode(pureLine, 'shift_jis');
    if (sjisBytes.length !== 120) {
      throw new Error(`固定長判定エラー: ${idx + 1}行目がShift-JISで120バイトではありません（${sjisBytes.length}バイト）`);
    }
    return { raw: line };
  });
};

const parseZenginCSV = (content) => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => {
    const cols = line.split(',');
    if (cols[0] === 'A') {
      const record = {};
      csvHeaders.forEach((h, i) => {
        record[h] = cols[i] || '';
      });
      return { raw: line, cols, record };
    } else {
      return { raw: line, cols };
    }
  });
};

function parseZenginFile(content, filename) {
  if (filename.toLowerCase().endsWith('.csv')) {
    try {
      return parseZenginCSV(content);
    } catch (e) {
      throw new Error(`CSV判定エラー: ${e.message}`);
    }
  }
  // 1行目のShift-JISバイト数で判定
  const firstLine = content.split(/\r?\n/)[0];
  const sjisBytes = iconv.encode(firstLine, 'shift_jis');
  if (sjisBytes.length === 120) {
    try {
      return parseZenginFixed(content);
    } catch (e) {
      throw new Error(`固定長判定エラー: ${e.message}`);
    }
  }
  throw new Error(`ファイル形式が不正です（CSVまたは全銀固定長テキストのみ対応）。\n1行目内容: '${firstLine}'\n1行目Shift-JISバイト数: ${sjisBytes.length}`);
}

module.exports = { parseZenginFile }; 
import React, { useState } from 'react';

const csvHeaders = [
  'データ区分', '銀行番号', '銀行名', '支店名', '支店番号', '預金種目', '口座番号', '受取人名', '振込金額', '新規コード',
  '顧客コード1', '顧客コード2', '未使用1', '未使用2', '振込指定区分', '識別表示'
];

const downloadBtnStyle = {
  marginLeft: 16,
  background: 'linear-gradient(90deg, #ffe066 0%, #ffd700 100%)',
  border: '1px solid #e6b800',
  color: '#333',
  fontWeight: 'bold',
  borderRadius: 6,
  padding: '8px 20px',
  cursor: 'pointer',
  boxShadow: '0 2px 6px #0001',
  transition: 'background 0.2s, box-shadow 0.2s',
};

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'パースに失敗しました');
      }
    } catch (err) {
      setError('通信エラー');
    } finally {
      setLoading(false);
    }
  };

  // CSV形式のA行が1件でもあればヘッダを出す
  const hasARecord = result && result.some(row => row.record);

  // ハイライト対象カラム
  const highlightCols = ['受取人名', '振込金額'];

  // 受取人名・振込金額のみCSVダウンロード（ヘッダーなし、振込金額→受取人名の順）
  const handleDownloadCsv = () => {
    if (!result) return;
    const filtered = result.filter(row => row.record);
    const csvRows = filtered.map(row => [row.record['振込金額'], row.record['受取人名']]);
    const csvContent = csvRows.map(cols => cols.map(v => `"${v ?? ''}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '振込金額_受取人名のみ.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // ボタンのホバー効果用state
  const [dlHover, setDlHover] = React.useState(false);
  const dlBtnHoverStyle = dlHover
    ? { background: 'linear-gradient(90deg, #ffd700 0%, #ffe066 100%)', boxShadow: '0 4px 12px #0002' }
    : {};

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>全銀協定形式ファイル アップロード</h2>
      <input type="file" accept=".txt,.csv" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: 8 }}>
        アップロード
      </button>
      {result && result.some(row => row.record) && (
        <button
          onClick={handleDownloadCsv}
          style={{ ...downloadBtnStyle, ...dlBtnHoverStyle }}
          onMouseEnter={() => setDlHover(true)}
          onMouseLeave={() => setDlHover(false)}
        >
          受取人名、振込金額 項目のみcsvでダウンロード
        </button>
      )}
      {loading && <div>アップロード中...</div>}
      {error && <pre style={{ color: 'red', whiteSpace: 'pre-wrap', background: '#fee', padding: 8 }}>{error}</pre>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>パース結果</h3>
          <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                {hasARecord && csvHeaders.map(h => <th key={h}>{h}</th>)}
                {!hasARecord && <th>raw</th>}
              </tr>
            </thead>
            <tbody>
              {result.map((row, idx) =>
                row.record ? (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    {csvHeaders.map(h => (
                      <td key={h} style={highlightCols.includes(h) ? { background: 'yellow', fontWeight: 'bold' } : {}}>
                        {row.record[h]}
                      </td>
                    ))}
                  </tr>
                ) : (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td colSpan={csvHeaders.length}>{row.raw}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App; 
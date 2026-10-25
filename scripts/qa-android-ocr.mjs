// Debug-only OCR smoke test. Requires an installed/running APK and adb forward
// from tcp:9222 to the app WebView's devtools socket.
const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = pages.find(item => item.url === 'https://localhost/');
if (!page) throw new Error('Sign by Sign WebView not found. Start the debug APK and forward port 9222.');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (!data.id || !pending.has(data.id)) return;
  const { resolve, reject } = pending.get(data.id);
  pending.delete(data.id);
  if (data.error) reject(new Error(data.error.message));
  else if (data.result?.exceptionDetails) reject(new Error(data.result.exceptionDetails.text));
  else resolve(data.result?.result?.value);
});

function evaluate(expression) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
  });
}

try {
  await evaluate(`(async () => {
    const response = await fetch('/assets/ax/generated/mega.png');
    if (!response.ok) throw new Error('Bundled image missing');
    const image = await createImageBitmap(await response.blob());
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * .7);
    canvas.height = Math.round(image.height * .19);
    canvas.getContext('2d').drawImage(image, image.width * .15, image.height * .24, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    const cropped = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([cropped], 'mega-sign.png', { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.getElementById('captureInput');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  const deadline = Date.now() + 120000;
  let last = null;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    last = await evaluate(`({
      text: document.getElementById('recognizedText')?.value || '',
      status: document.getElementById('ocrStatusText')?.textContent || '',
      result: document.getElementById('scanResult')?.innerText?.slice(0, 600) || '',
      busy: !!document.querySelector('[data-action="cancel-ocr"]')
    })`);
    if (last.result || (last.status && !last.busy && !last.text)) break;
  }
  console.log(JSON.stringify(last, null, 2));
  if (!last?.text?.includes('메가') || !last?.result?.includes('메가')) process.exitCode = 1;
} finally {
  socket.close();
}

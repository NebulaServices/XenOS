self.onmessage = event => {
  const iframe = document.createElement('iframe');
  iframe.src = event.data;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    // Send a message back to the main thread to confirm that the iframe has loaded
    self.postMessage({ index: index, message: 'iframe loaded' });
  }
}

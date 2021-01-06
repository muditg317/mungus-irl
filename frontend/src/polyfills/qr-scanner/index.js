import QrScanner from './qr-scanner';

QrScanner.decodeFromCanvas = (canvas, callback) => {
  if (!canvas) {
    throw new Error("Canvas not provided!");
  }
  const context = canvas.getContext("2d");
  QrScanner.width = canvas.width;
  QrScanner.height = canvas.height;
  QrScanner.imagedata = context.getImageData(0, 0, QrScanner.width, QrScanner.height);
  ((original) => {
    console.enableLogging = () => {
      console.log = original;
    };
    console.disableLogging = () => {
      console.log = (...args) => {
        let inQrProcess = false;
        try {
          throw new Error("bad console log!");
        } catch (e) {
          inQrProcess = e.stack.search(/console\.log[\s\S]*Object\.process[\s\S]*decodeFromCanvas/) !== -1;
        }
        if (!inQrProcess) {
          original.apply(this, ...args);
        }
      };
    };
  })(console.log);
  let result;
  try {
    console.disableLogging();
    result = QrScanner.process(context);
  } catch (e) {
    throw e;
  } finally {
    console.enableLogging();
    delete console.disableLogging;
    delete console.enableLogging;
  }
  callback && callback(result);
  return result;
};

export default QrScanner;

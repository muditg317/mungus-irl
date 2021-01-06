import QrScanner from 'polyfills/qr-scanner';
import { useCallback, useEffect, useRef, useState } from 'react';

const useQrScanner = (dataCallback, defaultMode="user") => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const animationRequestRef = useRef();
  const scanTimeoutRef = useRef();

  const [ mode, setMode ] = useState(defaultMode);
  const [ scanning, setScanning ] = useState(false);
  const [ qrScanResult, setQRScanResult ] = useState();

  const stopScanning = useCallback((video, animationRequest, scanTimeout) => {
    setScanning(false);
    cancelAnimationFrame(animationRequest);
    cancelAnimationFrame(animationRequestRef.current);
    clearTimeout(scanTimeout);
    clearTimeout(scanTimeoutRef.current);
    video && video.srcObject && video.srcObject.getTracks().forEach(track => {
      track.stop();
    });
    videoRef.current && videoRef.current.srcObject && videoRef.current.srcObject.getTracks().forEach(track => {
      track.stop();
    });
  }, []);

  const tick = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    canvasRef.current.getContext("2d").drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    animationRequestRef.current = requestAnimationFrame(tick);
  }, []);

  const scan = useCallback(() => {
    try {
      QrScanner.decodeFromCanvas(canvasRef.current, (scanResult) => {
        if (scanResult) {
          setQRScanResult(scanResult);
          stopScanning();
          dataCallback(scanResult);
        }
      });
    } catch (e) {
      scanTimeoutRef.current = setTimeout(scan, 300);
    }
  }, [stopScanning, dataCallback]);

  const startScanning = useCallback(() => {
    setScanning(true);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: mode } })
      .then(function(stream) {
        if (!videoRef.current) {
          return;
        }
        setQRScanResult();
        videoRef.current.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        tick();
        scan();
      });
  }, [mode, tick, scan]);


  const toggleScanning = useCallback(() => {
    if (scanning) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [scanning, stopScanning, startScanning]);

  const toggleMode = useCallback(() => {
    setMode(current => current === "user" ? "environment" : "user");
    if (scanning) {
      stopScanning();
      startScanning();
    }
  }, [scanning, startScanning, stopScanning]);

  useEffect(() => {
    const video = videoRef.current;
    const animationRequest = animationRequestRef.current;
    const scanTimeout = scanTimeoutRef.current;
    return () => {
      stopScanning(video, animationRequest, scanTimeout);
    };
  }, [stopScanning]);

  return { videoRef, canvasRef, scanning, toggleScanning, mode, toggleMode, qrScanResult };
};

export default useQrScanner;
/* WORKING EXAMPLE BELOW

<div className="w-full flex flex-col">
  <h1>QR Code Scanner</h1>
  <video ref={videoRef}></video>

  <button className="cursor-pointer" onClick={toggleScanning}>
    {scanning ? "Stop Scanning" : "Begin Scanning!"}
  </button>
  <button className="cursor-pointer" onClick={toggleMode}>
    "Flip camera!"
  </button>

  <canvas className="m-auto w-64" ref={canvasRef} width="100" height="100"></canvas>

  <div className="text-xl my-4 mx-auto p-4 bg-white">
    <b>Data: {qrScanResult || (scanning ? "Scanning" : "None")}</b>
  </div>
</div>

 */

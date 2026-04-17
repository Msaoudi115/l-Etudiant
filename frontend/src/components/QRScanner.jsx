import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { getSchools } from "@/lib/api";

/**
 * QR scanner overlay. onResult(text) will be called when a QR is decoded.
 * Includes a "demo" section allowing the user to pick a school manually
 * if the device has no camera (useful in preview / iframe contexts).
 */
export default function QRScanner({ open, onClose, onResult }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    if (!open) return;
    getSchools()
      .then(setSchools)
      .catch(() => setSchools([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let scanner;
    let stopped = false;
    const start = async () => {
      try {
        scanner = new Html5Qrcode("qr-reader", /* verbose= */ false);
        scannerRef.current = scanner;
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError("Aucune caméra détectée. Utilisez la liste ci-dessous.");
          return;
        }
        const camId = devices[devices.length - 1].id; // prefer back camera on mobile
        await scanner.start(
          camId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (stopped) return;
            stopped = true;
            onResult?.(decodedText);
          },
          () => {}
        );
      } catch (e) {
        setError(
          "Caméra indisponible dans ce contexte. Utilisez la sélection rapide ci-dessous."
        );
      }
    };
    start();
    return () => {
      stopped = true;
      (async () => {
        try {
          if (scannerRef.current) {
            const state = scannerRef.current.getState?.();
            if (state === 2) {
              await scannerRef.current.stop();
            }
            await scannerRef.current.clear();
          }
        } catch {}
        scannerRef.current = null;
      })();
    };
  }, [open, onResult]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="scanner-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-testid="qr-scanner-overlay"
        >
          <div className="scanner-top">
            <button onClick={onClose} data-testid="qr-scanner-close">
              ← Fermer
            </button>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Scanner un stand</div>
          </div>
          <div className="scanner-video-wrap">
            <div id="qr-reader" />
            <div className="scanner-reticle" />
          </div>
          <div className="scanner-hint">
            {error ? (
              <span>{error}</span>
            ) : (
              <>
                Pointez la caméra sur le <strong>QR code</strong> à l'entrée du
                stand pour valider votre visite.
              </>
            )}
          </div>
          <div className="scanner-demo">
            <h4>Sélection rapide (démo)</h4>
            <div className="scanner-demo-grid">
              {schools.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  className="scanner-demo-btn"
                  onClick={() => onResult?.(s.qr_token)}
                  data-testid={`demo-stand-${s.id}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

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
  const onResultRef = useRef(onResult);
  const stoppedRef = useRef(false);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!open) return;
    getSchools()
      .then(setSchools)
      .catch(() => setSchools([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let scanner;

    const start = async () => {
      stoppedRef.current = false;
      setError("");

      try {
        scanner = new Html5Qrcode("qr-reader", /* verbose= */ false);
        scannerRef.current = scanner;

        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError("Aucune caméra détectée. Utilisez la liste ci-dessous.");
          return;
        }

        // Prefer back/rear/environment camera; fallback to last device
        const preferredCamera =
          devices.find((d) => /back|rear|environment/i.test(d.label || "")) ||
          devices[devices.length - 1];

        await scanner.start(
          preferredCamera.id,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            onResultRef.current?.(decodedText);
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
      stoppedRef.current = true;
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
  }, [open]);

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
                  onClick={() => onResultRef.current?.(s.qr_token || s.id)}
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

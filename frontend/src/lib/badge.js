/**
 * Generate a shareable PNG badge (1080 × 1350, Instagram post ratio).
 * Uses Canvas API — zero dependency.
 */

const COLORS = {
  navy: "#1A237E",
  red: "#E3000B",
  cream: "#F5F0E6",
  ink: "#1A1A2E",
  white: "#FFFFFF",
};

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * @param {object} data { name, score, stamps, schools:[names], filiere, serial }
 * @returns {Promise<Blob>}
 */
export async function generateBadgeBlob(data) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background: navy with subtle radial accent
  const bgGrad = ctx.createRadialGradient(W * 0.8, H * 0.1, 10, W * 0.8, H * 0.1, W * 0.8);
  bgGrad.addColorStop(0, "#2a35a0");
  bgGrad.addColorStop(1, COLORS.navy);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle pattern of small circles
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#ffffff";
  for (let y = 0; y < H; y += 60) {
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Top band — eyebrow
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 28px Figtree, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SALON · ORIENTATION · 2026", W / 2, 120);

  // Big headline
  ctx.fillStyle = "#fff";
  ctx.font = "900 92px Figtree, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("J'étais au", W / 2, 260);
  ctx.fillText("Salon", W / 2, 360);

  // Red accent
  ctx.fillStyle = COLORS.red;
  ctx.font = "900 92px Figtree, system-ui, sans-serif";
  ctx.fillText("Orientation", W / 2, 460);

  // Passport card: cream panel with rounded corners
  const cardX = 90;
  const cardY = 540;
  const cardW = W - 180;
  const cardH = 620;

  // Card shadow
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = COLORS.cream;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Card navy band
  ctx.fillStyle = COLORS.navy;
  drawRoundedRect(ctx, cardX, cardY, cardW, 80, 36);
  ctx.fill();
  // Clip bottom of band
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(cardX, cardY + 40, cardW, 40);

  // Band text
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "700 22px Figtree, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("PASSEPORT · ÉTUDIANT", cardX + 40, cardY + 52);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 22px Courier New, monospace";
  ctx.fillText(data.serial || "SAL-2026", cardX + cardW - 40, cardY + 52);

  // Name (big, centered)
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.ink;
  ctx.font = "900 58px Figtree, system-ui, sans-serif";
  const nameLines = wrapText(ctx, (data.name || "").toUpperCase(), cardW - 120);
  let ny = cardY + 180;
  nameLines.slice(0, 2).forEach((l) => {
    ctx.fillText(l, W / 2, ny);
    ny += 64;
  });

  // Filière under name
  ctx.fillStyle = "#666";
  ctx.font = "600 26px Figtree, system-ui, sans-serif";
  if (data.filiere) {
    ctx.fillText(data.filiere.toUpperCase(), W / 2, ny + 6);
  }

  // Big score circle
  const sx = W / 2;
  const sy = cardY + 400;
  const sr = 110;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.fillStyle = COLORS.red;
  ctx.textAlign = "center";
  ctx.font = "900 92px Figtree, system-ui, sans-serif";
  ctx.fillText(String(data.score ?? 0), sx, sy + 30);
  ctx.fillStyle = "#888";
  ctx.font = "800 16px Figtree, system-ui, sans-serif";
  ctx.fillText("SCORE SALON", sx, sy + 60);

  // Stamps count + schools sample
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.ink;
  ctx.font = "800 32px Figtree, system-ui, sans-serif";
  const stampsTxt = `${data.stamps ?? 0} ÉTABLISSEMENT${(data.stamps ?? 0) > 1 ? "S" : ""} VISITÉ${
    (data.stamps ?? 0) > 1 ? "S" : ""
  }`;
  ctx.fillText(stampsTxt, W / 2, cardY + 560);

  if (data.schools && data.schools.length) {
    ctx.fillStyle = "#888";
    ctx.font = "500 22px Figtree, system-ui, sans-serif";
    const sample = data.schools.slice(0, 3).join("  ·  ");
    ctx.fillText(sample, W / 2, cardY + 595);
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "700 30px Figtree, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("letudiant.fr", W / 2, H - 90);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 20px Figtree, system-ui, sans-serif";
  ctx.fillText("#SalonOrientation2026  ·  PasseportEtudiant", W / 2, H - 50);

  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

export async function downloadBadge(data, filename = "passeport-etudiant-badge.png") {
  const blob = await generateBadgeBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function shareBadge(data) {
  const blob = await generateBadgeBlob(data);
  const file = new File([blob], "passeport-etudiant-badge.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Mon PasseportEtudiant",
        text: `J'étais au Salon Orientation 2026 ! Score ${data.score}/100 · ${data.stamps} écoles visitées.`,
      });
      return true;
    } catch (e) {
      // user cancelled — fall through to download
    }
  }
  // Fallback : download
  await downloadBadge(data);
  return false;
}

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
  ComposedChart, Bar, ScatterChart, Scatter, ZAxis, Cell,
  PieChart, Pie, Legend,
} from "recharts";

// ============================================================
// ASSET UNIVERSE - 16 assets across USD and PEN
// Expected returns from the user-provided table (midpoints)
// Volatilities are realistic dummy values; will be replaced by
// historical std once data download phase is implemented.
// ============================================================
const ASSETS = [
  // USD - Renta Variable
  { id: "cspx",  name: "iShares Core S&P 500 UCITS ETF",                shortName: "S&P 500",        desc: "500 mayores empresas USA · acc UCITS Irlanda", cur: "USD", cat: "Renta Variable USD",   ret: 0.090, vol: 0.1803, minW: 0.10, maxW: 0.25, defW: 0.15, retLow: 0.08, retHigh: 0.10, histRet: 0.1662, isCash: false },
  { id: "cndx",  name: "iShares NASDAQ 100 UCITS ETF",                  shortName: "Nasdaq 100",     desc: "100 mayores tech-heavy USA · acc UCITS", cur: "USD", cat: "Renta Variable USD",   ret: 0.110, vol: 0.2207, minW: 0.05, maxW: 0.15, defW: 0.08, retLow: 0.10, retHigh: 0.12, histRet: 0.2258, isCash: false },
  { id: "iwda",  name: "iShares MSCI EAFE ETF",                          shortName: "Dev ex-US",      desc: "Developed markets excluyendo USA (Europa, Japón, Asia desarrollada) · USA-listed", cur: "USD", cat: "Renta Variable USD",   ret: 0.0775, vol: 0.1649, minW: 0.05, maxW: 0.20, defW: 0.10, retLow: 0.07, retHigh: 0.085, histRet: 0.1406, isCash: false },
  { id: "msft",  name: "Microsoft Corporation",                          shortName: "Activo 1 JL",    desc: "Stock individual configurable (slot 1)", cur: "USD", cat: "Renta Variable USD",   ret: 0.125, vol: 0.2930, minW: 0.01, maxW: 0.05, defW: 0.03, retLow: 0.11, retHigh: 0.14, histRet: 0.2020, isCash: false },
  { id: "uber",  name: "Uber Technologies, Inc.",                        shortName: "Activo 2 JL",    desc: "Stock individual configurable (slot 2)", cur: "USD", cat: "Renta Variable USD",   ret: 0.105, vol: 0.5086, minW: 0.01, maxW: 0.05, defW: 0.02, retLow: 0.09, retHigh: 0.12, histRet: 0.0872, isCash: false },
  // USD - Refugio
  { id: "igln",  name: "iShares Physical Gold ETC",                      shortName: "Oro",            desc: "ETF físico oro · cobertura inflación + tail risk", cur: "USD", cat: "Refugio / Commodities", ret: 0.050, vol: 0.1729, minW: 0.03, maxW: 0.10, defW: 0.05, retLow: 0.04, retHigh: 0.06, histRet: 0.1994, isCash: false },
  // USD - Renta Fija
  { id: "vtc",   name: "iShares USD Corporate Bond UCITS ETF",           shortName: "Bonos Corp",     desc: "USD investment-grade corporate bonds · acc UCITS", cur: "USD", cat: "Renta Fija USD",       ret: 0.050, vol: 0.0842, minW: 0.03, maxW: 0.15, defW: 0.06, retLow: 0.045, retHigh: 0.055, histRet: 0.0238, isCash: false },
  { id: "bil",   name: "iShares 0-3 Month Treasury Bond ETF",            shortName: "Treasury 0-3M",  desc: "Treasury bills USA ultra-corto · proxy money market", cur: "USD", cat: "Renta Fija USD",       ret: 0.0475, vol: 0.00, minW: 0.02, maxW: 0.10, defW: 0.04, retLow: 0.045, retHigh: 0.050, histRet: 0.0270, isCash: true },
  { id: "ief",   name: "iShares 7-10 Year Treasury Bond ETF",            shortName: "Treasury 10Y",   desc: "Treasury bonds USA duración intermedia · diversificador", cur: "USD", cat: "Renta Fija USD",       ret: 0.0425, vol: 0.0743, minW: 0.03, maxW: 0.12, defW: 0.06, retLow: 0.040, retHigh: 0.045, histRet: 0.0063, isCash: false },
  // USD - Especulativo
  { id: "btc",   name: "Bitcoin USD",                                    shortName: "Bitcoin",        desc: "Crypto · alta vol · tope 5% por gestión prudencial", cur: "USD", cat: "Especulativo",         ret: 0.200, vol: 0.6439, minW: 0.05, maxW: 0.05, defW: 0.05, retLow: 0.15, retHigh: 0.25, histRet: 0.4416, isCash: false },
  // USD - Cash
  { id: "ibsav", name: "Cuenta Ahorros IB (USD)",                        shortName: "Ahorros IB",     desc: "Interactive Brokers cash sweep USD · liquidez total", cur: "USD", cat: "Cash / Equivalentes",  ret: 0.0314, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.04, retLow: 0.03, retHigh: 0.0314, histRet: 0.015, isCash: true },
  { id: "cdusd", name: "Plazo Fijo CD (USD)",                            shortName: "CD USD",         desc: "Certificate of Deposit USD · plazo fijo bancario", cur: "USD", cat: "Cash / Equivalentes",  ret: 0.0325, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.03, retLow: 0.020, retHigh: 0.045, histRet: 0.020, isCash: true },
  // PEN - Renta Variable
  { id: "epu",   name: "iShares MSCI Peru and Global Exposure ETF",      shortName: "EPU Perú",       desc: "ETF mercado Perú · proxy de RV local concentrada", cur: "PEN", cat: "Perú - Renta Variable", ret: 0.080, vol: 0.2636, minW: 0.02, maxW: 0.08, defW: 0.04, retLow: 0.07, retHigh: 0.09, histRet: 0.1717, isCash: false },
  // PEN - Renta Fija (synthetic — no public ticker)
  { id: "pensov",name: "Bonos Soberanos PEN (sintético)",                shortName: "Bonos Sob PEN",  desc: "Bonos soberanos Perú · sintético (sin ticker público)", cur: "PEN", cat: "Perú - Renta Fija",    ret: 0.060, vol: 0.07, minW: 0.02, maxW: 0.08, defW: 0.04, retLow: 0.055, retHigh: 0.065, histRet: 0.045, isCash: false },
  // PEN - Cash
  { id: "pfpen", name: "Plazo Fijo PEN",              shortName: "Plazo Fijo PEN", desc: "Plazo fijo soles · tasa local bancaria", cur: "PEN", cat: "Cash / Equivalentes",  ret: 0.0475, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.02, retLow: 0.040, retHigh: 0.055, histRet: 0.045, isCash: true },
  { id: "savpen",name: "Cuenta Ahorros PEN",          shortName: "Ahorros PEN",    desc: "Cuenta ahorros soles · liquidez inmediata", cur: "PEN", cat: "Cash / Equivalentes",  ret: 0.045, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.02, retLow: 0.040, retHigh: 0.050, histRet: 0.035, isCash: true },
];

// Metadata of the real-data download (from yfinance)
const DATA_META = {
  source: "yfinance",
  dateFrom: "2019-05-10",
  dateTo: "2026-05-21",
  years: 7.03,
  days: 1722,
  tickersUsed: {
    cspx: "CSPX.L", cndx: "CNDX.L", iwda: "EXUS.L", msft: "MSFT", uber: "UBER",
    igln: "IGLN.L", vtc: "LQDA.L", bil: "ZPR1.L", ief: "CBU7.L", btc: "BTC-USD", epu: "EPU"
  },
  // BIL has real σ of 0.26% but kept at 0 per user's modeling decision (cash = zero risk)
  // pensov correlations are synthetic (no public Peru sovereign bond ticker that aligned)
  realSigmaBil: 0.00258,
};

// PENSOV: opciones de σ (6.00% a 9.00% en pasos de 0.25%, 13 valores)
const PENSOV_SIGMA_OPTIONS = Array.from({ length: 13 }, (_, i) =>
  Math.round((0.06 + i * 0.0025) * 10000) / 10000
);

const N = ASSETS.length;
const RISK_FREE = 0.045; // for Sharpe
const PFPEN_IDX = ASSETS.findIndex(a => a.id === "pfpen");

// ============================================================
// CORRELATION MATRIX (16x16) - realistic dummy values
// Order matches ASSETS array. Symmetric, diag=1.
// ============================================================
const C = [
  // cspx,  cndx,  iwda,  msft,  uber,  igln,  vtc,   bil,   ief,   btc,   ibsav, cdusd, epu,   pensov,pfpen, savpen
  [+1.000, +0.923, +0.924, +0.437, +0.358, +0.115, +0.188, -0.012, -0.048, +0.233, +0.000, +0.000, +0.428, +0.150, +0.000, +0.000], // cspx
  [+0.923, +1.000, +0.844, +0.507, +0.358, +0.115, +0.172, -0.006, -0.008, +0.244, +0.000, +0.000, +0.360, +0.100, +0.000, +0.000], // cndx
  [+0.924, +0.844, +1.000, +0.430, +0.365, +0.010, +0.136, -0.012, -0.130, +0.220, +0.000, +0.000, +0.392, +0.180, +0.000, +0.000], // iwda
  [+0.437, +0.507, +0.430, +1.000, +0.392, +0.034, +0.251, +0.003, -0.060, +0.284, +0.000, +0.000, +0.341, +0.100, +0.000, +0.000], // msft
  [+0.358, +0.358, +0.365, +0.392, +1.000, +0.090, +0.209, -0.006, +0.011, +0.216, +0.000, +0.000, +0.338, +0.100, +0.000, +0.000], // uber
  [+0.115, +0.115, +0.010, +0.034, +0.090, +1.000, +0.215, +0.010, +0.233, +0.118, +0.000, +0.000, +0.357, +0.150, +0.000, +0.000], // igln
  [+0.188, +0.172, +0.136, +0.251, +0.209, +0.215, +1.000, -0.004, +0.693, +0.156, +0.000, +0.000, +0.248, +0.550, +0.000, +0.000], // vtc
  [-0.012, -0.006, -0.012, +0.003, -0.006, +0.010, -0.004, +1.000, +0.021, -0.001, +0.000, +0.000, +0.002, +0.200, +0.000, +0.000], // bil
  [-0.048, -0.008, -0.130, -0.060, +0.011, +0.233, +0.693, +0.021, +1.000, -0.003, +0.000, +0.000, -0.020, +0.650, +0.000, +0.000], // ief
  [+0.233, +0.244, +0.220, +0.284, +0.216, +0.118, +0.156, -0.001, -0.003, +1.000, +0.000, +0.000, +0.255, +0.050, +0.000, +0.000], // btc
  [+0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +1.000, +0.000, +0.000, +0.050, +0.000, +0.000], // ibsav
  [+0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +1.000, +0.000, +0.050, +0.000, +0.000], // cdusd
  [+0.428, +0.360, +0.392, +0.341, +0.338, +0.357, +0.248, +0.002, -0.020, +0.255, +0.000, +0.000, +1.000, +0.350, +0.000, +0.000], // epu
  [+0.150, +0.100, +0.180, +0.100, +0.100, +0.150, +0.550, +0.200, +0.650, +0.050, +0.050, +0.050, +0.350, +1.000, +0.150, +0.150], // pensov (synthetic)
  [+0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.150, +1.000, +0.000], // pfpen
  [+0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.000, +0.150, +0.000, +1.000], // savpen
];

// ============================================================
// MATH UTILITIES
// ============================================================

// Inverse standard normal CDF (Beasley-Springer-Moro approximation)
function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q*q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1-p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Standard normal PDF
function normPdf(z) { return Math.exp(-z*z/2) / Math.sqrt(2*Math.PI); }

// Error function approximation (Abramowitz & Stegun 7.1.26)
// Max error: 1.5 × 10^-7
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Box-Muller standard normal sampler
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ============================================================
// CAP RECOMENDADO POR VOLATILIDAD
// Tope máximo que un activo debería tener en una cartera Markowitz "prudencial":
//   σ > 50%: 5%  (BTC, UBER) — tail risk severo
//   σ > 25%: 10% (MSFT, EPU) — alta volatilidad single-name/concentrado
//   resto:  100% (sin tope)
// Cuando el toggle "Topes por volatilidad" está OFF, todos quedan en 100%.
// ============================================================
// ============================================================
// AGRUPACIÓN POR CLASE DE ACTIVO (sin distinción de moneda)
// 5 buckets: Renta Variable, Renta Fija, Cash y Equiv., Commodities, Bitcoin
// ============================================================
const ASSET_GROUP_ORDER = [
  "Renta Variable",
  "Renta Fija",
  "Cash y Equivalentes",
  "Commodities",
  "Bitcoin",
];
const ASSET_GROUP_COLORS = {
  "Renta Variable":      "#7a1b1b",  // burgundy (var(--accent))
  "Renta Fija":          "#3a5a7c",  // teal-blue
  "Cash y Equivalentes": "#6b5e4d",  // ink-muted warm
  "Commodities":         "#b8923a",  // gold
  "Bitcoin":             "#f7931a",  // bitcoin orange
};
function groupOf(asset) {
  if (asset.id === "btc") return "Bitcoin";
  if (asset.id === "igln") return "Commodities";
  if (asset.isCash) return "Cash y Equivalentes";
  if ((asset.cat || "").toLowerCase().includes("fija")) return "Renta Fija";
  return "Renta Variable";
}
function computeGroupWeights(weights, assets) {
  const totals = {};
  for (const g of ASSET_GROUP_ORDER) totals[g] = 0;
  weights.forEach((w, i) => {
    const g = groupOf(assets[i]);
    totals[g] += w;
  });
  return ASSET_GROUP_ORDER
    .map(g => ({ name: g, value: totals[g], color: ASSET_GROUP_COLORS[g] }))
    .filter(d => d.value > 0.001);
}

function recommendedMaxW(asset) {
  if (asset.vol > 0.50) return 0.05;
  if (asset.vol > 0.25) return 0.10;
  return 1.0;
}

// ============================================================
// BLEND CONSENSO → DAMODARAN (CAGR sobre 10 años)
// El consenso de analistas es típicamente un target de 1 año (puede ser
// extremo, e.g. MSFT mean 34%). Damodaran es la rentabilidad de equilibrio
// de largo plazo (~9% equity). Interpolamos linealmente desde el consenso
// (año 1) hasta Damodaran (año 10), computamos el wealth multiplier de
// esa trayectoria, y devolvemos la CAGR equivalente.
//
// Ejemplo: blend(0.30, 0.09, 10) ≈ 0.193 (19.3% CAGR)
// ============================================================
function blendConsensusDamodaran(consensus, damodaran, years = 10) {
  if (typeof consensus !== "number" || typeof damodaran !== "number") return consensus;
  if (years < 2) return consensus;
  let wealth = 1;
  for (let t = 0; t < years; t++) {
    const r = consensus + (damodaran - consensus) * (t / (years - 1));
    wealth *= (1 + r);
  }
  return Math.pow(wealth, 1 / years) - 1;
}

// Portfolio-level moments given weights vector and effective returns array
function portfolioMoments(w, effRet, assets = ASSETS, corr = C) {
  const n = assets.length;
  let mu = 0;
  for (let i = 0; i < n; i++) mu += w[i] * effRet[i];
  let varP = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      varP += w[i] * w[j] * assets[i].vol * assets[j].vol * corr[i][j];
    }
  }
  const sigma = Math.sqrt(Math.max(varP, 0));
  return { mu, sigma, varP };
}

// Cholesky decomposition for multivariate normal sampling
// Handles σ=0 (cash) by working only on the risky subset
function choleskyDecomp(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        const val = A[i][i] - sum;
        L[i][j] = Math.sqrt(Math.max(val, 1e-14));
      } else {
        L[i][j] = L[j][j] > 0 ? (A[i][j] - sum) / L[j][j] : 0;
      }
    }
  }
  return L;
}

// Apply lower-triangular L to vector z: returns L @ z
function applyLowerTri(L, z) {
  const n = L.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) out[i] += L[i][j] * z[j];
  }
  return out;
}

// Generate synthetic monthly log-return time series for all 16 assets
// Uses user expected returns + historical-style vol/corr matrix.
// Cash assets (vol=0) are treated as deterministic compounders.
function generateMonthlyHistory(effRet, months = 120, assets = ASSETS, corr = C) {
  const n = assets.length;
  // Identify risky assets (those with vol > 0)
  const riskyIdx = [];
  for (let i = 0; i < n; i++) if (assets[i].vol > 0) riskyIdx.push(i);
  const nR = riskyIdx.length;
  // Build monthly covariance for risky subset
  const covR = Array.from({ length: nR }, (_, i) =>
    Array.from({ length: nR }, (_, j) =>
      corr[riskyIdx[i]][riskyIdx[j]] * assets[riskyIdx[i]].vol * assets[riskyIdx[j]].vol / 12
    )
  );
  const L = choleskyDecomp(covR);
  // Monthly log-drift per asset (so annualized geometric return matches expected)
  const muMonthly = effRet.map(r => Math.log(1 + Math.max(r, -0.99)) / 12);
  const series = [];
  for (let t = 0; t < months; t++) {
    const z = new Array(nR).fill(0).map(() => randn());
    const Lz = applyLowerTri(L, z);
    const row = new Array(n);
    for (let i = 0; i < n; i++) {
      const rp = riskyIdx.indexOf(i);
      row[i] = muMonthly[i] + (rp >= 0 ? Lz[rp] : 0);
    }
    series.push(row);
  }
  return series;
}

// Backtest a portfolio with periodic rebalancing.
// Returns equity curve, drawdown curve, and metrics.
function runBacktest({ weights, monthlyReturns, rebalanceFreqMonths, V0 = 10000 }) {
  const T = monthlyReturns.length;
  // Hold individual asset values, rebalance to target at each rebalance month
  let assetVals = weights.map(w => w * V0);
  const equity = [V0];
  const portfolioMonthlyRet = [];
  let peak = V0;
  const drawdowns = [0];
  for (let t = 0; t < T; t++) {
    // Apply monthly returns
    let totalBefore = 0; for (let i = 0; i < N; i++) totalBefore += assetVals[i];
    for (let i = 0; i < N; i++) {
      assetVals[i] *= Math.exp(monthlyReturns[t][i]);
    }
    let total = 0; for (let i = 0; i < N; i++) total += assetVals[i];
    equity.push(total);
    portfolioMonthlyRet.push(total / totalBefore - 1);
    peak = Math.max(peak, total);
    drawdowns.push(total / peak - 1);
    // Rebalance if needed (at the end of the month)
    if (rebalanceFreqMonths > 0 && (t + 1) % rebalanceFreqMonths === 0 && t < T - 1) {
      assetVals = weights.map(w => w * total);
    }
  }
  // Compute metrics
  const totalReturn = equity[T] / V0 - 1;
  const years = T / 12;
  const cagr = Math.pow(equity[T] / V0, 1 / years) - 1;
  // Vol: stdev of monthly returns * sqrt(12)
  const meanMR = portfolioMonthlyRet.reduce((a, b) => a + b, 0) / portfolioMonthlyRet.length;
  let varMR = 0;
  for (const r of portfolioMonthlyRet) varMR += (r - meanMR) ** 2;
  varMR /= portfolioMonthlyRet.length;
  const vol = Math.sqrt(varMR * 12);
  const sharpe = vol > 0 ? (cagr - RISK_FREE) / vol : 0;
  const maxDD = Math.min(...drawdowns);
  const calmar = maxDD < 0 ? cagr / Math.abs(maxDD) : 0;
  return { equity, drawdowns, monthlyReturns: portfolioMonthlyRet, totalReturn, cagr, vol, sharpe, maxDD, calmar };
}

// Compute benchmark equity curve: % USD in S&P (idx 0), % PEN in EPU (idx 12)
// Monthly rebalanced.
function runBenchmark({ usdWeight, penWeight, monthlyReturns, V0 = 10000 }) {
  const SP = 0, BVL = 12;
  const total = usdWeight + penWeight;
  const wSP = total > 0 ? usdWeight / total : 1;
  const wBVL = total > 0 ? penWeight / total : 0;
  const equity = [V0];
  const monthlyRet = [];
  let val = V0;
  let peak = V0;
  const drawdowns = [0];
  for (let t = 0; t < monthlyReturns.length; t++) {
    const rSP = Math.exp(monthlyReturns[t][SP]) - 1;
    const rBVL = Math.exp(monthlyReturns[t][BVL]) - 1;
    const r = wSP * rSP + wBVL * rBVL;
    monthlyRet.push(r);
    val *= (1 + r);
    equity.push(val);
    peak = Math.max(peak, val);
    drawdowns.push(val / peak - 1);
  }
  const T = monthlyReturns.length;
  const years = T / 12;
  const cagr = Math.pow(val / V0, 1 / years) - 1;
  const meanMR = monthlyRet.reduce((a, b) => a + b, 0) / monthlyRet.length;
  let varMR = 0;
  for (const r of monthlyRet) varMR += (r - meanMR) ** 2;
  varMR /= monthlyRet.length;
  const vol = Math.sqrt(varMR * 12);
  const sharpe = vol > 0 ? (cagr - RISK_FREE) / vol : 0;
  const maxDD = Math.min(...drawdowns);
  return { equity, drawdowns, monthlyReturns: monthlyRet, cagr, vol, sharpe, maxDD, wSP, wBVL };
}

// Tracking error & info ratio between portfolio and benchmark monthly returns
function compareToBenchmark(portRet, benchRet) {
  const diffs = portRet.map((r, i) => r - benchRet[i]);
  const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  let varDiff = 0;
  for (const d of diffs) varDiff += (d - meanDiff) ** 2;
  varDiff /= diffs.length;
  const TE = Math.sqrt(varDiff * 12);
  const annualizedAlpha = (1 + meanDiff) ** 12 - 1;
  const IR = TE > 0 ? annualizedAlpha / TE : 0;
  return { TE, IR, annualizedAlpha };
}

// ============================================================
// WALK-FORWARD BACKTEST HELPERS
// ============================================================
// Computa σ (anualizada) y matriz de correlación de una ventana de retornos
// mensuales. Robusto a activos sintéticos con σ=0 (devuelve correlación 0 con ellos).
// Encuentra la ventana de meses donde TODOS los activos con peso > eps tienen
// data (no null, no NaN). Devuelve también los activos que limitan el inicio.
function computeBacktestWindow(monthlyReturns, weights, eps = 1e-6) {
  if (!monthlyReturns || monthlyReturns.length === 0) {
    return { startMonth: 0, endMonth: -1, nMonths: 0, limitingIndices: [] };
  }
  const activeIndices = weights
    .map((w, i) => (w > eps ? i : -1))
    .filter((i) => i >= 0);
  const T = monthlyReturns.length;
  const isValid = (t, i) => {
    const v = monthlyReturns[t][i];
    return v !== null && v !== undefined && !Number.isNaN(v);
  };
  let startMonth = -1;
  for (let t = 0; t < T; t++) {
    if (activeIndices.every((i) => isValid(t, i))) {
      startMonth = t;
      break;
    }
  }
  if (startMonth < 0) {
    return { startMonth: 0, endMonth: -1, nMonths: 0, limitingIndices: activeIndices };
  }
  let endMonth = T - 1;
  for (let t = T - 1; t >= startMonth; t--) {
    if (activeIndices.every((i) => isValid(t, i))) {
      endMonth = t;
      break;
    }
  }
  // Activos que limitan el inicio: tenían NaN justo antes del startMonth
  const limitingIndices = [];
  if (startMonth > 0) {
    for (const i of activeIndices) {
      if (!isValid(startMonth - 1, i)) limitingIndices.push(i);
    }
  }
  return { startMonth, endMonth, nMonths: endMonth - startMonth + 1, limitingIndices };
}

function windowSigmaCorr(monthlyReturns, fromIdx, toIdx) {
  const n = monthlyReturns[0].length;
  const k = toIdx - fromIdx;
  if (k < 2) return null;
  // Mean of each column
  const mean = new Array(n).fill(0);
  for (let m = fromIdx; m < toIdx; m++) {
    for (let i = 0; i < n; i++) mean[i] += monthlyReturns[m][i];
  }
  for (let i = 0; i < n; i++) mean[i] /= k;
  // Covariance matrix (population, divided by k)
  const cov = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let m = fromIdx; m < toIdx; m++) {
    const row = monthlyReturns[m];
    for (let i = 0; i < n; i++) {
      const di = row[i] - mean[i];
      for (let j = 0; j <= i; j++) {
        cov[i][j] += di * (row[j] - mean[j]);
      }
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      cov[i][j] /= k;
      if (i !== j) cov[j][i] = cov[i][j];
    }
  }
  // σ monthly → annualized
  const sigma_m = new Array(n);
  for (let i = 0; i < n; i++) sigma_m[i] = Math.sqrt(Math.max(cov[i][i], 0));
  const sigma_a = sigma_m.map((s) => s * Math.sqrt(12));
  // Correlation from cov
  const corr = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    corr[i][i] = 1;
    for (let j = 0; j < i; j++) {
      if (sigma_m[i] === 0 || sigma_m[j] === 0) {
        corr[i][j] = 0;
        corr[j][i] = 0;
      } else {
        const c = cov[i][j] / (sigma_m[i] * sigma_m[j]);
        // Clamp para evitar errores numéricos
        const cc = Math.max(-1, Math.min(1, c));
        corr[i][j] = cc;
        corr[j][i] = cc;
      }
    }
  }
  return { sigma: sigma_a, corr };
}

// Beta de una serie de retornos vs benchmark (slope de OLS univariado)
function computeBeta(portRet, bmRet) {
  if (portRet.length < 2 || portRet.length !== bmRet.length) return NaN;
  const n = portRet.length;
  let meanP = 0, meanB = 0;
  for (let i = 0; i < n; i++) { meanP += portRet[i]; meanB += bmRet[i]; }
  meanP /= n; meanB /= n;
  let cov = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    const db = bmRet[i] - meanB;
    cov += (portRet[i] - meanP) * db;
    varB += db * db;
  }
  return varB > 0 ? cov / varB : NaN;
}

// Walk-forward backtest principal
//   - "Hoy hold": pesos baseWeights (los actuales del Markowitz full-period), held constant
//   - "Walk-forward": en cada punto de rebalanceo, σ y corr de la ventana trailing,
//     μ = customReturns (fijo), corre Markowitz robusto, aplica pesos hasta próximo rebal
//   - "Benchmark S&P": serie de monthly_returns[spIndex] acumulada
function runWalkForwardBacktest({
  monthlyReturns,
  monthlyDates,
  customReturns,
  effectiveAssets,
  baseWeights,
  rebalanceFreqMonths = 3,
  trailingWindow = 24,
  enforceMinFloors = false,
  nSamplesPerOpt = 4000,
  V0 = 10000,
  spIndex = 0,  // cspx is at index 0
}) {
  const T = monthlyReturns.length;
  const N = monthlyReturns[0].length;
  const startMonth = trailingWindow;
  if (T <= startMonth + 2) return null;

  // Assets para el optimizador (sin pisos por default)
  const optAssetsBase = enforceMinFloors
    ? effectiveAssets
    : effectiveAssets.map((a) => ({ ...a, minW: 0 }));

  const dates = [monthlyDates[startMonth]];
  const wfEquity = [V0];
  const holdEquity = [V0];
  const spEquity = [V0];
  const wfWeightsHistory = []; // Para auditoría: array de {date, weights}

  let currentWF_w = null;
  let lastRebalMonth = -Infinity;
  let nReopt = 0;

  for (let t = startMonth; t < T; t++) {
    const shouldRebal =
      currentWF_w === null || (t - lastRebalMonth) >= rebalanceFreqMonths;

    if (shouldRebal) {
      const wnd = windowSigmaCorr(monthlyReturns, t - trailingWindow, t);
      if (!wnd) break;
      // Sustituye σ por el de la ventana en cada asset
      const tempAssets = optAssetsBase.map((a, i) => ({ ...a, vol: wnd.sigma[i] }));
      const result = runMarkowitz(customReturns, nSamplesPerOpt, tempAssets, wnd.corr);
      currentWF_w = result.neutra.w;
      lastRebalMonth = t;
      nReopt++;
      wfWeightsHistory.push({ date: monthlyDates[t], weights: currentWF_w.slice() });
    }

    // Apply month t's returns
    let r_wf = 0, r_hold = 0;
    for (let i = 0; i < N; i++) {
      r_wf += currentWF_w[i] * monthlyReturns[t][i];
      r_hold += baseWeights[i] * monthlyReturns[t][i];
    }
    const r_sp = monthlyReturns[t][spIndex];

    dates.push(monthlyDates[t]);
    wfEquity.push(wfEquity[wfEquity.length - 1] * (1 + r_wf));
    holdEquity.push(holdEquity[holdEquity.length - 1] * (1 + r_hold));
    spEquity.push(spEquity[spEquity.length - 1] * (1 + r_sp));
  }

  // Compute monthly returns from equity curves
  const monthlyRet = (eq) => {
    const r = [];
    for (let i = 1; i < eq.length; i++) r.push(eq[i] / eq[i - 1] - 1);
    return r;
  };
  const wfMR = monthlyRet(wfEquity);
  const holdMR = monthlyRet(holdEquity);
  const spMR = monthlyRet(spEquity);

  // Metrics per line
  const meanMR = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdMR = (arr) => {
    const m = meanMR(arr);
    return Math.sqrt(arr.reduce((a, r) => a + (r - m) ** 2, 0) / arr.length);
  };
  const computeMetrics = (eq, mr, isBenchmark = false) => {
    const yrs = mr.length / 12;
    const cagr = Math.pow(eq[eq.length - 1] / V0, 1 / yrs) - 1;
    const vol = stdMR(mr) * Math.sqrt(12);
    const sharpe = vol > 0 ? (cagr - RISK_FREE) / vol : 0;
    // Max drawdown
    let peak = -Infinity, maxDD = 0;
    for (const v of eq) {
      if (v > peak) peak = v;
      const dd = v / peak - 1;
      if (dd < maxDD) maxDD = dd;
    }
    const beta = isBenchmark ? 1 : computeBeta(mr, spMR);
    return { finalV: eq[eq.length - 1], cagr, vol, sharpe, maxDD, beta };
  };

  return {
    dates,
    wfEquity, holdEquity, spEquity,
    wfMonthly: wfMR, holdMonthly: holdMR, spMonthly: spMR,
    wfWeightsHistory,
    finalWF_w: currentWF_w,
    baseWeights: baseWeights.slice(),
    nReopt,
    metrics: {
      wf: computeMetrics(wfEquity, wfMR),
      hold: computeMetrics(holdEquity, holdMR),
      sp: computeMetrics(spEquity, spMR, true),
    },
  };
}

// 1-year parametric VaR & Expected Shortfall (loss-positive convention)
function riskMetrics(mu, sigma, alpha) {
  // VaR = -(mu - z*sigma) at confidence alpha (e.g. 0.95)
  const z = normInv(alpha);
  const VaR = z * sigma - mu;
  // ES (parametric, normal): -mu + sigma * phi(z) / (1 - alpha)
  const ES = sigma * normPdf(z) / (1 - alpha) - mu;
  return { VaR, ES };
}

// Effective beta vs blended benchmark (S&P for USD, EPU for PEN)
function effectiveBeta(w, assets = ASSETS, corr = C) {
  const n = assets.length;
  // Using corr * (sigma_p / sigma_bm) as a clean approximation
  // First compute USD weight and PEN weight
  let wUSD = 0, wPEN = 0;
  for (let i = 0; i < n; i++) {
    if (assets[i].cur === "USD") wUSD += w[i]; else wPEN += w[i];
  }
  // Approximate covariance with each benchmark
  // Treat cspx (idx 0) as USD benchmark, epu (idx 12) as PEN benchmark
  let covUSD = 0, covPEN = 0;
  for (let i = 0; i < n; i++) {
    covUSD += w[i] * assets[i].vol * assets[0].vol * corr[i][0];
    covPEN += w[i] * assets[i].vol * assets[12].vol * corr[i][12];
  }
  const betaUSD = assets[0].vol > 0 ? covUSD / (assets[0].vol * assets[0].vol) : 0;
  const betaPEN = assets[12].vol > 0 ? covPEN / (assets[12].vol * assets[12].vol) : 0;
  return wUSD * betaUSD + wPEN * betaPEN;
}

// Log-normal terminal value percentile (analytical, no MC needed)
// Returns the p-th percentile of V_T / V_0 given annual mu, sigma, horizon T
function lognormalPercentile(mu, sigma, T, p) {
  // Under GBM: log(V_T/V_0) ~ N((mu - sigma^2/2)*T, sigma^2 * T)
  const drift = (mu - 0.5 * sigma * sigma) * T;
  const std = sigma * Math.sqrt(T);
  const z = normInv(p);
  return Math.exp(drift + std * z);
}

// CAGR for a given multiple over T years
function cagrFromMultiple(m, T) {
  if (m <= 0) return -1;
  return Math.pow(m, 1 / T) - 1;
}

// ============================================================
// MONTE CARLO for path-dependent calculations (pignoración)
// Uses yearly steps and PORTFOLIO-LEVEL (not asset-level)
// returns drawn from log-normal aligned with mu, sigma.
// ============================================================
function simulatePaths({ mu, sigma, T, N: nSims = 2000, V0 = 10000 }) {
  const paths = new Array(nSims);
  for (let s = 0; s < nSims; s++) {
    const path = new Float64Array(T + 1);
    path[0] = V0;
    for (let t = 1; t <= T; t++) {
      const z = randn();
      // log-return for year t
      const lr = (mu - 0.5 * sigma * sigma) + sigma * z;
      path[t] = path[t-1] * Math.exp(lr);
    }
    paths[s] = path;
  }
  return paths;
}

// ============================================================
// LEVERAGED SIM v4 — modelo "apalancamiento + retiro con piso y techo"
//
// El usuario aporta V_propio. Se pide préstamo L_0 = leverage × V_propio
// y se invierte TODO en la cartera: V_invertido_0 = V_propio × (1 + leverage).
//
// El retiro anual es el MENOR entre dos cantidades:
//   - tasa × NW_t    (% del patrimonio neto al cierre de cada año)
//   - W_desired      (monto en USD fijo, el techo absoluto)
//
// Esto significa:
//   - En años tempranos (NW bajo), domina la tasa → retiros pequeños
//   - Cuando la cartera crece y tasa × NW > W_desired → se aplica el techo
//   - Esto preserva la cartera al principio y respeta tu objetivo al final
//
// Mecánica anual (paso t → t+1):
//   1. V_{t+1} = V_t × exp((μ − σ²/2) + σ·Z) + DCA_anual
//   2. NW_{t+1} = V_{t+1} − L_t                           ← antes del retiro
//   3. W_{t+1} = min(withdrawalRate × NW, W_desired)      ← el menor
//   4. L_{t+1} = L_t × (1 + intRate) + W_{t+1}            ← préstamo crece
//   5. Margin call si L_{t+1} / V_{t+1} > maintenanceLTV
//
// SANITY CHECK: con leverage=0, W_desired=0 → la mediana de NW final coincide
// con el escenario neutro de la pestaña horizonte: V₀ × exp((μ − σ²/2) × T)
// ============================================================
function runLeveragedSim({
  mu, sigma, T, V0Propio = 10000,
  leverage = 0.30, intRate = 0.045,
  maintenanceLTV = 0.70,
  withdrawalMonthly = 0,
  withdrawalRate = 0.04,
  dcaMonthly = 0,
  N = 3000,
}) {
  // Estado inicial
  const L0 = leverage * V0Propio;
  const V0 = V0Propio * (1 + leverage);
  const W_desired_annual = (withdrawalMonthly || 0) * 12;
  const dcaAnnual = (dcaMonthly || 0) * 12;
  const drift = mu - 0.5 * sigma * sigma;
  const diff = sigma;

  // Box–Muller pair-cached
  let _spare = null;
  function randn() {
    if (_spare !== null) { const r = _spare; _spare = null; return r; }
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));
    _spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  }

  // Per-year arrays
  const V_t = Array.from({ length: T + 1 }, () => new Array(N));
  const L_t = Array.from({ length: T + 1 }, () => new Array(N));
  const NW_t = Array.from({ length: T + 1 }, () => new Array(N));
  const W_t = Array.from({ length: T + 1 }, () => new Array(N));
  const LTV_t = Array.from({ length: T + 1 }, () => new Array(N));

  let mcCount = 0;
  const mcYears = [];

  for (let s = 0; s < N; s++) {
    let V = V0, L = L0;
    V_t[0][s] = V; L_t[0][s] = L; NW_t[0][s] = V - L;
    W_t[0][s] = 0; LTV_t[0][s] = V > 0 ? L / V : Infinity;
    let mcTriggered = false;
    let mcAt = -1;
    for (let t = 1; t <= T; t++) {
      const Z = randn();
      // Cartera: GBM + DCA
      const V_new = V * Math.exp(drift + diff * Z) + dcaAnnual;
      // NW post-crecimiento, pre-retiro
      const NW_pre = V_new - L;
      // Retiro: el MENOR entre tasa×NW y monto deseado
      const W_rate = withdrawalRate * Math.max(NW_pre, 0);
      const W = Math.max(0, Math.min(W_rate, W_desired_annual));
      // Préstamo: interés + retiro nuevo
      const L_new = L * (1 + intRate) + W;
      V = V_new; L = L_new;
      V_t[t][s] = V; L_t[t][s] = L; NW_t[t][s] = V - L;
      W_t[t][s] = W; LTV_t[t][s] = V > 0 ? L / V : Infinity;
      if (!mcTriggered && L / V > maintenanceLTV) {
        mcTriggered = true; mcAt = t;
      }
    }
    if (mcTriggered) { mcCount++; mcYears.push(mcAt); }
  }

  function percentiles(arr, ps = [0.10, 0.50, 0.90]) {
    const sorted = arr.slice().sort((a, b) => a - b);
    return ps.map(p => sorted[Math.floor(sorted.length * p)]);
  }

  const yearStats = [];
  for (let t = 0; t <= T; t++) {
    const [v10, v50, v90] = percentiles(V_t[t]);
    const [l10, l50, l90] = percentiles(L_t[t]);
    const [w10, w50, w90] = percentiles(W_t[t]);
    const [ltv10, ltv50, ltv90, ltv99] = percentiles(LTV_t[t], [0.10, 0.50, 0.90, 0.99]);
    const [nw1, nw10, nw25, nw50, nw75, nw90, nw99] = percentiles(NW_t[t], [0.01, 0.10, 0.25, 0.50, 0.75, 0.90, 0.99]);
    yearStats.push({
      year: t,
      v_p10: v10, v_p50: v50, v_p90: v90,
      l_p10: l10, l_p50: l50, l_p90: l90,
      nw_p1: nw1, nw_p10: nw10, nw_p25: nw25, nw_p50: nw50, nw_p75: nw75, nw_p90: nw90, nw_p99: nw99,
      w_p10: w10, w_p50: w50, w_p90: w90,
      ltv_p10: ltv10 * 100, ltv_p50: ltv50 * 100, ltv_p90: ltv90 * 100, ltv_p99: ltv99 * 100,
    });
  }

  const [nw10F, nw50F, nw90F] = percentiles(NW_t[T]);
  const [v10F, v50F, v90F] = percentiles(V_t[T]);
  const [l10F, l50F, l90F] = percentiles(L_t[T]);

  const avgW = new Array(N);
  for (let s = 0; s < N; s++) {
    let sum = 0;
    for (let t = 1; t <= T; t++) sum += W_t[t][s];
    avgW[s] = sum / T;
  }
  const [w10A, w50A, w90A] = percentiles(avgW);

  return {
    V0Propio, L0, V0,
    T,
    W_desired_annual,
    mcProb: mcCount / N,
    avgMCTime: mcYears.length ? mcYears.reduce((a, b) => a + b, 0) / mcYears.length : null,
    netPatrimony_p10: nw10F, netPatrimony_p50: nw50F, netPatrimony_p90: nw90F,
    valueFinal_p10: v10F, valueFinal_p50: v50F, valueFinal_p90: v90F,
    loanFinal_p10: l10F, loanFinal_p50: l50F, loanFinal_p90: l90F,
    avgWithdrawal_p10: w10A, avgWithdrawal_p50: w50A, avgWithdrawal_p90: w90A,
    yearStats,
  };
}

// ============================================================
// CONFIDENCE TABLE v5 — PATH SHARING para speedup ~3-5×
//
// Como V (cartera) no depende del retiro W (V solo crece por GBM + DCA),
// los V_paths se pueden generar UNA SOLA VEZ y reusar para todos los
// niveles del grid. Solo la dinámica del loan/retiro varía entre niveles.
//
// Esto reduce el costo de O(grid × N × T × ops_completas) a
// O(N × T × ops_GBM + grid × N × T × ops_loan).
// ============================================================
function runLeveragedConfidenceTable({
  mu, sigma, T, V0Propio = 10000,
  leverage = 0.30, intRate = 0.045,
  maintenanceLTV = 0.70,
  withdrawalRate = 0.04,
  dcaMonthly = 0,
  N = 1500,
}) {
  const annualPcts = [];
  for (let p = 0;     p <= 0.005 - 1e-9; p += 0.0005) annualPcts.push(Math.round(p * 100000) / 100000);
  for (let p = 0.005; p <= 0.08  + 1e-9; p += 0.0025) annualPcts.push(Math.round(p * 10000) / 10000);

  const L0 = leverage * V0Propio;
  const V0 = V0Propio * (1 + leverage);
  const dcaAnnual = (dcaMonthly || 0) * 12;
  const drift = mu - 0.5 * sigma * sigma;
  const diff = sigma;

  // Box–Muller con cache
  let _spare = null;
  function randn() {
    if (_spare !== null) { const r = _spare; _spare = null; return r; }
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));
    _spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  }

  // Pre-generar V paths una sola vez (independientes del nivel de retiro)
  // Float64Array es más rápido que Array regular para acceso secuencial
  const Vpaths = new Float64Array(N * (T + 1));
  for (let s = 0; s < N; s++) {
    Vpaths[s * (T + 1)] = V0;
    let V = V0;
    for (let t = 1; t <= T; t++) {
      V = V * Math.exp(drift + diff * randn()) + dcaAnnual;
      Vpaths[s * (T + 1) + t] = V;
    }
  }

  const rows = [];
  for (const annualPct of annualPcts) {
    const W_yearDesired = V0Propio * annualPct;
    const W_monthDesired = W_yearDesired / 12;

    let mcCount = 0;
    const netFinal = new Float64Array(N);
    const avgW = new Float64Array(N);

    for (let s = 0; s < N; s++) {
      let L = L0;
      let wSum = 0;
      let mcTriggered = false;
      const sOffset = s * (T + 1);
      for (let t = 1; t <= T; t++) {
        const V = Vpaths[sOffset + t];
        const NW_pre = V - L;
        const W_rate = withdrawalRate * (NW_pre > 0 ? NW_pre : 0);
        const W = W_rate < W_yearDesired ? W_rate : W_yearDesired;
        wSum += W;
        L = L * (1 + intRate) + W;
        if (!mcTriggered && L / V > maintenanceLTV) mcTriggered = true;
      }
      if (mcTriggered) mcCount++;
      netFinal[s] = Vpaths[sOffset + T] - L;
      avgW[s] = wSum / T;
    }

    // Percentiles
    const netSorted = Array.from(netFinal).sort((a, b) => a - b);
    const wSorted = Array.from(avgW).sort((a, b) => a - b);
    const mcProb = mcCount / N;
    rows.push({
      annualPct,
      W_monthDesired,
      W_yearDesired,
      W_yearActual_p50: wSorted[Math.floor(N * 0.5)],
      mcProb,
      confidence: 1 - mcProb,
      passes99: mcProb <= 0.01,
      passes95: mcProb <= 0.05,
      passes90: mcProb <= 0.10,
      netFinal_p10: netSorted[Math.floor(N * 0.1)],
      netFinal_p50: netSorted[Math.floor(N * 0.5)],
      netFinal_p90: netSorted[Math.floor(N * 0.9)],
    });
  }
  const maxAt = (threshold) => {
    let best = null;
    for (const r of rows) {
      if (r.mcProb <= threshold) best = r;
      else break;
    }
    return best;
  };
  return {
    rows,
    max99: maxAt(0.01),
    max95: maxAt(0.05),
    max90: maxAt(0.10),
  };
}

// ============================================================
// MARGIN CALL CURVES v5 — 5 niveles FIJOS del 1% al 5% V₀ anual.
// Para cada nivel, devuelve la trayectoria de LTV mediana (p50) Y p90
// (escenario estresado). El umbral de margin call se cruza en p50 si
// el escenario típico ya es insostenible; se cruza en p90 si el 10%
// peor de paths lo es. La diferencia entre p50 y p90 es el "rango" de
// riesgo asociado a ese retiro.
// ============================================================
function runMarginCallCurves({
  mu, sigma, T, V0Propio = 10000,
  leverage = 0.30, intRate = 0.045,
  maintenanceLTV = 0.70,
  withdrawalRate = 0.04,
  dcaMonthly = 0,
  N = 2000,
}) {
  // GRID FIJO — no depende del monto deseado del usuario
  const annualPcts = [0.01, 0.02, 0.03, 0.04, 0.05];
  const monthlyAmounts = annualPcts.map(p => V0Propio * p / 12);

  return monthlyAmounts.map((monthly, idx) => {
    const sim = runLeveragedSim({
      mu, sigma, T, V0Propio, leverage, intRate, maintenanceLTV,
      withdrawalMonthly: monthly,
      withdrawalRate, dcaMonthly, N,
    });
    const mcLTVPct = maintenanceLTV * 100;
    let crossYearP50 = null;
    let crossYearP99 = null;
    for (let t = 1; t < sim.yearStats.length; t++) {
      if (crossYearP50 === null && sim.yearStats[t].ltv_p50 >= mcLTVPct) crossYearP50 = t;
      if (crossYearP99 === null && sim.yearStats[t].ltv_p99 >= mcLTVPct) crossYearP99 = t;
    }
    return {
      monthly,
      annualPct: annualPcts[idx],
      yearlyDesired: monthly * 12,
      label: fmtPctStatic(annualPcts[idx], 0) + " V₀",
      mcProb: sim.mcProb,
      crossYearMedian: crossYearP50,
      crossYearStress: crossYearP99,
      yearStats: sim.yearStats,
      netFinal_p50: sim.netPatrimony_p50,
      avgWithdrawal_p50: sim.avgWithdrawal_p50,
      ltv_p50_final: sim.yearStats[T]?.ltv_p50 ?? 0,
      ltv_p99_final: sim.yearStats[T]?.ltv_p99 ?? 0,
    };
  });
}
function fmtPctStatic(x, dec = 1) {
  return (x * 100).toFixed(dec) + "%";
}

// ============================================================
// MARKOWITZ OPTIMIZATION via constrained random sampling
// We sample feasible portfolios respecting min/max bounds and
// sum=1, then identify three efficient frontier points:
//   - Min Variance  (Conservadora)
//   - Max Sharpe    (Neutra / Tangencial)
//   - Max Return    (Agresiva)
// 15,000-20,000 samples gives a tight cloud around the frontier.
// ============================================================
function randomFeasiblePortfolio(assets = ASSETS) {
  const n = assets.length;
  // Start at minimum weights, distribute remaining capacity randomly
  const w = assets.map(a => a.minW);
  let extra = 1 - w.reduce((a, b) => a + b, 0);
  if (extra < 0) {
    // Infeasible: sum of mins > 1. Should not happen with our bounds.
    return null;
  }
  // Shuffle order so allocation isn't biased by index
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const i of order) {
    const headroom = assets[i].maxW - w[i];
    if (headroom <= 0) continue;
    const cap = Math.min(headroom, extra);
    // Random bias toward distributing more in early picks
    const alloc = Math.random() * cap;
    w[i] += alloc;
    extra -= alloc;
    if (extra <= 0.0001) break;
  }
  // If we still have extra, distribute proportionally to remaining headroom
  let safety = 0;
  while (extra > 0.0005 && safety < 10) {
    let totalHeadroom = 0;
    for (let i = 0; i < n; i++) totalHeadroom += Math.max(0, assets[i].maxW - w[i]);
    if (totalHeadroom < 0.0005) break;
    for (let i = 0; i < n; i++) {
      const hr = assets[i].maxW - w[i];
      if (hr > 0) w[i] += extra * (hr / totalHeadroom);
    }
    extra = 1 - w.reduce((a, b) => a + b, 0);
    safety++;
  }
  return w;
}

function runMarkowitz(effRet, nSamples = 15000, assets = ASSETS, corr = C) {
  const n = assets.length;
  const samples = [];
  let minVarIdx = -1, maxSharpeIdx = -1, maxRetIdx = -1;
  let minVar = Infinity, maxSharpe = -Infinity, maxRet = -Infinity;
  for (let s = 0; s < nSamples; s++) {
    const w = randomFeasiblePortfolio(assets);
    if (!w) continue;
    const { mu, sigma } = portfolioMoments(w, effRet, assets, corr);
    const sharpe = sigma > 0 ? (mu - RISK_FREE) / sigma : 0;
    samples.push({ w, mu, sigma, sharpe });
    if (sigma < minVar) { minVar = sigma; minVarIdx = samples.length - 1; }
    if (sharpe > maxSharpe) { maxSharpe = sharpe; maxSharpeIdx = samples.length - 1; }
    if (mu > maxRet) { maxRet = mu; maxRetIdx = samples.length - 1; }
  }
  // Local refinement: try pair-swaps to improve each optimum
  const refine = (start, objective, maximize = true) => {
    let best = { w: start.w.slice(), score: objective(start.w) };
    let improved = true;
    let iters = 0;
    const step = 0.01;
    while (improved && iters < 50) {
      improved = false;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          // Try moving `step` from i to j
          const headroomJ = assets[j].maxW - best.w[j];
          const headroomI = best.w[i] - assets[i].minW;
          const shift = Math.min(step, headroomI, headroomJ);
          if (shift <= 0) continue;
          const trial = best.w.slice();
          trial[i] -= shift; trial[j] += shift;
          const score = objective(trial);
          if ((maximize && score > best.score) || (!maximize && score < best.score)) {
            best = { w: trial, score };
            improved = true;
          }
        }
      }
      iters++;
    }
    const { mu, sigma } = portfolioMoments(best.w, effRet, assets, corr);
    return { w: best.w, mu, sigma, sharpe: sigma > 0 ? (mu - RISK_FREE) / sigma : 0 };
  };
  const conservadora = refine(samples[minVarIdx], w => portfolioMoments(w, effRet, assets, corr).sigma, false);
  const neutra = refine(samples[maxSharpeIdx], w => {
    const { mu, sigma } = portfolioMoments(w, effRet, assets, corr);
    return sigma > 0 ? (mu - RISK_FREE) / sigma : 0;
  }, true);

  // AGRESIVA: target μ = Neutra.mu × 1.30 (30% más retorno que la Neutra),
  // minimizando varianza para ese target. Si el target es inalcanzable
  // (todas las samples están debajo), cae a la cartera de máximo retorno.
  const targetMu = neutra.mu * 1.30;
  const candidatesAtTarget = samples.filter(s => s.mu >= targetMu);
  let agresiva;
  if (candidatesAtTarget.length > 0) {
    // Tomar el sample con menor σ entre los que cumplen el target
    const startSample = candidatesAtTarget.reduce((best, s) => s.sigma < best.sigma ? s : best, candidatesAtTarget[0]);
    // Refinar: minimizar σ manteniendo μ >= target (penaliza con Infinity si baja del target)
    agresiva = refine(startSample, w => {
      const { mu, sigma } = portfolioMoments(w, effRet, assets, corr);
      if (mu < targetMu) return Infinity;
      return sigma;
    }, false);
  } else {
    // Target inalcanzable → caer al máximo retorno (con flag para UI)
    agresiva = refine(samples[maxRetIdx], w => portfolioMoments(w, effRet, assets, corr).mu, true);
    agresiva.targetUnreachable = true;
  }
  agresiva.targetMu = targetMu;
  // Subsample for chart (3,000 points is plenty)
  const chartSamples = [];
  const stride = Math.max(1, Math.floor(samples.length / 3000));
  for (let i = 0; i < samples.length; i += stride) {
    chartSamples.push({ x: samples[i].sigma, y: samples[i].mu, sh: samples[i].sharpe });
  }
  // SearchPool: todas las samples con weights (para el picker por objetivo).
  // ~30k portafolios → ~480k floats ≈ 4MB de RAM, perfectamente manejable.
  // Cada entrada conserva su vector w (16 pesos) + (mu, sigma, sharpe) precomputados.
  const searchPool = samples;

  // Bounds de la nube: lo que el slider del picker puede targetear.
  let muMin = Infinity, muMax = -Infinity, sigmaMin = Infinity, sigmaMax = -Infinity;
  for (const s of samples) {
    if (s.mu < muMin) muMin = s.mu;
    if (s.mu > muMax) muMax = s.mu;
    if (s.sigma < sigmaMin) sigmaMin = s.sigma;
    if (s.sigma > sigmaMax) sigmaMax = s.sigma;
  }
  const bounds = { muMin, muMax, sigmaMin, sigmaMax };

  return { samples: chartSamples, searchPool, bounds, conservadora, neutra, agresiva };
}

// ============================================================
// PICKER POR OBJETIVO (constrained optimization)
// Dado el searchPool (~30k portafolios feasible) y un objetivo del usuario:
//   - mode "mu":    el usuario fija un retorno mínimo μ_target
//                   → devolvemos el portafolio con MENOR σ entre los que cumplen
//                     μ ≥ μ_target (= mismo punto que max Sharpe sobre la frontera).
//   - mode "sigma": el usuario fija una volatilidad máxima σ_target
//                   → devolvemos el portafolio con MAYOR μ entre los que cumplen
//                     σ ≤ σ_target.
// En ambos modos arrancamos del mejor sample del pool y opcionalmente refinamos
// con pair-swaps locales (1% de step, hasta 30 iters) para apretar el resultado.
// El cómputo es O(N) en el pool + refinamiento corto → ~5-20ms total.
// ============================================================
function findOptimalForTarget({ searchPool, effRet, assets, corr, mode, target, refine: doRefine = true }) {
  if (!searchPool || searchPool.length === 0) return null;
  // 1. Filtrar candidatos que cumplen la restricción
  const candidates = mode === "mu"
    ? searchPool.filter(s => s.mu >= target)
    : searchPool.filter(s => s.sigma <= target);
  if (candidates.length === 0) return { infeasible: true, mode, target };

  // 2. Mejor sample inicial del pool
  //    - mode "mu":    min σ (= max Sharpe en la frontera, "menor desv estándar posible")
  //    - mode "sigma": max μ (= mejor rentabilidad con esa vol como techo)
  let best;
  if (mode === "mu") {
    best = candidates[0];
    for (const s of candidates) if (s.sigma < best.sigma) best = s;
  } else {
    best = candidates[0];
    for (const s of candidates) if (s.mu > best.mu) best = s;
  }

  // 3. Refinamiento local: pair-swaps de 1% para mejorar el objetivo respetando la restricción
  if (!doRefine) {
    return { w: best.w.slice(), mu: best.mu, sigma: best.sigma, sharpe: (best.mu - RISK_FREE) / Math.max(best.sigma, 1e-9) };
  }
  const n = assets.length;
  let curW = best.w.slice();
  let curM = portfolioMoments(curW, effRet, assets, corr);
  const score = (w, m) => {
    if (mode === "mu") {
      if (m.mu < target - 1e-9) return Infinity;  // no cumple → descartar
      return m.sigma;                              // queremos min σ
    } else {
      if (m.sigma > target + 1e-9) return Infinity; // no cumple
      return -m.mu;                                  // queremos max μ → min (-μ)
    }
  };
  let curScore = score(curW, curM);
  const step = 0.01;
  for (let iter = 0; iter < 30; iter++) {
    let improved = false;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const headroomJ = assets[j].maxW - curW[j];
        const headroomI = curW[i] - assets[i].minW;
        const shift = Math.min(step, headroomI, headroomJ);
        if (shift <= 0) continue;
        const trial = curW.slice();
        trial[i] -= shift; trial[j] += shift;
        const tm = portfolioMoments(trial, effRet, assets, corr);
        const ts = score(trial, tm);
        if (ts < curScore - 1e-9) {
          curW = trial;
          curM = tm;
          curScore = ts;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return {
    w: curW,
    mu: curM.mu,
    sigma: curM.sigma,
    sharpe: curM.sigma > 0 ? (curM.mu - RISK_FREE) / curM.sigma : 0,
  };
}

// ============================================================
// UI HELPERS
// ============================================================
const fmtPct = (x, digits = 2) => (x * 100).toFixed(digits) + "%";
const fmtUsd = (x) => "$" + Math.round(x).toLocaleString("en-US");
// Compact USD formatter for chart axes — e.g. $1.5M, $250k
const fmtUsdCompact = (x) => {
  const a = Math.abs(x);
  if (a >= 1e6) return "$" + (x / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
  if (a >= 1e3) return "$" + (x / 1e3).toFixed(0) + "k";
  return "$" + Math.round(x);
};
const fmtUsdK = (x) => "$" + (x / 1000).toFixed(1) + "k";

// ============================================================
// PRESET PORTFOLIOS
// ============================================================
const PRESETS = {
  balanceada: {
    name: "Balanceada (default)",
    weights: ASSETS.map(a => a.defW),
  },
  conservadora: {
    name: "Conservadora",
    weights: [0.08, 0.04, 0.08, 0.02, 0.01, 0.08, 0.10, 0.08, 0.10, 0.01, 0.08, 0.08, 0.03, 0.06, 0.07, 0.08],
  },
  agresiva: {
    name: "Agresiva",
    weights: [0.22, 0.14, 0.12, 0.05, 0.05, 0.04, 0.04, 0.02, 0.03, 0.05, 0.01, 0.01, 0.08, 0.04, 0.05, 0.05],
  },
  marketcap: {
    name: "Beta de mercado (Bogle)",
    weights: [0.25, 0.05, 0.20, 0.00, 0.00, 0.05, 0.10, 0.05, 0.10, 0.00, 0.05, 0.05, 0.05, 0.05, 0.00, 0.00],
  },
};

// Normalize a weight vector so it sums to 1 (respecting current proportions)
function normalize(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.slice();
  return weights.map(w => w / sum);
}

// ============================================================
// PYTHON SCRIPT — descarga + genera JSON + 3 CSVs para Excel
// {GROWTH} y {VALUE} se reemplazan en runtime con los tickers Value/Growth elegidos
// ============================================================
const DOWNLOAD_PY_TEMPLATE = `"""
download_data.py — VERSION 2026-05-24 (con ticker_meta + monthly_returns)

Schema JSON que produce:
  meta, sigma, histRet, hist_1y_min, damodaran, analyst_consensus,
  ticker_meta, monthly_returns, monthly_dates, beta_sp, beta_epu,
  var_95, var_99, es_95, es_99, correlation, asset_keys

Si tu calculadora muestra el badge dorado "⚠ JSON sin: ticker_meta, ...",
significa que NO estás corriendo ESTE archivo. Para verificar:
  grep -c "_fetch_ticker_meta" download_data.py
Debería decir al menos 2. Si dice 0, es una version vieja — reemplazá el archivo.

Salidas en el mismo folder:
  - yfinance_results.json       <- cargalo en la calculadora web
  - yfinance_summary.csv        <- metricas por activo (Excel)
  - yfinance_correlation.csv    <- matriz 16x16 (Excel)
  - yfinance_prices.csv         <- precios diarios crudos
  - yfinance_monthly_returns.csv  <- retornos mensuales (alimenta el backtest historico real)

Uso:
  pip install yfinance pandas numpy
  python download_data.py

EDITAR UNA VEZ AL ANIO (cuando Damodaran publique en enero):
  - bloque DAMODARAN_EXPECTED_RETURNS (linea ~70)
  - opcional: BTC_CONSENSUS_FALLBACK si quieres mover el rango de Bitcoin

Fuentes para actualizar Damodaran:
  https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/wacc.htm
  https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html
"""
import json
import sys
from datetime import datetime, timedelta
import warnings

import numpy as np
import pandas as pd
import yfinance as yf

warnings.filterwarnings("ignore")

# ============================================================
# EDITA AQUI los tickers Value y Growth (como en Yahoo Finance)
# ============================================================
GROWTH_TICKER = "MSFT"
VALUE_TICKER  = "UBER"
# ============================================================

# Orden CANONICO de los 16 activos (debe coincidir con la calculadora React)
ASSET_KEYS = [
    "cspx", "cndx", "iwda", "msft", "uber", "igln", "vtc", "bil", "ief", "btc",
    "ibsav", "cdusd", "epu", "pensov", "pfpen", "savpen",
]

ASSET_NAMES = {
    "cspx":   "ETF S&P 500",
    "cndx":   "ETF Nasdaq 100",
    "iwda":   "ETF Developed ex USA",
    "msft":   "Stock Growth",
    "uber":   "Stock Value",
    "igln":   "ETF Gold",
    "vtc":    "ETF Bonos Corp USD",
    "bil":    "ETF Treasury 0-3M",
    "ief":    "ETF Treasury 10Y",
    "btc":    "Bitcoin",
    "ibsav":  "Cuenta Ahorros IB (USD)",
    "cdusd":  "Plazo Fijo CD (USD)",
    "epu":    "ETF Peru (proxy RV)",
    "pensov": "Bonos Soberanos PEN (sint)",
    "pfpen":  "Plazo Fijo PEN",
    "savpen": "Cuenta Ahorros PEN",
}

# ============================================================
# DAMODARAN — EXPECTED RETURNS POR ACTIVO (actualizar cada enero)
# ============================================================
# Fuente: Damodaran online — Total Cost of Equity por industria, USA y emergentes.
#   https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/wacc.htm
#
# Mapping (basado en enero 2025, ajustar segun nueva publicacion):
#   cspx  -> Total Market US                         ~8.5%
#   cndx  -> Software/Tech (Nasdaq 100 weighted)     ~9.5%
#   iwda  -> Global Equity Average                   ~8.0%
#   msft  -> Software (System & Application)         ~9.0%
#   uber  -> Transportation (Trucking + Software)    ~10.0%
#   igln  -> Commodity (Gold proxy)                  ~5.0%
#   vtc   -> Corporate Bond Cost of Debt             ~5.5%
#   bil   -> 3M T-Bill yield (matches Rf actual)     ~4.5%
#   ief   -> 10Y T-Bond yield (matches Rf actual)    ~4.3%
#   btc   -> No-coverage (Damodaran personalmente lo evita) — alto premium ~12%
#   epu   -> Emerging Equity con country risk Peru   ~12.0%
#   pensov -> Bono Soberano Peru                     ~6.0%
#   cash/PF -> mismo que su retorno fijo (sin premium)
DAMODARAN_EXPECTED_RETURNS = {
    "cspx":   0.085,
    "cndx":   0.095,
    "iwda":   0.080,
    "msft":   0.090,
    "uber":   0.100,
    "igln":   0.050,
    "vtc":    0.055,
    "bil":    0.045,
    "ief":    0.043,
    "btc":    0.120,
    "ibsav":  0.015,
    "cdusd":  0.020,
    "epu":    0.120,
    "pensov": 0.060,
    "pfpen":  0.045,
    "savpen": 0.035,
}

# ============================================================
# FALLBACKS PARA CONSENSO DE ANALISTAS
# ============================================================
# yfinance solo expone analyst_price_targets para acciones individuales (msft, uber).
# Para ETFs y BTC no hay datos directos — usamos heuristica.
#
# Multiplicadores aplicados a Damodaran para construir low/mean/high cuando
# no hay datos reales de analistas:
EQUITY_ETF_BAND = (0.80, 1.00, 1.20)   # ±20% sobre Damodaran neutral
BOND_ETF_BAND_BPS = 0.005               # ±50 bps sobre Damodaran neutral

# Para BTC (sin coverage de analistas), rango ancho hardcodeado:
BTC_CONSENSUS_FALLBACK = {"low": -0.30, "mean": 0.25, "high": 0.80}

# Clasificacion para aplicar el fallback correcto a cada activo:
EQUITY_ETF_KEYS = {"cspx", "cndx", "iwda", "igln", "epu"}
BOND_ETF_KEYS   = {"vtc", "bil", "ief"}
STOCK_KEYS      = {"msft", "uber"}      # analyst_price_targets directo
CRYPTO_KEYS     = {"btc"}               # rango hardcoded
CASH_SYNTH_KEYS = {"ibsav", "cdusd", "pensov", "pfpen", "savpen"}

# ============================================================
# REAL TICKERS — los 11 que se descargan
# ============================================================
REAL_TICKERS = [
    ("cspx", "CSPX.L",  "IVV"),
    ("cndx", "CNDX.L",  "QQQ"),
    ("iwda", "EFA",     "VEA"),       # iShares MSCI EAFE (inception 2001, 24y). Fallback VEA (FTSE Dev ex US, 2007)
    ("msft", GROWTH_TICKER, None),
    ("uber", VALUE_TICKER,  None),
    ("igln", "IGLN.L",  "GLD"),
    ("vtc",  "LQDA.L",  "LQD"),      # iShares USD Corp Bond UCITS ETF Acc (era VTC)
    ("bil",  "ZPR1.L",  "IB01.L"),   # SPDR Treasury 0-1Y UCITS ETF Acc; fallback IB01 (era BIL)
    ("ief",  "CBU7.L",  "SXXB.L"),   # iShares $ Treasury 7-10Y UCITS ETF Acc; fallback SXXB (era IEF)
    ("btc",  "BTC-USD", None),
    ("epu",  "EPU",     None),
]
REAL_KEYS = [t[0] for t in REAL_TICKERS]

# histRet hardcoded de los 5 cash/sinteticos
STATIC_HISTRET = {
    "ibsav":  0.015,
    "cdusd":  0.020,
    "pensov": 0.045,
    "pfpen":  0.045,
    "savpen": 0.035,
}

# ============================================================
# SIGMA y CORRELACIONES SINTETICAS para activos sin ticker publico
# pero CON riesgo real (no son cash). Solo aplica a pensov por ahora.
# Estos valores se inyectan al output sobrescribiendo el 0.0 default
# de la rutina de calculo (que no puede medirlos por falta de data).
# Valores razonables: pensov σ≈7% similar a bonos soberanos EM
# duracion intermedia. Correlaciones derivadas de pares logicos
# (mucha con IEF y VTC, moderada con EPU, baja con equities).
# ============================================================
SYNTHETIC_SIGMAS = {
    "pensov": 0.07,
}
SYNTHETIC_CORRELATIONS = {
    "pensov": {
        "cspx": 0.15, "cndx": 0.10, "iwda": 0.18,
        "msft": 0.10, "uber": 0.10,
        "igln": 0.15,
        "vtc": 0.55, "bil": 0.20, "ief": 0.65,
        "btc": 0.05,
        "ibsav": 0.05, "cdusd": 0.05,
        "epu": 0.35,
        "pfpen": 0.15, "savpen": 0.15,
    },
}

OUTPUT_JSON         = "yfinance_results.json"
OUTPUT_SUMMARY_CSV  = "yfinance_summary.csv"
OUTPUT_CORR_CSV     = "yfinance_correlation.csv"
OUTPUT_PRICES_CSV   = "yfinance_prices.csv"
OUTPUT_MONTHLY_CSV  = "yfinance_monthly_returns.csv"


# ============================================================
# UTILIDADES
# ============================================================
def _extract_close(df):
    """yfinance >=0.2.40 devuelve MultiIndex en columnas incluso con un solo ticker."""
    if isinstance(df.columns, pd.MultiIndex):
        close = df.xs("Close", axis=1, level=0)
        if isinstance(close, pd.DataFrame):
            close = close.iloc[:, 0]
    else:
        close = df["Close"]
        if isinstance(close, pd.DataFrame):
            close = close.iloc[:, 0]
    return close


def _download_one(key, primary, fallback):
    end = datetime.now()
    start = end - timedelta(days=365 * 10 + 60)
    print(f"  {key:6s} {primary:10s}", end=" ", flush=True)
    last_err = None
    for tk in [primary, fallback]:
        if not tk:
            continue
        try:
            df = yf.download(tk, start=start, end=end, progress=False,
                             auto_adjust=True, threads=False)
            if df.empty or len(df) < 200:
                raise ValueError(f"only {len(df)} rows")
            ser = _extract_close(df)
            ser.name = key
            print(f"OK {len(ser)}d  ({tk})")
            return ser, tk
        except Exception as e:
            last_err = e
            print(f"FAIL({tk})", end=" ")
    print(f"   -> {last_err}")
    return None, None


def _compute_stats(log_rets, key, sp_r, ep_r):
    r = log_rets[key].dropna()
    sigma = float(r.std() * np.sqrt(252))
    n = len(r)
    cagr = float(np.exp(float(r.sum()) * 252 / n) - 1)

    def _beta(target):
        m = pd.concat([r, target], axis=1).dropna()
        if len(m) < 30 or m.iloc[:, 1].var() == 0:
            return 0.0
        return float(m.cov().iloc[0, 1] / m.iloc[:, 1].var())

    losses = -r
    var_95 = float(np.quantile(losses, 0.95))
    var_99 = float(np.quantile(losses, 0.99))
    es_95 = float(losses[losses >= var_95].mean()) if (losses >= var_95).any() else var_95
    es_99 = float(losses[losses >= var_99].mean()) if (losses >= var_99).any() else var_99

    return dict(sigma=sigma, histRet=cagr,
                beta_sp=_beta(sp_r), beta_epu=_beta(ep_r),
                var_95=var_95, var_99=var_99, es_95=es_95, es_99=es_99)


def _rolling_1y_min(log_rets, key):
    """Peor retorno acumulado de cualquier ventana de 252 dias, en terminos anualizados.

    Rolling sum de 252 daily log returns = log(P_t / P_{t-252}) = retorno log de 1 anio.
    Convertimos a retorno simple anualizado con exp(.) - 1.
    """
    r = log_rets[key].dropna()
    if len(r) < 252:
        return None
    rolling_log_1y = r.rolling(252).sum().dropna()
    rolling_ann = np.exp(rolling_log_1y) - 1
    return float(rolling_ann.min())


def _build_monthly_returns(prices_df):
    """Resamplea precios diarios a fin de mes y devuelve log-returns mensuales.

    Output: DataFrame (n_months x n_activos_descargados) con indice = fechas YYYY-MM-DD
    del ultimo dia habil de cada mes. PUEDE TENER NaN donde un activo no tenia data
    en ese mes (porque el ticker era mas joven que el inicio del periodo).
    """
    monthly_prices = prices_df.resample("ME").last()
    # NO hacemos dropna global: cada cell mantiene NaN si el activo no tenia data ese mes
    monthly_log_rets = np.log(monthly_prices / monthly_prices.shift(1))
    # Eliminar solo la primera fila (que siempre es NaN por el shift)
    monthly_log_rets = monthly_log_rets.iloc[1:]
    return monthly_log_rets


def _build_full_correlation(corr_real_df, present_keys):
    n = len(ASSET_KEYS)
    M = [[0.0] * n for _ in range(n)]
    for i in range(n):
        M[i][i] = 1.0
    for a in present_keys:
        for b in present_keys:
            ia, ib = ASSET_KEYS.index(a), ASSET_KEYS.index(b)
            M[ia][ib] = float(corr_real_df.loc[a, b])
    return M


# ============================================================
# CONSENSO DE ANALISTAS (yfinance + fallbacks)
# ============================================================
def _fetch_ticker_meta(ticker_symbol):
    """Lee nombre completo + descripcion del ticker via yfinance Ticker.info.
    Devuelve dict con longName, summary, sector, industry, currency, quote_type.
    Si falla (network, ticker no encontrado, etc), devuelve dict con strings vacios.
    """
    try:
        info = yf.Ticker(ticker_symbol).info or {}
        summary = (info.get("longBusinessSummary") or "").strip()
        # Algunos ETFs no tienen longBusinessSummary pero si description
        if not summary:
            summary = (info.get("description") or info.get("fundDescription") or "").strip()
        # Truncamos a 700 chars para no inflar el JSON con texto inutil
        summary = summary[:700]
        return {
            "longName":   info.get("longName") or info.get("shortName") or ticker_symbol,
            "summary":    summary,
            "sector":     info.get("sector") or info.get("categoryName") or "",
            "industry":   info.get("industry") or info.get("category") or info.get("fundFamily") or "",
            "currency":   info.get("currency") or "",
            "quote_type": info.get("quoteType") or "",
        }
    except Exception as e:
        print(f"     [warn] sin metadata para {ticker_symbol}: {e}")
        return {
            "longName": ticker_symbol,
            "summary": "",
            "sector": "",
            "industry": "",
            "currency": "",
            "quote_type": "",
        }


def _fetch_analyst_consensus_stock(ticker_symbol):
    """Para acciones individuales (MSFT, UBER): convierte price targets a retorno
    esperado a 12 meses. Devuelve None si yfinance no devuelve data utilizable.
    """
    try:
        t = yf.Ticker(ticker_symbol)
        # Intento 1: API nueva
        try:
            apt = t.analyst_price_targets  # propiedad, no metodo
        except Exception:
            apt = None

        if isinstance(apt, dict) and apt:
            current = apt.get("current") or apt.get("currentPrice")
            low     = apt.get("low")
            mean    = apt.get("mean")
            high    = apt.get("high")
        else:
            # Fallback al info dict legacy
            info = t.info or {}
            current = info.get("currentPrice") or info.get("regularMarketPrice")
            low     = info.get("targetLowPrice")
            mean    = info.get("targetMeanPrice")
            high    = info.get("targetHighPrice")

        if not (current and low and mean and high):
            return None
        if current <= 0:
            return None

        return {
            "low":  float(low  / current - 1),
            "mean": float(mean / current - 1),
            "high": float(high / current - 1),
            "source": "yfinance_analyst_targets",
            "current_price": float(current),
        }
    except Exception as e:
        print(f"     [warn] analyst targets failed: {e}")
        return None


def _build_consensus_for_asset(key, stats_block, used_ticker):
    """Devuelve {low, mean, high, source} para un activo, eligiendo la mejor fuente.

    Reglas:
      - stocks (msft, uber)     -> yfinance real, fallback a Damodaran ±20%
      - ETFs equity             -> Damodaran ±20%
      - ETFs bonos              -> Damodaran ±50bps
      - BTC                     -> rango hardcoded fijo
      - cash/sinteticos         -> mismo retorno fijo en los 3 campos
    """
    dmd = DAMODARAN_EXPECTED_RETURNS.get(key)

    if key in STOCK_KEYS and used_ticker:
        real = _fetch_analyst_consensus_stock(used_ticker)
        if real is not None:
            return real
        # fallback
        if dmd is None:
            return None
        return {"low": dmd * EQUITY_ETF_BAND[0], "mean": dmd, "high": dmd * EQUITY_ETF_BAND[2],
                "source": "damodaran_fallback_pm20"}

    if key in EQUITY_ETF_KEYS:
        if dmd is None:
            return None
        return {"low": dmd * EQUITY_ETF_BAND[0], "mean": dmd, "high": dmd * EQUITY_ETF_BAND[2],
                "source": "damodaran_pm20"}

    if key in BOND_ETF_KEYS:
        if dmd is None:
            return None
        return {"low": dmd - BOND_ETF_BAND_BPS, "mean": dmd, "high": dmd + BOND_ETF_BAND_BPS,
                "source": "damodaran_pm50bps"}

    if key in CRYPTO_KEYS:
        b = BTC_CONSENSUS_FALLBACK
        return {"low": b["low"], "mean": b["mean"], "high": b["high"],
                "source": "hardcoded_btc_wide_band"}

    if key in CASH_SYNTH_KEYS:
        fixed = STATIC_HISTRET.get(key, dmd or 0.0)
        return {"low": fixed, "mean": fixed, "high": fixed,
                "source": "fixed_rate_no_uncertainty"}

    return None


# ============================================================
# OUTPUTS (CSVs)
# ============================================================
def _write_summary_csv(out, used, path):
    """1 fila por activo con todas las metricas + consenso + Damodaran + min 1y."""
    rows = []
    for k in ASSET_KEYS:
        cons = out["analyst_consensus"].get(k) or {}
        rows.append({
            "key":               k,
            "name":              ASSET_NAMES.get(k, k),
            "ticker_used":       used.get(k, "(estatico)"),
            "sigma":             out["sigma"][k],
            "histRet":           out["histRet"][k],
            "hist_1y_min":       out["hist_1y_min"].get(k),
            "damodaran":         out["damodaran"][k],
            "consensus_low":     cons.get("low"),
            "consensus_mean":    cons.get("mean"),
            "consensus_high":    cons.get("high"),
            "consensus_source":  cons.get("source", "-"),
            "beta_sp":           out["beta_sp"][k],
            "beta_epu":          out["beta_epu"][k],
            "var_95":            out["var_95"][k],
            "var_99":            out["var_99"][k],
            "es_95":             out["es_95"][k],
            "es_99":             out["es_99"][k],
        })
    df = pd.DataFrame(rows)
    num_cols = ["sigma", "histRet", "hist_1y_min", "damodaran",
                "consensus_low", "consensus_mean", "consensus_high",
                "beta_sp", "beta_epu", "var_95", "var_99", "es_95", "es_99"]
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").round(6)
    df.to_csv(path, index=False)


def _write_correlation_csv(corr_matrix, path):
    df = pd.DataFrame(corr_matrix, index=ASSET_KEYS, columns=ASSET_KEYS)
    df = df.round(4)
    df.to_csv(path, index_label="asset")


def _write_prices_csv(prices_df, path):
    out = prices_df.copy()
    out.index.name = "date"
    out = out.round(4)
    out.to_csv(path)


def _write_monthly_csv(monthly_df, path):
    out = monthly_df.copy()
    out.index.name = "date"
    out = out.round(6)
    out.to_csv(path)


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 62)
    print("download_data.py · VERSION 2026-05-24 (ticker_meta + monthly + Damodaran)")
    print("=" * 62)
    print(f"Descargando {len(REAL_TICKERS)} tickers reales desde yfinance")
    print(f"  Growth (msft slot) = {GROWTH_TICKER}")
    print(f"  Value  (uber slot) = {VALUE_TICKER}")
    print("=" * 62)

    # ---- 1. Descargar precios ----
    data, used = {}, {}
    ticker_meta = {}
    for key, primary, fallback in REAL_TICKERS:
        ser, tk = _download_one(key, primary, fallback)
        if ser is not None:
            data[key] = ser
            used[key] = tk
            # Metadata (longName, summary, sector) — usa el ticker que efectivamente
            # cargó (puede ser el primary o el fallback).
            print(f"         metadata {tk:10s}", end=" ", flush=True)
            ticker_meta[key] = _fetch_ticker_meta(tk)
            ln = ticker_meta[key]["longName"]
            print(f"OK  {ln[:50]}")

    # =========================================================
    # CAMBIO DE FILOSOFIA: ya NO alineamos a la ventana comun.
    # Cada activo se computa sobre SUS PROPIAS fechas (hasta 10 anios).
    # Correlaciones y betas se calculan pair-wise (interseccion del par).
    # =========================================================

    # df: outer-join, NaN donde un ticker no tiene data en esa fecha
    df = pd.DataFrame(data)
    if df.empty:
        print("ERROR: no se pudo descargar ningun ticker.")
        sys.exit(1)

    # Log returns: NaN donde el ticker no tenia precio ese dia
    log_rets = np.log(df / df.shift(1))

    # Per-ticker years available
    years_available = {}
    for k in df.columns:
        n_days = int(log_rets[k].dropna().shape[0])
        years_available[k] = round(n_days / 252.0, 2)

    print(f"\\n{'='*62}")
    print("ESTADISTICOS PER-TICKER (cada uno sobre su propia ventana):")
    print(f"{'='*62}")
    print(f"  {'KEY':<8}{'TICKER':<12}{'DESDE':<13}{'AÑOS':>7}{'  DIAS':>10}")
    for k in df.columns:
        first = data[k].index[0].date()
        ya    = years_available[k]
        nd    = log_rets[k].dropna().shape[0]
        mark  = "  ✓" if ya >= 9.5 else ("  ~" if ya >= 5 else "  ⚠")
        print(f"  {k:<8}{used[k]:<12}{str(first):<13}{ya:>5.1f}y{nd:>10}{mark}")

    # Stats per-ticker: _compute_stats ya hace dropna() por columna internamente
    # y la beta usa pd.concat(...).dropna() para pair-wise.
    sp_r = log_rets["cspx"].dropna() if "cspx" in log_rets else pd.Series(dtype=float)
    ep_r = log_rets["epu"].dropna()  if "epu"  in log_rets else pd.Series(dtype=float)
    stats = {k: _compute_stats(log_rets, k, sp_r, ep_r) for k in df.columns}

    def metric(name):
        out = {k: stats[k][name] for k in df.columns}
        return {k: float(out.get(k, 0.0)) for k in ASSET_KEYS}

    sigma_all   = metric("sigma")
    histRet_all = metric("histRet")
    for k, v in STATIC_HISTRET.items():
        histRet_all[k] = v
    # Override σ de activos sinteticos riesgosos (pensov tiene σ≈7%, no 0)
    for k, v in SYNTHETIC_SIGMAS.items():
        sigma_all[k] = v

    # ---- Rolling 1y minimo per-ticker (en su propia ventana) ----
    hist_1y_min = {}
    for k in df.columns:
        v = _rolling_1y_min(log_rets, k)
        hist_1y_min[k] = v if v is not None else float("nan")
    for k in CASH_SYNTH_KEYS:
        hist_1y_min[k] = STATIC_HISTRET.get(k, 0.0)
    hist_1y_min_full = {k: float(hist_1y_min.get(k, 0.0)) for k in ASSET_KEYS}

    # ---- Correlacion pair-wise (pandas .corr() excluye NaN por par) ----
    present = [k for k in REAL_KEYS if k in df.columns]
    # min_periods=60: al menos 60 dias en comun para considerar la correlacion valida
    corr_pairwise = log_rets[present].corr(min_periods=60)
    # Reemplazar NaN (pares sin overlap suficiente) con 0
    corr_pairwise = corr_pairwise.fillna(0.0)
    corr_full = _build_full_correlation(corr_pairwise, present)
    # Override correlaciones de sinteticos riesgosos (pensov tiene correlaciones
    # con bonos USA, EPU, etc. que el calculo no puede deducir sin data).
    for k, corrs in SYNTHETIC_CORRELATIONS.items():
        if k not in ASSET_KEYS:
            continue
        i = ASSET_KEYS.index(k)
        for other_k, c in corrs.items():
            if other_k not in ASSET_KEYS:
                continue
            j = ASSET_KEYS.index(other_k)
            corr_full[i][j] = c
            corr_full[j][i] = c

    # ---- 5. Retornos mensuales (para backtest historico real en la calculadora) ----
    monthly_log_rets = _build_monthly_returns(df)
    monthly_dates = [d.strftime("%Y-%m-%d") for d in monthly_log_rets.index]
    # Matriz N_months x 16. Cells donde un activo no tenia data ese mes = None (null en JSON).
    # El backtest en la calculadora determina la ventana valida segun los activos seleccionados.
    n_months = len(monthly_log_rets)
    monthly_full = [[None] * len(ASSET_KEYS) for _ in range(n_months)]
    for j, k in enumerate(ASSET_KEYS):
        if k in monthly_log_rets.columns:
            col = monthly_log_rets[k].values
            for i in range(n_months):
                v = col[i]
                # NaN → None (para que JSON.parse lo lea como null en JS)
                monthly_full[i][j] = None if (isinstance(v, float) and np.isnan(v)) else float(v)
        else:
            # Cash/sinteticos: compounder deterministico (siempre presente, sin NaN)
            r = STATIC_HISTRET.get(k, 0.0)
            cash_monthly_log = float(np.log(1 + r) / 12)
            for i in range(n_months):
                monthly_full[i][j] = cash_monthly_log

    # Inception y last dates per-ticker (para diagnostico en la calculadora)
    inception_dates = {k: str(ser.index[0].date()) for k, ser in data.items()}
    last_dates      = {k: str(ser.index[-1].date()) for k, ser in data.items()}

    # ---- 6. Consenso de analistas + Damodaran ----
    print("\\nObteniendo consenso de analistas...")
    analyst_consensus = {}
    for k in ASSET_KEYS:
        cons = _build_consensus_for_asset(k, stats.get(k), used.get(k))
        analyst_consensus[k] = cons
        src = cons.get("source", "-") if cons else "NONE"
        mean = cons.get("mean") if cons else None
        mean_str = f"{mean*100:>6.2f}%" if mean is not None else "  ---"
        print(f"  {k:6s} mean={mean_str}  source={src}")

    # ---- 7. Armar JSON ----
    # "years" ahora es el rango total (oldest start → most recent end)
    earliest_start = min(ser.index[0] for ser in data.values())
    latest_end     = max(ser.index[-1] for ser in data.values())
    years = (latest_end - earliest_start).days / 365.25
    out = {
        "meta": {
            "schema_version": "2026-05-24-per-ticker",
            "years": round(years, 2),       # rango total (sin alineacion)
            "days": int(len(log_rets)),
            "date_from": str(earliest_start.date()),
            "date_to":   str(latest_end.date()),
            "tickers_used":      used,
            "inception_dates":   inception_dates,   # per-ticker primer dia disponible
            "last_dates":        last_dates,        # per-ticker ultimo dia disponible
            "years_available":   years_available,   # per-ticker años de history reales
            "n_months": int(n_months),
            "month_from": monthly_dates[0] if monthly_dates else None,
            "month_to":   monthly_dates[-1] if monthly_dates else None,
            "damodaran_vintage": "edit DAMODARAN_EXPECTED_RETURNS dict in download_data.py",
        },
        "sigma":       sigma_all,
        "histRet":     histRet_all,
        "hist_1y_min": hist_1y_min_full,
        "damodaran":   {k: float(DAMODARAN_EXPECTED_RETURNS.get(k, 0.0)) for k in ASSET_KEYS},
        "analyst_consensus": analyst_consensus,   # {key: {low, mean, high, source, ...}}
        "ticker_meta": ticker_meta,               # {key: {longName, summary, sector, industry, currency}}
        "monthly_returns": monthly_full,          # [n_months][16], puede tener nulls
        "monthly_dates":   monthly_dates,
        "beta_sp":     metric("beta_sp"),
        "beta_epu":    metric("beta_epu"),
        "var_95":      metric("var_95"),
        "var_99":      metric("var_99"),
        "es_95":       metric("es_95"),
        "es_99":       metric("es_99"),
        "correlation": corr_full,
        "asset_keys":  ASSET_KEYS,
    }

    # ---- 8. Escribir archivos ----
    with open(OUTPUT_JSON, "w") as f:
        json.dump(out, f, indent=2)
    _write_summary_csv(out, used, OUTPUT_SUMMARY_CSV)
    _write_correlation_csv(corr_full, OUTPUT_CORR_CSV)
    _write_prices_csv(df, OUTPUT_PRICES_CSV)
    _write_monthly_csv(monthly_log_rets, OUTPUT_MONTHLY_CSV)

    # ---- 9. Resumen consola ----
    print(f"\\n{'KEY':<8}{'TICKER':<12}{'CAGR':>8}{'SIGMA':>8}{'MIN1Y':>9}{'DAMOD':>8}")
    for k in ASSET_KEYS:
        cagr = histRet_all[k]
        sig  = sigma_all[k]
        m1y  = hist_1y_min_full[k]
        dmd  = DAMODARAN_EXPECTED_RETURNS.get(k, 0.0)
        print(f"{k:<8}{used.get(k,'-'):<12}{cagr*100:>7.2f}%{sig*100:>7.2f}%{m1y*100:>8.2f}%{dmd*100:>7.2f}%")

    print(f"\\n{'='*62}")
    print("ARCHIVOS GENERADOS:")
    print(f"  {OUTPUT_JSON:36s}  <- cargalo en la calculadora")
    print(f"  {OUTPUT_SUMMARY_CSV:36s}  <- 1 fila por activo (Excel)")
    print(f"  {OUTPUT_CORR_CSV:36s}  <- matriz 16x16 (Excel)")
    print(f"  {OUTPUT_PRICES_CSV:36s}  <- precios diarios crudos")
    print(f"  {OUTPUT_MONTHLY_CSV:36s}  <- retornos mensuales reales (alimenta backtest)")
    print(f"{'='*62}")


if __name__ == "__main__":
    main()
`;

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Calculadora() {
  const [tab, setTab] = useState("cartera");
  const [horizon, setHorizon] = useState(15);
  const [confidence, setConfidence] = useState(0.95);

  // ==========================================================
  // MARKET DATA (sigma, histRet, correlation, beta, var, es)
  // ==========================================================
  // marketData = null cuando se usan los defaults embebidos (los hardcodeados en ASSETS y C).
  // marketData = objeto cargado desde yfinance_results.json cuando el usuario sube data fresca.
  // Persiste en localStorage entre sesiones (clave 'calc_marketData_v1').
  const LS_KEY = "calc_marketData_v1";
  const [marketData, setMarketData] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage?.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [loadError, setLoadError] = useState(null);

  // Persistir cambios en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (marketData) window.localStorage?.setItem(LS_KEY, JSON.stringify(marketData));
      else window.localStorage?.removeItem(LS_KEY);
    } catch {}
  }, [marketData]);

  // Validacion: el JSON debe tener la estructura que produce download_data.py
  const validateMarketData = (obj) => {
    const requiredKeys = ["sigma", "histRet", "correlation", "asset_keys"];
    for (const k of requiredKeys) if (!obj[k]) return `Falta la clave '${k}' en el JSON`;
    if (!Array.isArray(obj.asset_keys) || obj.asset_keys.length !== ASSETS.length) {
      return `'asset_keys' debe tener ${ASSETS.length} elementos (tiene ${obj.asset_keys?.length})`;
    }
    const expected = ASSETS.map(a => a.id);
    for (let i = 0; i < expected.length; i++) {
      if (obj.asset_keys[i] !== expected[i]) {
        return `asset_keys[${i}] = '${obj.asset_keys[i]}', esperado '${expected[i]}'`;
      }
    }
    if (!Array.isArray(obj.correlation) || obj.correlation.length !== ASSETS.length) {
      return `correlation debe ser ${ASSETS.length}x${ASSETS.length}`;
    }
    return null;
  };

  const loadMarketDataFromFile = (file) => {
    setLoadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(e.target.result);
        const err = validateMarketData(obj);
        if (err) { setLoadError(err); return; }
        setMarketData(obj);
      } catch (ex) {
        setLoadError("JSON inválido: " + ex.message);
      }
    };
    reader.onerror = () => setLoadError("No se pudo leer el archivo");
    reader.readAsText(file);
  };

  const clearMarketData = () => {
    setMarketData(null);
    setLoadError(null);
  };

  // Editable returns + tax assumptions (PRIMARY INPUTS to Markowitz)
  const [customReturns, setCustomReturns] = useState(() => ASSETS.map(a => a.ret));
  // Flag: true cuando el usuario movió manualmente el slider de algún activo.
  // Mientras sea false, customReturns sigue auto-sincronizado con marketData
  // (midpoint entre consenso analistas y Damodaran). Una vez true, se respeta lo del usuario.
  const [customReturnsUserEdited, setCustomReturnsUserEdited] = useState(false);
  const [taxUSD, setTaxUSD] = useState(0.25);
  const [taxPEN, setTaxPEN] = useState(0.05);

  // Editable Value & Growth tickers — user provides ticker and Damodaran range
  // σ, correlations, and histRet come from the data download (yfinance).
  // Index 3 = Growth (MSFT default), Index 4 = Value (UBER default)
  const [growthAsset, setGrowthAsset] = useState({ ticker: "MSFT", retLow: 0.11, retHigh: 0.14 });
  const [valueAsset, setValueAsset] = useState({ ticker: "UBER", retLow: 0.09, retHigh: 0.12 });

  // PENSOV (bono soberano peruano sintético): el usuario controla σ con dropdown
  // porque no tiene ticker en yfinance. Rango 6%-9% en pasos de 0.25%.
  const [pensovSigma, setPensovSigma] = useState(0.07);

  // ==========================================================
  // Cuando se carga (o cambia) marketData:
  //   1) sincronizar los tickers Growth/Value con los que el usuario
  //      tenía en el script Python al momento de descargar
  //
  // NOTA: NO tocamos customReturns ni retLow/retHigh. El default del
  // µ esperado siempre es el midpoint del rango Damodaran (a.ret), nunca
  // la histórica. La histórica del JSON aparece sólo como marcador en
  // el slider y en el campo "Hist 10y".
  // ==========================================================
  useEffect(() => {
    if (!marketData?.meta?.tickers_used) return;
    const tk = marketData.meta.tickers_used;
    const growthTk = tk.msft;
    const valueTk  = tk.uber;
    if (growthTk) setGrowthAsset(prev => ({ ...prev, ticker: growthTk }));
    if (valueTk)  setValueAsset(prev  => ({ ...prev, ticker: valueTk }));
  }, [marketData]);


  // Effective asset universe: overrides idx 3, 4 with user-defined tickers/ranges,
  // and applies vol/histRet/damodaran/analystConsensus/hist1yMin from marketData (if loaded).
  // Key insight: the asset id (cspx, cndx, ...) is used to look up values in marketData.
  const effectiveAssets = useMemo(() => {
    return ASSETS.map((a, i) => {
      const baseKey = a.id; // 'cspx', 'cndx', 'msft', etc. — keys originales canonicos
      let asset = { ...a };
      // Fallbacks si NO hay marketData: usar retLow/ret/retHigh como consenso proxy,
      // ret como Damodaran. hist1yMin se queda undefined (no inventamos data histórica).
      asset.consensusLow  = a.retLow;
      asset.consensusMean = a.ret;
      asset.consensusHigh = a.retHigh;
      asset.damodaran     = a.ret;
      asset.hist1yMin     = undefined;
      asset.consensusSource = undefined;
      asset.tickerMeta    = undefined;
      asset.yearsAvailable = undefined;
      // Apply marketData (real yfinance values) — overrides fallbacks
      if (marketData) {
        // ====== σ ======
        // Cash assets (BIL, IB Sav, CDs, plazos fijos): σ = 0 por design del modelo
        // (tratados como activos sin riesgo — no contribuyen a varianza). El JSON
        // puede tener valores absurdos para tickers UCITS de Treasury bills donde
        // yfinance procesa mal dividendos/splits (ej: IB01.L reporta σ ~125% en
        // este dataset — claramente roto). Por eso forzamos 0 y NO leemos el JSON.
        // Activos no-cash: si el JSON dice 0 (típicamente sintéticos sin ticker
        // real como pensov), preservar el σ hardcoded.
        if (a.isCash) {
          asset.vol = 0;
        } else {
          const jsonSigma = marketData.sigma?.[baseKey];
          if (typeof jsonSigma === "number" && jsonSigma > 0) {
            asset.vol = jsonSigma;
          }
        }
        // ====== histRet ======
        // Para cash, sanity-check contra valores absurdos (>15% CAGR sostenido en
        // Treasury bills/cash es imposible). Si falla, caer al hardcoded a.ret.
        if (typeof marketData.histRet?.[baseKey] === "number") {
          const jsonRet = marketData.histRet[baseKey];
          if (a.isCash) {
            asset.histRet = (jsonRet >= 0 && jsonRet <= 0.15) ? jsonRet : a.ret;
          } else {
            asset.histRet = jsonRet;
          }
        }
        if (typeof marketData.damodaran?.[baseKey] === "number") asset.damodaran = marketData.damodaran[baseKey];
        if (typeof marketData.hist_1y_min?.[baseKey] === "number") asset.hist1yMin = marketData.hist_1y_min[baseKey];
        if (marketData.analyst_consensus?.[baseKey]) {
          const c = marketData.analyst_consensus[baseKey];
          if (typeof c.low  === "number") asset.consensusLow  = c.low;
          if (typeof c.mean === "number") asset.consensusMean = c.mean;
          if (typeof c.high === "number") asset.consensusHigh = c.high;
          asset.consensusSource = c.source;
        }
        // Ticker metadata (longName + summary del yfinance)
        if (marketData.ticker_meta?.[baseKey]) {
          asset.tickerMeta = marketData.ticker_meta[baseKey];
        }
        // Years de history disponibles para este activo (per-ticker o overall fallback)
        if (typeof marketData.meta?.years_available?.[baseKey] === "number") {
          asset.yearsAvailable = marketData.meta.years_available[baseKey];
        } else if (typeof marketData.meta?.years === "number") {
          // Fallback: ventana general del JSON (cuando el script viejo no incluye per-ticker)
          asset.yearsAvailable = marketData.meta.years;
        }
      }
      // ============ ESCENARIOS PESIM / NEUTRAL / OPTIM ============
      // Activos NO-CASH: interpolamos el path consenso → Damodaran en 10y y tomamos
      // la CAGR (modelo de reversión a equilibrio de largo plazo).
      // Activos CASH: NO hay reversión a Damodaran — la tasa es lo que el banco
      // paga hoy y puede subir/bajar con política monetaria. Usamos consensus
      // directo. Si el consensus está colapsado (low=mean=high, típico de tasas
      // fijas como las cuentas de ahorro), sintetizamos una banda razonable.
      if (a.isCash) {
        let cL = asset.consensusLow, cM = asset.consensusMean, cH = asset.consensusHigh;
        const collapsed = Math.abs(cH - cL) < 1e-4;
        if (collapsed) {
          // Banda sintética representando cambios futuros en política monetaria:
          //   - spread = max(50% del rate, 100 bps absolutos)
          //   - piso del PESIM = 0.5% (no asumimos tasa cero)
          // Ejemplos a 10y:
          //   ibsav (1.5%):  PESIM 0.5% / NEUTRAL 1.5% / OPTIM 2.5%
          //   cdusd (2.0%):  PESIM 1.0% / NEUTRAL 2.0% / OPTIM 3.0%
          //   pfpen (4.5%):  PESIM 2.25% / NEUTRAL 4.5% / OPTIM 6.75%
          //   bil   (4.5%):  PESIM 2.25% / NEUTRAL 4.5% / OPTIM 6.75%
          const spread = Math.max(cM * 0.5, 0.01);
          cL = Math.max(cM - spread, 0.005);
          cH = cM + spread;
        }
        asset.pBlended = cL;
        asset.nBlended = cM;
        asset.oBlended = cH;
      } else {
        // No-cash: blend prospectivo consenso → Damodaran (CAGR 10y).
        // PESIM/NEUTRAL/OPTIM son escenarios PROSPECTIVOS. HIST es marcador
        // histórico independiente arriba del bar (no se mezcla).
        asset.pBlended = blendConsensusDamodaran(asset.consensusLow,  asset.damodaran);
        asset.nBlended = blendConsensusDamodaran(asset.consensusMean, asset.damodaran);
        asset.oBlended = blendConsensusDamodaran(asset.consensusHigh, asset.damodaran);
      }
      asset.pBlendedFromHist = false;
      asset.oBlendedFromHist = false;
      // Override slots editables (idx 3, 4): renombrados a "Activo 1 JL" / "Activo 2 JL"
      if (i === 3) return {
        ...asset,
        id: growthAsset.ticker.toLowerCase(),
        name: `Activo 1 JL: ${growthAsset.ticker || "—"}`,
        retLow: growthAsset.retLow,
        retHigh: growthAsset.retHigh,
        editable: true,
        kind: "growth",
      };
      if (i === 4) return {
        ...asset,
        id: valueAsset.ticker.toLowerCase(),
        name: `Activo 2 JL: ${valueAsset.ticker || "—"}`,
        retLow: valueAsset.retLow,
        retHigh: valueAsset.retHigh,
        editable: true,
        kind: "value",
      };
      // Override pensov σ con el valor del dropdown (siempre — el Python no tiene
      // data real para este sintético, el usuario lo controla manualmente).
      if (a.id === "pensov") {
        asset.vol = pensovSigma;
      }
      return asset;
    });
  }, [growthAsset, valueAsset, marketData, pensovSigma]);

  // Effective correlation matrix: from marketData if loaded, else from the hardcoded C.
  // Effective correlation matrix: del JSON si está cargado, sino la hardcodeada C.
  // FIX defensivo: si el JSON tiene fila/columna toda en 0 para un activo no-cash
  // (sintético sin data, como pensov), usar los valores de la matriz C hardcodeada
  // en esa fila/columna específica.
  const effectiveC = useMemo(() => {
    if (!marketData?.correlation) return C;
    const M = marketData.correlation.map(row => row.slice()); // copia
    const n = M.length;
    for (let i = 0; i < n; i++) {
      const asset = ASSETS[i];
      if (!asset || asset.isCash) continue;
      // Suma de absolutos en la fila i excluyendo la diagonal
      let rowSum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) rowSum += Math.abs(M[i][j]);
      }
      // Si la fila está toda en 0 (excepto diagonal), copiar de la matriz hardcodeada C
      if (rowSum < 1e-9) {
        for (let j = 0; j < n; j++) {
          M[i][j] = C[i][j];
          M[j][i] = C[j][i];
        }
      }
    }
    return M;
  }, [marketData]);

  // ==========================================================
  // DEFAULT RATE PER ASSET
  // Promedio simple de: consenso neutral + Damodaran.
  // Si falta alguno, usa el que haya. Si no hay ninguno, cae a asset.ret.
  // ==========================================================
  const defaultReturnFor = (asset) => {
    // Nuevo default: el "N" blended (CAGR del path consenso neutral → Damodaran en 10y)
    if (typeof asset.nBlended === "number" && isFinite(asset.nBlended)) return asset.nBlended;
    // Fallback: promedio simple
    const vals = [];
    if (typeof asset.consensusMean === "number" && isFinite(asset.consensusMean)) vals.push(asset.consensusMean);
    if (typeof asset.damodaran    === "number" && isFinite(asset.damodaran))    vals.push(asset.damodaran);
    if (vals.length === 0) return asset.ret;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // Cuando llega marketData (carga inicial o nuevo JSON), si el usuario no ha
  // tocado los sliders, sincronizamos customReturns a los midpoints automáticos.
  useEffect(() => {
    if (!marketData) return;
    if (customReturnsUserEdited) return;
    const newDefaults = effectiveAssets.map(defaultReturnFor);
    setCustomReturns(newDefaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketData, effectiveAssets, customReturnsUserEdited]);

  // Reset manual: restaura los defaults automáticos y "olvida" las ediciones.
  const resetReturnsToAutoDefault = useCallback(() => {
    const newDefaults = effectiveAssets.map(defaultReturnFor);
    setCustomReturns(newDefaults);
    setCustomReturnsUserEdited(false);
  }, [effectiveAssets]);

  // Data fetch state — symbolic for now, real fetch happens via the chat workflow
  const [dataPanelOpen, setDataPanelOpen] = useState(false);

  // ============== Inputs del header ==============
  // Monto inicial: si vacío → default 10,000 USD
  // DCA mensual: si vacío → 0 (sin aportes periódicos). Periodicidad asumida = mensual.
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [dcaMonthly, setDcaMonthly] = useState("");
  const V0_eff = useMemo(() => {
    const n = parseFloat((investmentAmount || "").toString().replace(/,/g, ""));
    return (isFinite(n) && n > 0) ? n : 10000;
  }, [investmentAmount]);
  const dcaMonthly_eff = useMemo(() => {
    const n = parseFloat((dcaMonthly || "").toString().replace(/,/g, ""));
    return (isFinite(n) && n > 0) ? n : 0;
  }, [dcaMonthly]);

  // Pignoración v4 — retiro = min(tasa × NW, monto deseado)
  //   leverage:           L_0 / V_propio
  //   intRate:            tasa anual del préstamo
  //   mcLTV:              umbral margin call sobre L/V
  //   withdrawalMonthly:  USD/mes máximo deseado (techo del retiro)
  //   withdrawalRate:     % anual de NW (piso de seguridad — al inicio domina cuando NW es bajo)
  const [leverage, setLeverage] = useState(0.30);
  const [intRate, setIntRate] = useState(0.045);
  const [mcLTV, setMcLTV] = useState(0.70);
  const [withdrawalMonthly, setWithdrawalMonthly] = useState("4000");
  const [withdrawalRate, setWithdrawalRate] = useState(0.04);

  // Parsed withdrawal — números limpios sin comas, default 0 si vacío/inválido
  const withdrawalMonthly_eff = useMemo(() => {
    const n = parseFloat((withdrawalMonthly || "").toString().replace(/,/g, ""));
    return isFinite(n) && n > 0 ? n : 0;
  }, [withdrawalMonthly]);

  // Markowitz state — drives the weights
  const [markowitz, setMarkowitz] = useState(null);
  const [markowitzRunning, setMarkowitzRunning] = useState(false);
  const [activePortfolio, setActivePortfolio] = useState("neutra");  // 'conservadora' | 'neutra' | 'agresiva' | 'personalizada'
  const [returnsAtLastOpt, setReturnsAtLastOpt] = useState(null);    // for stale detection

  // ====== PICKER POR OBJETIVO (tab Markowitz) ======
  // Modo: 'mu' (fijar retorno mínimo) | 'sigma' (fijar volatilidad máxima)
  // Targets: valores absolutos en decimal (0.08 = 8%). Inicializados al cargar markowitz
  // a los valores de la cartera Neutra (Max Sharpe).
  const [targetMode, setTargetMode] = useState("mu");
  const [targetMu, setTargetMu] = useState(null);
  const [targetSigma, setTargetSigma] = useState(null);
  // ROBUST OPTIMIZATION (toggle 1 — controla pisos mínimos):
  //   OFF (default): minW = 0 — el optimizador puede descartar activos.
  //   ON: minW = hardcoded (fuerza diversificación mínima por activo).
  const [enforceMinFloors, setEnforceMinFloors] = useState(false);

  // CAPS POR VOLATILIDAD (toggle 2 — controla techos solo en activos σ > 25%):
  //   ON (default): aplica topes recomendados a activos volátiles.
  //   OFF: maxW = 1 para todos (sin techos, Markowitz puro).
  const [enforceMaxCaps, setEnforceMaxCaps] = useState(true);

  // Vista derivada que se pasa al optimizador.
  // Combina ambos toggles de forma independiente.
  const effectiveAssetsForOpt = useMemo(() => {
    return effectiveAssets.map(a => ({
      ...a,
      minW: enforceMinFloors ? a.minW : 0,
      maxW: enforceMaxCaps   ? recommendedMaxW(a) : 1,
    }));
  }, [effectiveAssets, enforceMinFloors, enforceMaxCaps]);

  // Backtesting state
  const [rebalanceFreq, setRebalanceFreq] = useState(3);
  const [backtestResult, setBacktestResult] = useState(null);
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestYears, setBacktestYears] = useState(10);

  // Effective returns: gross return × (1 - tax) for cash/PF assets
  const effectiveReturns = useMemo(() => {
    return customReturns.map((r, i) => {
      if (!ASSETS[i].isCash) return r;
      const tax = ASSETS[i].cur === "USD" ? taxUSD : taxPEN;
      return r * (1 - tax);
    });
  }, [customReturns, taxUSD, taxPEN]);

  // ====== CARTERA PERSONALIZADA por target ======
  // Derivada del searchPool (todas las samples) + target actual.
  // O(N) filter + refinamiento de ~30 iters → ~10-20ms, suficiente para slider en vivo.
  // Si el target es infeasible, devuelve { infeasible: true }.
  // NB: tiene que declararse ANTES de `weights` (que la referencia) para evitar
  // el temporal dead zone de const.
  const customPortfolio = useMemo(() => {
    if (!markowitz?.searchPool) return null;
    const target = targetMode === "mu" ? targetMu : targetSigma;
    if (target === null || !isFinite(target)) return null;
    return findOptimalForTarget({
      searchPool: markowitz.searchPool,
      effRet: effectiveReturns,
      assets: effectiveAssetsForOpt,
      corr: effectiveC,
      mode: targetMode,
      target,
    });
  }, [markowitz, targetMode, targetMu, targetSigma, effectiveReturns, effectiveAssetsForOpt, effectiveC]);

  // Cuando markowitz termina de correr (o re-corre), inicializa los targets al
  // punto Neutra (Max Sharpe) para que el picker arranque en un sitio sensato.
  useEffect(() => {
    if (!markowitz?.neutra) return;
    if (targetMu === null)    setTargetMu(markowitz.neutra.mu);
    if (targetSigma === null) setTargetSigma(markowitz.neutra.sigma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markowitz]);

  // WEIGHTS are derived from the selected Markowitz portfolio
  // Fallback to balanced defaults before first optimization
  const weights = useMemo(() => {
    if (activePortfolio === "personalizada" && customPortfolio && !customPortfolio.infeasible) {
      return customPortfolio.w;
    }
    if (markowitz && markowitz[activePortfolio]) {
      return markowitz[activePortfolio].w;
    }
    const defaults = ASSETS.map(a => a.defW);
    const sum = defaults.reduce((a, b) => a + b, 0);
    return defaults.map(w => w / sum);
  }, [markowitz, activePortfolio, customPortfolio]);

  // Stale flag: returns changed since last optimization run
  const optStale = useMemo(() => {
    if (!markowitz || !returnsAtLastOpt) return false;
    return customReturns.some((r, i) => Math.abs(r - returnsAtLastOpt[i]) > 1e-6);
  }, [customReturns, returnsAtLastOpt, markowitz]);

  const runOptimizer = useCallback(() => {
    setMarkowitzRunning(true);
    const snapshot = customReturns.slice();
    setTimeout(() => {
      const result = runMarkowitz(effectiveReturns, 30000, effectiveAssetsForOpt, effectiveC);
      setMarkowitz(result);
      setReturnsAtLastOpt(snapshot);
      setMarkowitzRunning(false);
    }, 50);
  }, [effectiveReturns, customReturns, effectiveAssetsForOpt, effectiveC]);

  // Auto-run optimizer on first mount so the user has weights immediately
  useEffect(() => {
    if (!markowitz && !markowitzRunning) {
      runOptimizer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-optimizar al cambiar cualquiera de los toggles de restricciones o pensov σ.
  // Se omite la primera corrida (manejada por el effect de arriba).
  useEffect(() => {
    if (markowitz && !markowitzRunning) {
      runOptimizer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enforceMinFloors, enforceMaxCaps, pensovSigma]);

  const runBacktestSim = useCallback(() => {
    if (!marketData) {
      alert("No hay JSON cargado.\n\nUsá el botón '📂 Cargar JSON' arriba y subí un yfinance_results.json generado por download_data.py.");
      return;
    }
    if (!marketData.monthly_returns || !marketData.monthly_dates) {
      alert("El JSON cargado no tiene monthly_returns / monthly_dates.\n\nRegenerá el JSON con la versión actualizada del download_data.py (incluye matriz mensual N×16).");
      return;
    }
    // Recortar a la ventana donde TODOS los activos con peso > 0 tienen data.
    // Si un activo joven (ej. EXUS.L inception 2024) está en el portafolio,
    // limita la ventana; si su peso es 0, no influye.
    const win = computeBacktestWindow(marketData.monthly_returns, weights);
    if (win.nMonths <= 24 + 2) {
      const limitingNames = win.limitingIndices.map(i => effectiveAssets[i]?.id || `idx${i}`);
      const inceptions = win.limitingIndices.map(i => {
        const key = ASSETS[i]?.id;
        return marketData.meta?.inception_dates?.[key] || "?";
      });
      const detail = limitingNames.length > 0
        ? `\n\nActivos que limitan: ${limitingNames.join(", ")} (inception ${inceptions.join(", ")}).\n\nOpciones: reducí su peso a 0 en la cartera, o regenerá el JSON con tickers más antiguos.`
        : "";
      alert(`Ventana efectiva del portafolio actual: ${win.nMonths} meses (necesitamos al menos ${24+12} para un backtest decente).${detail}`);
      return;
    }
    const trimmedReturns = marketData.monthly_returns.slice(win.startMonth, win.endMonth + 1);
    const trimmedDates   = marketData.monthly_dates.slice(win.startMonth, win.endMonth + 1);

    setBacktestRunning(true);
    setTimeout(() => {
      const spIdx = marketData.asset_keys?.indexOf("cspx") ?? 0;
      const result = runWalkForwardBacktest({
        monthlyReturns: trimmedReturns,
        monthlyDates: trimmedDates,
        customReturns: effectiveReturns,
        effectiveAssets: effectiveAssets,
        baseWeights: weights,
        rebalanceFreqMonths: rebalanceFreq,
        trailingWindow: 24,
        enforceMinFloors: enforceMinFloors,
        nSamplesPerOpt: 4000,
        spIndex: spIdx,
      });
      setBacktestResult(result);
      setBacktestRunning(false);
    }, 50);
  }, [marketData, effectiveReturns, weights, rebalanceFreq, effectiveAssets, enforceMinFloors]);

  // ----- Portfolio metrics -----
  const { mu, sigma } = useMemo(
    () => portfolioMoments(weights, effectiveReturns, effectiveAssets, effectiveC),
    [weights, effectiveReturns, effectiveAssets, effectiveC]
  );
  const sharpe = (mu - RISK_FREE) / sigma;

  const var95 = riskMetrics(mu, sigma, 0.95);
  const var99 = riskMetrics(mu, sigma, 0.99);
  const beta = useMemo(
    () => effectiveBeta(weights, effectiveAssets, effectiveC),
    [weights, effectiveAssets, effectiveC]
  );

  // Total weight and currency split
  const totalW = weights.reduce((a, b) => a + b, 0);
  const usdW = weights.reduce((acc, w, i) => acc + (ASSETS[i].cur === "USD" ? w : 0), 0);
  const penW = totalW - usdW;

  // ----- Horizon analysis (analytical, log-normal) -----
  // Considera el monto inicial del usuario (V0_eff) y opcionalmente aportes DCA mensuales.
  // Si DCA > 0: el valor final esperado se compone de (1) el patrimonio del V0 inicial
  // creciendo a CAGR=mu durante T años, más (2) la suma de aportes mensuales con su crecimiento.
  // Para los percentiles aplicamos el multiplicador lognormal solo al V0 inicial (los aportes
  // futuros tienen su propia distribución conjunta — esta simplificación es razonable para
  // mostrar rangos y bandas; las simulaciones Monte Carlo en pignoración usarán el modelo correcto).
  const futureValueDCA = useCallback((rate, years, V0in, monthlyContrib) => {
    if (monthlyContrib <= 0) return V0in * Math.exp(rate * years);
    // Conversión a tasa mensual continua
    const rMonthly = Math.exp(rate / 12) - 1;
    const nMonths = years * 12;
    const fvLump = V0in * Math.pow(1 + rMonthly, nMonths);
    const fvAnnuity = rMonthly > 0
      ? monthlyContrib * (Math.pow(1 + rMonthly, nMonths) - 1) / rMonthly
      : monthlyContrib * nMonths;
    return fvLump + fvAnnuity;
  }, []);
  const horizonScenarios = useMemo(() => {
    const V0 = V0_eff;
    const dca = dcaMonthly_eff;
    const percentiles = { muyPesimista: 0.01, pesimista: 0.10, neutro: 0.50, optimista: 0.90, muyOptimista: 0.99 };
    const out = {};
    for (const [k, p] of Object.entries(percentiles)) {
      const mult = lognormalPercentile(mu, sigma, horizon, p);
      // Patrimonio del V0 al percentil p (multiplicador lognormal)
      const valueV0 = V0 * mult;
      // Aportes DCA: usan la CAGR efectiva del percentil para proyectarse
      const cagrAtPct = cagrFromMultiple(mult, horizon);
      const valueDCA = dca > 0
        ? futureValueDCA(Math.log(1 + cagrAtPct), horizon, 0, dca) // aportes solamente
        : 0;
      const value = valueV0 + valueDCA;
      const totalIn = V0 + dca * 12 * horizon;
      // CAGR equivalente sobre el aporte total (no es el CAGR puro, pero da una medida de rentabilidad efectiva)
      const cagrEquiv = totalIn > 0 ? Math.pow(value / totalIn, 1/horizon) - 1 : 0;
      out[k] = { mult, value, valueV0, valueDCA, totalIn, cagr: cagrAtPct, cagrEquiv };
    }
    // Confidence floors (lower-tail)
    const floors = {};
    for (const c of [0.90, 0.95, 0.99]) {
      const p = 1 - c;
      const mult = lognormalPercentile(mu, sigma, horizon, p);
      const valueV0 = V0 * mult;
      const cagrAtPct = cagrFromMultiple(mult, horizon);
      const valueDCA = dca > 0
        ? futureValueDCA(Math.log(1 + cagrAtPct), horizon, 0, dca)
        : 0;
      floors[c] = { mult, value: valueV0 + valueDCA, cagr: cagrAtPct };
    }
    return { scenarios: out, floors };
  }, [mu, sigma, horizon, V0_eff, dcaMonthly_eff, futureValueDCA]);

  // ----- CAGR probability density distribution (log-normal) -----
  // X = log(1+CAGR) is normal with mean (μ - σ²/2) and std σ/√T
  // Density of CAGR uses Jacobian: f_CAGR(c) = f_X(log(1+c)) / (1+c)
  const distributionData = useMemo(() => {
    const T = horizon;
    const V0 = V0_eff;
    const xMean = mu - 0.5 * sigma * sigma;
    const xStd = sigma / Math.sqrt(T);
    // Range: from ~P0.1 to ~P99.9 to capture full tails
    const xMin = xMean - 3.5 * xStd;
    const xMax = xMean + 3.5 * xStd;
    const cagrMin = Math.exp(xMin) - 1;
    const cagrMax = Math.exp(xMax) - 1;
    const nPoints = 220;
    const data = [];
    for (let i = 0; i < nPoints; i++) {
      const cagr = cagrMin + (cagrMax - cagrMin) * i / (nPoints - 1);
      const x = Math.log(1 + cagr);
      const z = (x - xMean) / xStd;
      const densityX = Math.exp(-z * z / 2) / (xStd * Math.sqrt(2 * Math.PI));
      const densityCAGR = densityX / (1 + cagr);
      const finalValue = V0 * Math.exp(x * T);
      data.push({
        cagr,
        cagrPct: cagr * 100,
        density: densityCAGR,
        finalValue,
      });
    }
    return data;
  }, [mu, sigma, horizon]);

  // ----- Fan chart data over time (1..30 years) -----
  const fanData = useMemo(() => {
    const V0 = 10000;
    const out = [];
    const maxT = Math.max(30, horizon);
    for (let t = 1; t <= maxT; t++) {
      const p01 = V0 * lognormalPercentile(mu, sigma, t, 0.01);
      const p10 = V0 * lognormalPercentile(mu, sigma, t, 0.10);
      const p50 = V0 * lognormalPercentile(mu, sigma, t, 0.50);
      const p90 = V0 * lognormalPercentile(mu, sigma, t, 0.90);
      const p99 = V0 * lognormalPercentile(mu, sigma, t, 0.99);
      out.push({
        year: t,
        p01, p10, p50, p90, p99,
        // For stacked area to show bands:
        band_low_to_p10: p10 - p01,
        band_p10_to_p50: p50 - p10,
        band_p50_to_p90: p90 - p50,
        band_p90_to_p99: p99 - p90,
        floor: p01,
      });
    }
    return out;
  }, [mu, sigma, horizon]);

  // ----- Pignoración simulation -----
  const [pledgeResult, setPledgeResult] = useState(null);
  const [pledgeRunning, setPledgeRunning] = useState(false);

  const runPledge = useCallback(() => {
    setPledgeRunning(true);
    setTimeout(() => {
      // SNAPSHOT de parámetros usados en esta simulación. Las useMemos pesadas
      // (confidenceTable, marginCallCurves) leen DE ESTE snapshot, no de los
      // valores live — así escribir en monto inicial / DCA no dispara recálculos
      // hasta que el usuario hace click en "Recalcular".
      const params = {
        mu, sigma, T: horizon, V0Propio: V0_eff,
        leverage, intRate, maintenanceLTV: mcLTV,
        withdrawalMonthly: withdrawalMonthly_eff,
        withdrawalRate, dcaMonthly: dcaMonthly_eff,
      };
      const sim = runLeveragedSim({ ...params, N: 10000 });
      const simNoLev = runLeveragedSim({ ...params, leverage: 0, N: 10000 });
      setPledgeResult({ ...sim, baseline: simNoLev, _params: params });
      setPledgeRunning(false);
    }, 50);
  }, [mu, sigma, horizon, V0_eff, leverage, intRate, mcLTV, withdrawalMonthly_eff, withdrawalRate, dcaMonthly_eff]);

  // ===========================================================
  // ===========================================================
  // CONFIDENCE TABLE v2 — barrido de wPctNet con el modelo apalancado.
  // Se recompute cuando cambian los parámetros del modelo nuevo.
  // ===========================================================
  // Tablas/curvas pesadas: leen del snapshot dentro de pledgeResult.
  // Se computan ASÍNCRONAMENTE en useEffect (después del render inicial), así
  // las headlines y el área chart aparecen inmediatamente sin bloquear el browser.
  // confidenceTable es lo más caro (~3s) por eso se difiere primero;
  // marginCallCurves (~0.5s) se computa después.
  const [confidenceTable, setConfidenceTable] = useState(null);
  const [marginCallCurves, setMarginCallCurves] = useState(null);
  const [heavyComputing, setHeavyComputing] = useState(false);

  useEffect(() => {
    if (!pledgeResult?._params) {
      setConfidenceTable(null);
      setMarginCallCurves(null);
      return;
    }
    setConfidenceTable(null);
    setMarginCallCurves(null);
    setHeavyComputing(true);
    const p = pledgeResult._params;
    // Defer marginCallCurves primero (más rápido) — UX: usuario ve curvas pronto
    const id1 = setTimeout(() => {
      try {
        const mc = runMarginCallCurves({
          mu: p.mu, sigma: p.sigma, T: p.T, V0Propio: p.V0Propio,
          leverage: p.leverage, intRate: p.intRate, maintenanceLTV: p.maintenanceLTV,
          withdrawalRate: p.withdrawalRate, dcaMonthly: p.dcaMonthly, N: 2000,
        });
        setMarginCallCurves(mc);
      } catch (e) { console.error("marginCallCurves error:", e); }
    }, 100);
    // Despues confidenceTable (más caro)
    const id2 = setTimeout(() => {
      try {
        const ct = runLeveragedConfidenceTable({
          mu: p.mu, sigma: p.sigma, T: p.T, V0Propio: p.V0Propio,
          leverage: p.leverage, intRate: p.intRate, maintenanceLTV: p.maintenanceLTV,
          withdrawalRate: p.withdrawalRate, dcaMonthly: p.dcaMonthly, N: 1500,
        });
        setConfidenceTable(ct);
      } catch (e) { console.error("confidenceTable error:", e); }
      finally { setHeavyComputing(false); }
    }, 800);
    return () => { clearTimeout(id1); clearTimeout(id2); };
  }, [pledgeResult]);

  // Detector de parámetros stale — si los live values difieren del snapshot,
  // se muestra un badge "Parámetros cambiados, recalcular" cerca del botón Run.
  const paramsStale = useMemo(() => {
    if (!pledgeResult?._params) return false;
    const p = pledgeResult._params;
    const eps = 1e-9;
    return (
      Math.abs(p.mu - mu) > eps ||
      Math.abs(p.sigma - sigma) > eps ||
      p.T !== horizon ||
      Math.abs(p.V0Propio - V0_eff) > 0.01 ||
      Math.abs(p.leverage - leverage) > eps ||
      Math.abs(p.intRate - intRate) > eps ||
      Math.abs(p.maintenanceLTV - mcLTV) > eps ||
      Math.abs(p.withdrawalMonthly - withdrawalMonthly_eff) > 0.01 ||
      Math.abs(p.withdrawalRate - withdrawalRate) > eps ||
      Math.abs(p.dcaMonthly - dcaMonthly_eff) > 0.01
    );
  }, [pledgeResult, mu, sigma, horizon, V0_eff, leverage, intRate, mcLTV, withdrawalMonthly_eff, withdrawalRate, dcaMonthly_eff]);


  // Update one weight, optionally rebalancing
  // (Removed: weights are now derived from Markowitz, not user-edited)

  // Group assets por clase (5 buckets independientes de moneda) en orden fijo
  const grouped = useMemo(() => {
    const acc = {};
    for (const g of ASSET_GROUP_ORDER) acc[g] = [];
    effectiveAssets.forEach((a, i) => {
      const g = groupOf(a);
      acc[g].push({ ...a, idx: i });
    });
    // Devolver solo los grupos que tienen activos
    const out = {};
    for (const g of ASSET_GROUP_ORDER) {
      if (acc[g].length > 0) out[g] = acc[g];
    }
    return out;
  }, [effectiveAssets]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.root}>
      <style>{globalCSS}</style>

      {/* ============== HEADER ============== */}
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Calculadora de Cartera · v0.1</div>
          <h1 style={styles.title}>
            Calculadora <span style={styles.titleAmp}>—</span> Portafolio Jan Lucas
          </h1>
          <div style={styles.headerInputsRow}>
            <label style={styles.headerInputLabel}>
              <span style={styles.headerInputLabelText}>Monto inicial</span>
              <span style={styles.headerInputWrap}>
                <span style={styles.headerInputCurrency}>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="10,000"
                  style={styles.headerInput}
                />
              </span>
            </label>
            <label style={styles.headerInputLabel}>
              <span style={styles.headerInputLabelText}>Aporte DCA mensual</span>
              <span style={styles.headerInputWrap}>
                <span style={styles.headerInputCurrency}>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={dcaMonthly}
                  onChange={(e) => setDcaMonthly(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="opcional"
                  style={styles.headerInput}
                />
                <span style={styles.headerInputUnit}>/ mes</span>
              </span>
            </label>
          </div>
        </div>
        <div style={styles.headerStats}>
          <Stat label="Retorno Esperado" value={fmtPct(mu)} accent="positive" />
          <Stat label="Volatilidad" value={fmtPct(sigma)} />
          <Stat label="Sharpe" value={sharpe.toFixed(2)} accent={sharpe > 0.8 ? "positive" : "neutral"} />
          <Stat label="USD / PEN" value={`${(usdW*100).toFixed(0)}% / ${(penW*100).toFixed(0)}%`} />
        </div>
      </header>

      {/* ============== TABS ============== */}
      <nav style={styles.tabs}>
        {[
          ["cartera", "I. Cartera y Riesgo"],
          ["markowitz", "II. Optimización Markowitz"],
          ["horizonte", "III. Horizonte Temporal"],
          ["pignoracion", "IV. Pignoración"],
          ["backtest", "V. Backtesting"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ ...styles.tab, ...(tab === k ? styles.tabActive : {}) }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ============== DATA STATUS BANNER ============== */}
      <div
        style={{
          ...styles.dataBanner,
          borderColor: marketData ? "var(--positive)" : "var(--gold)",
        }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          const f = e.dataTransfer.files?.[0];
          if (f) loadMarketDataFromFile(f);
        }}
      >
        <div style={styles.dataBannerLeft}>
          <span style={{
            ...styles.dataBadge,
            background: marketData ? "var(--positive)" : "var(--gold)",
          }}>
            {marketData ? "● DATOS LIVE" : "● DATOS EMBEBIDOS"}
          </span>
          <span style={styles.dataBannerText}>
            {marketData ? (
              <>
                σ y matriz cargadas desde <code style={styles.modalCode}>yfinance_results.json</code>
                {marketData.meta && (
                  <>
                    {" "}· <strong>{marketData.meta.years} años</strong> ({marketData.meta.date_from} → {marketData.meta.date_to}, {marketData.meta.days?.toLocaleString?.()} días)
                    {marketData.meta.schema_version && (
                      <>{" "}· schema <code style={styles.modalCode}>{marketData.meta.schema_version}</code></>
                    )}
                  </>
                )}
                {(() => {
                  // Diagnóstico de campos faltantes (JSON viejo): listar qué falta
                  const missing = [];
                  if (!marketData.ticker_meta)      missing.push("ticker_meta");
                  if (!marketData.analyst_consensus) missing.push("analyst_consensus");
                  if (!marketData.damodaran)         missing.push("damodaran");
                  if (!marketData.hist_1y_min)       missing.push("hist_1y_min");
                  if (!marketData.monthly_returns)   missing.push("monthly_returns");
                  if (!marketData.meta?.years_available) missing.push("years_available");
                  if (missing.length === 0) return null;
                  return (
                    <>
                      {" "}
                      <span style={{
                        display: "inline-block",
                        marginLeft: 6,
                        padding: "2px 7px",
                        background: "rgba(184, 146, 58, 0.18)",
                        border: "1px solid var(--gold)",
                        color: "var(--gold)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10.5,
                        fontWeight: 600,
                        borderRadius: 2,
                        letterSpacing: "0.03em",
                      }}>
                        ⚠ JSON sin: {missing.join(", ")} · regenerá con download_data.py actualizado
                      </span>
                    </>
                  );
                })()}
              </>
            ) : (
              <>Usando valores embebidos del JSON inicial. Arrastra un <code style={styles.modalCode}>yfinance_results.json</code> aquí o usa "Cargar JSON".</>
            )}
          </span>
        </div>
        <div style={styles.dataBannerButtons}>
          <label style={styles.dataBtn} title="Carga un yfinance_results.json generado por download_data.py">
            📂 Cargar JSON
            <input
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadMarketDataFromFile(f);
                e.target.value = ""; // permitir recargar el mismo archivo
              }}
            />
          </label>
          <button
            onClick={() => setDataPanelOpen(true)}
            style={styles.dataBtn}
            title="Copia el script Python que genera yfinance_results.json"
          >
            🐍 Script Python
          </button>
          {marketData && (
            <button
              onClick={clearMarketData}
              style={styles.dataBtn}
              title="Vuelve a usar los valores embebidos del JSON inicial"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>
      {loadError && (
        <div style={{
          background: "rgba(193, 60, 60, 0.08)",
          border: "1px solid var(--negative)",
          color: "var(--negative)",
          padding: "10px 16px",
          borderRadius: 2,
          fontSize: 12.5,
          marginBottom: 12,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ⚠ Error cargando JSON: {loadError}
          <button
            onClick={() => setLoadError(null)}
            style={{ marginLeft: 12, background: "transparent", border: "none", color: "var(--negative)", cursor: "pointer", fontSize: 14 }}
          >✕</button>
        </div>
      )}

      {/* Data download confirmation panel */}
      {dataPanelOpen && (
        <div style={styles.modalOverlay} onClick={() => setDataPanelOpen(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>download_data.py · yfinance</h3>
              <button onClick={() => setDataPanelOpen(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>

              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>Los 11 tickers que se descargan</div>
                <div style={styles.tickerList}>
                  {effectiveAssets
                    .filter(a => !a.isCash && a.id !== "pensov")
                    .map((a, i) => (
                      <div key={i} style={a.editable ? { ...styles.tickerListItem, ...styles.tickerListItemEditable } : styles.tickerListItem}>
                        <span style={styles.tickerListIdx}>{i + 1}.</span>
                        <code style={styles.tickerListSymbol}>
                          {a.editable
                            ? (a.id === "msft" ? growthAsset.ticker : valueAsset.ticker)
                            : a.id.toUpperCase()}
                        </code>
                        <span style={styles.tickerListName}>{a.name}</span>
                        {a.editable && <span style={styles.tickerListEditTag}>editable</span>}
                      </div>
                    ))}
                </div>
                <div style={styles.modalNote}>
                  Los 5 cash/PF (BIL, IB Sav, CD USD, PF PEN, Sav PEN) y Bonos Soberanos PEN sintético <strong>no</strong> se descargan — el script les inyecta valores estáticos hardcodeados (σ=0, histRet fija) directamente en el JSON.
                </div>
              </div>

              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>Lo que va a generar</div>
                <ul style={styles.modalList}>
                  <li><code style={styles.modalCode}>yfinance_results.json</code> — para cargar en esta calculadora con "Cargar JSON"</li>
                  <li><code style={styles.modalCode}>yfinance_summary.csv</code> — 1 fila por activo con σ, CAGR, β vs S&P, β vs EPU, VaR/ES 95/99 (abre en Excel)</li>
                  <li><code style={styles.modalCode}>yfinance_correlation.csv</code> — matriz 16×16 con labels en filas y columnas</li>
                  <li><code style={styles.modalCode}>yfinance_prices.csv</code> — precios diarios crudos (~1700 filas × 11 columnas) por si quieres hacer tus propios gráficos en Excel</li>
                </ul>
              </div>

              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>Para proceder</div>
                <ol style={styles.modalList}>
                  <li>Copia el script abajo (viene con <code style={styles.modalCode}>{growthAsset.ticker}</code> y <code style={styles.modalCode}>{valueAsset.ticker}</code> ya seteados como growth/value).</li>
                  <li>Guárdalo como <code style={styles.modalCode}>download_data.py</code>.</li>
                  <li>Instala dependencias: <code style={styles.modalCode}>pip install yfinance pandas numpy</code></li>
                  <li>Corre: <code style={styles.modalCode}>python download_data.py</code></li>
                  <li>Carga el <code style={styles.modalCode}>yfinance_results.json</code> resultante con el botón <strong>"Cargar JSON"</strong> del banner (o arrástralo encima del banner). Los datos quedan guardados en tu browser y se cargan automáticamente la próxima vez que abras la calculadora.</li>
                </ol>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <CopyCodeButton
                code={
                  DOWNLOAD_PY_TEMPLATE
                    .replace("{GROWTH}", growthAsset.ticker || "MSFT")
                    .replace("{VALUE}", valueAsset.ticker || "UBER")
                }
                label="Copiar download_data.py"
              />
              <button onClick={() => setDataPanelOpen(false)} style={styles.modalConfirm}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============== TAB: CARTERA ============== */}
      {tab === "cartera" && (
        <section style={styles.section}>

          {/* ====== 1. CAJA HORIZONTAL DE METRICAS DE RIESGO (despues del banner JSON) ====== */}
          <div style={styles.metricsHorizontalBox}>
            <div style={styles.metricsHorizontalHeader}>
              <h3 style={styles.metricsHorizontalTitle}>Métricas de Riesgo · Cartera {activePortfolio}</h3>
              <div style={styles.metricsHorizontalSub}>
                Computadas sobre los pesos Markowitz actuales y tus rentabilidades efectivas (post-impuestos en cash/PF).
              </div>
            </div>
            <div style={styles.metricsHorizontalGrid}>
              <MetricCardCompact label="Retorno μ" value={fmtPct(mu, 2)} sub="ponderado" />
              <MetricCardCompact label="Volatilidad σ" value={fmtPct(sigma, 2)} sub="anualizada" />
              <MetricCardCompact label="Sharpe" value={sharpe.toFixed(2)} sub={`Rf ${fmtPct(RISK_FREE, 1)}`} />
              <MetricCardCompact label="β efectivo" value={beta.toFixed(2)} sub="vs S&P + EPU" />
              <MetricCardCompact label="VaR 95%" value={fmtPct(var95.VaR, 2)} sub="1 año" accent="negative" />
              <MetricCardCompact label="VaR 99%" value={fmtPct(var99.VaR, 2)} sub="1 año" accent="negative" />
              <MetricCardCompact label="ES 95%" value={fmtPct(var95.ES, 2)} sub="cola izquierda" accent="negative" />
              <MetricCardCompact label="ES 99%" value={fmtPct(var99.ES, 2)} sub="cola izquierda" accent="negative" />
            </div>
          </div>

          {/* ====== 1.5 PIE CHART DE COMPOSICIÓN POR CLASE DE ACTIVO ====== */}
          <CompositionPie weights={weights} assets={effectiveAssets} />

          {/* ====== 2. CARTERA: HEADER + SWITCH + SLIDERS (ancho completo) ====== */}
          <div style={styles.cardHeader}>
            <div>
              <h2 style={{ ...styles.h2, marginBottom: 4 }}>Sensibilizar Rentabilidades Esperadas</h2>
              <div style={styles.compositionHint}>
                Los <strong>pesos</strong> vienen del optimizador Markowitz (no editables aquí).
                Mueve la rentabilidad de cada activo arrastrando el thumb (rojo) o haciendo click en cualquier umbral.
                Los valores <strong style={{color: "#c97a2e"}}>PESIM.</strong> · <strong style={{color: "var(--gold)"}}>NEUTRAL</strong> · <strong style={{color: "#5a9d6e"}}>OPTIM.</strong> son la <strong>CAGR de 10 años</strong> del path que interpola consenso de analistas (año 1) → Damodaran (año 10).
                Default = NEUTRAL.
              </div>
            </div>
            <div style={styles.portfolioSwitcher}>
              <div style={styles.portfolioSwitcherLabel}>Cartera Markowitz activa</div>
              <div style={styles.portfolioSwitcherButtons}>
                {[
                  ["conservadora", "Conservadora", "var(--positive)"],
                  ["neutra", "Neutra", "var(--gold)"],
                  ["agresiva", "Agresiva", "var(--accent)"],
                  ["personalizada", "Personalizada", "#5a3fa0"],
                ].map(([k, label, color]) => {
                  const disabled = !markowitz || (k === "personalizada" && (!customPortfolio || customPortfolio.infeasible));
                  return (
                    <button
                      key={k}
                      onClick={() => setActivePortfolio(k)}
                      disabled={disabled}
                      title={k === "personalizada" && disabled
                        ? "Configurá un objetivo en la pestaña II · Optimización Markowitz"
                        : undefined}
                      style={{
                        ...styles.portfolioBtn,
                        ...(activePortfolio === k ? { ...styles.portfolioBtnActive, background: color, borderColor: color } : {}),
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Toggles de restricciones (2 cuadritos compactos) + Reset rentabilidades */}
          <div style={styles.cartControlBar}>
            <label style={styles.toggleBox}>
              <div style={styles.toggleBoxHeader}>
                <input
                  type="checkbox"
                  checked={!enforceMinFloors}
                  onChange={(e) => setEnforceMinFloors(!e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <strong>Markowitz robusto</strong>
              </div>
              <div style={styles.toggleBoxHint}>
                Permite que un activo quede en 0% (sin pisos forzados).
              </div>
            </label>
            <label style={styles.toggleBox}>
              <div style={styles.toggleBoxHeader}>
                <input
                  type="checkbox"
                  checked={enforceMaxCaps}
                  onChange={(e) => setEnforceMaxCaps(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <strong>Topes por volatilidad</strong>
              </div>
              <div style={styles.toggleBoxHint}>
                σ &gt; 50% → 5% · σ 25-50% → 10%.
              </div>
            </label>
            <button
              onClick={resetReturnsToAutoDefault}
              style={styles.resetRetBtn}
              title="Restaurar todas las rentabilidades al N blended (CAGR del path consenso neutral → Damodaran en 10y)"
            >
              ↻ Reset a N (consenso → Damodaran)
            </button>
          </div>

          {(optStale || !markowitz) && (
            <div style={{
              ...styles.staleBar,
              background: optStale ? "var(--negative)" : "var(--ink)",
            }}>
              <span>
                {markowitzRunning ? "Optimizando con tus rentabilidades..." :
                 !markowitz ? "Cartera aún no optimizada." :
                 "Las rentabilidades cambiaron. Los pesos están desactualizados."}
              </span>
              <button
                onClick={runOptimizer}
                disabled={markowitzRunning}
                style={styles.staleBtn}
              >
                {markowitzRunning ? "..." : "↻ Re-optimizar Markowitz"}
              </button>
            </div>
          )}

          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={styles.catBlock}>
              <div style={styles.catHeader}>
                <span>{cat}</span>
                <span style={styles.catTotal}>
                  Σ {fmtPct(items.reduce((a, it) => a + weights[it.idx], 0), 1)}
                </span>
              </div>
              {items.map((it) => (
                <AssetSlider
                  key={it.id}
                  asset={it}
                  weight={weights[it.idx]}
                  customRet={customReturns[it.idx]}
                  onRetChange={(v) => {
                    const next = customReturns.slice();
                    next[it.idx] = v;
                    setCustomReturns(next);
                    setCustomReturnsUserEdited(true);
                  }}
                  taxRate={it.cur === "USD" ? taxUSD : taxPEN}
                  onTickerChange={it.kind === "growth" ? (t) => setGrowthAsset({ ...growthAsset, ticker: t }) :
                                  it.kind === "value"  ? (t) => setValueAsset({ ...valueAsset, ticker: t }) : undefined}
                  onRangeChange={it.kind === "growth" ? (r) => setGrowthAsset({ ...growthAsset, ...r }) :
                                 it.kind === "value"  ? (r) => setValueAsset({ ...valueAsset, ...r }) : undefined}
                  hasMarketData={!!marketData}
                  enforceMaxCaps={enforceMaxCaps}
                  pensovSigma={pensovSigma}
                  setPensovSigma={setPensovSigma}
                />
              ))}
            </div>
          ))}

          <div style={styles.totalRow}>
            <span>Σ pesos · cartera <strong style={{textTransform: "capitalize"}}>{activePortfolio}</strong></span>
            <span style={{
              ...styles.totalValue,
              color: Math.abs(totalW - 1) < 0.01 ? "var(--positive)" : "var(--negative)",
            }}>
              {fmtPct(totalW, 1)}
            </span>
          </div>

          {/* ====== 3. COMPOSICION POR CATEGORIA + NOTAS (al final) ====== */}
          <h3 style={{ ...styles.h3, marginTop: 32 }}>Composición por categoría</h3>
          <CategoryBars weights={weights} />

          <h3 style={styles.h3}>Notas y supuestos</h3>
          <ul style={styles.notes}>
            <li><strong>Cash y plazos fijos tratados como activos sin riesgo (σ = 0):</strong> BIL, IB Savings USD, CD USD, Plazo Fijo PEN y Cuenta Ahorros PEN. No contribuyen a la varianza del portafolio.</li>
            <li><strong>Activos PEN sin riesgo cambiario:</strong> se asume cobertura USD/PEN activa por parte del inversor. Los retornos PEN se computan en términos locales sin overlay de FX.</li>
            <li><strong>Markowitz robusto (default):</strong> el optimizador puede dejar un activo en 0% — no se exigen pisos mínimos. Toggle OFF reactiva los pisos hardcoded.</li>
            <li><strong>Topes por volatilidad (default ON):</strong> activos con σ &gt; 50% (BTC, UBER) capeados al 5%; σ entre 25-50% (MSFT, EPU) capeados al 10%. El resto sin tope. Toggle OFF deja Markowitz puro sin restricciones (puede concentrar 100% en un activo).</li>
            <li><strong>VaR / ES paramétricos asumen normalidad</strong> — sub-estiman cola izquierda en activos con fat tails (BTC, UBER, EPU).</li>
            <li><strong>Beta "efectivo"</strong> = promedio ponderado de β vs S&P (parte USD) y β vs EPU/BVL (parte PEN). Métrica de lectura, no CAPM puro.</li>
            <li><strong>Consenso de analistas en MSFT/UBER</strong> viene de yfinance (price targets a 12 meses). Tiende a ser optimista — úsalo como referencia, no como expectativa de largo plazo sostenido.</li>
          </ul>

          {/* ====== 4. PANEL DE IMPUESTOS (compacto, al final del todo) ====== */}
          <div style={styles.taxPanelCompact}>
            <div style={styles.taxPanelCompactLabel}>
              <span style={styles.taxPanelIcon}>⚙</span>
              Impuestos sobre rendimientos realizados <span style={styles.taxPanelHint}>(solo cash & plazos fijos)</span>
            </div>
            <div style={styles.taxInputsCompact}>
              <div style={styles.taxInputGroup}>
                <span style={styles.taxInputLabel}>USD</span>
                <input
                  type="number" step="1" min="0" max="50"
                  value={(taxUSD * 100).toFixed(0)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) / 100;
                    if (!isNaN(v) && v >= 0 && v <= 0.5) setTaxUSD(v);
                  }}
                  style={styles.taxInputCompact}
                />
                <span style={styles.taxInputPct}>%</span>
              </div>
              <div style={styles.taxInputGroup}>
                <span style={styles.taxInputLabel}>PEN</span>
                <input
                  type="number" step="1" min="0" max="50"
                  value={(taxPEN * 100).toFixed(0)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) / 100;
                    if (!isNaN(v) && v >= 0 && v <= 0.5) setTaxPEN(v);
                  }}
                  style={styles.taxInputCompact}
                />
                <span style={styles.taxInputPct}>%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============== TAB: MARKOWITZ ============== */}
      {tab === "markowitz" && (
        <section style={styles.section}>
          <div style={styles.markowitzHeader}>
            <div>
              <h2 style={styles.h2}>Frontera Eficiente de Markowitz</h2>
              <p style={styles.intro}>
                Genero <strong>15,000 carteras aleatorias</strong> respetando los toggles de pisos/topes,
                las posiciono en el plano (σ, μ), y refino localmente tres puntos clave:
                <strong> Mínima Varianza</strong> (Conservadora), <strong>Max Sharpe</strong> (Neutra, tangencial) y
                <strong> target μ = Neutra × 1.30</strong> con mínima varianza (Agresiva).
                Click en cualquiera para cargarla en la pestaña I y experimentar.
              </p>
            </div>
            <button onClick={runOptimizer} style={styles.runBtn} disabled={markowitzRunning}>
              {markowitzRunning ? "Optimizando..." : markowitz ? "Re-correr" : "Optimizar"}
            </button>
          </div>

          {!markowitz && !markowitzRunning && (
            <div style={styles.placeholder}>
              Haz click en "Optimizar" para generar la frontera eficiente.
              <br/><span style={{fontSize: 11, opacity: 0.7}}>BTC fijo al 5%. Resto de pesos respetan rangos definidos.</span>
            </div>
          )}

          {markowitz && (
            <>
              {/* Three optimal portfolios */}
              <div style={styles.optimaGrid}>
                <OptimalPortfolioCard
                  label="Conservadora"
                  desc="Mínima Varianza"
                  portfolio={markowitz.conservadora}
                  accent="positive"
                  onLoad={() => { setActivePortfolio("conservadora"); setTab("cartera"); }}
                />
                <OptimalPortfolioCard
                  label="Neutra"
                  desc="Max Sharpe (Tangencial)"
                  portfolio={markowitz.neutra}
                  accent="gold"
                  highlight
                  onLoad={() => { setActivePortfolio("neutra"); setTab("cartera"); }}
                />
                <OptimalPortfolioCard
                  label="Agresiva"
                  desc={markowitz.agresiva.targetUnreachable
                    ? "Máxima Rentabilidad (target +30% inalcanzable)"
                    : "Target μ = Neutra × 1.30"}
                  portfolio={markowitz.agresiva}
                  accent="accent"
                  onLoad={() => { setActivePortfolio("agresiva"); setTab("cartera"); }}
                />
              </div>

              {/* Efficient frontier scatter */}
              <h3 style={styles.h3}>Frontera Eficiente · {markowitz.samples.length.toLocaleString()} portafolios factibles</h3>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={460}>
                  <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 50 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Volatilidad"
                      tickFormatter={(v) => fmtPct(v, 1)}
                      stroke="var(--ink-muted)"
                      tick={{ fontSize: 11 }}
                      domain={[(dataMin) => Math.max(0, dataMin * 0.92), (dataMax) => dataMax * 1.04]}
                      label={{ value: "Volatilidad (σ anual)", position: "bottom", offset: 20, fill: "var(--ink-muted)", fontSize: 12 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Retorno"
                      tickFormatter={(v) => fmtPct(v, 1)}
                      stroke="var(--ink-muted)"
                      tick={{ fontSize: 11 }}
                      domain={[(dataMin) => Math.max(0, dataMin * 0.92), (dataMax) => dataMax * 1.04]}
                      label={{ value: "Retorno esperado (μ anual)", angle: -90, position: "left", offset: 10, fill: "var(--ink-muted)", fontSize: 12 }}
                    />
                    <ZAxis type="number" range={[8, 8]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => {
                        if (name === "Volatilidad" || name === "Retorno") return fmtPct(value, 2);
                        return value;
                      }}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11 }}
                    />
                    {/* Cloud of feasible portfolios */}
                    <Scatter
                      name="Portafolios factibles"
                      data={markowitz.samples}
                      fill="var(--accent)"
                      fillOpacity={0.12}
                      isAnimationActive={false}
                    />
                    {/* Three optima as highlighted points */}
                    <Scatter
                      name="Conservadora (Min Var)"
                      data={[{ x: markowitz.conservadora.sigma, y: markowitz.conservadora.mu }]}
                      fill="var(--positive)"
                      shape={(props) => <OptimumMarker {...props} color="var(--positive)" label="CONSERVADORA" />}
                    />
                    <Scatter
                      name="Neutra (Max Sharpe)"
                      data={[{ x: markowitz.neutra.sigma, y: markowitz.neutra.mu }]}
                      fill="var(--gold)"
                      shape={(props) => <OptimumMarker {...props} color="var(--gold)" label="NEUTRA" />}
                    />
                    <Scatter
                      name="Agresiva (target Neutra × 1.30)"
                      data={[{ x: markowitz.agresiva.sigma, y: markowitz.agresiva.mu }]}
                      fill="var(--accent)"
                      shape={(props) => <OptimumMarker {...props} color="var(--accent)" label="AGRESIVA" />}
                    />
                    {/* Punto personalizado: aparece solo cuando hay un customPortfolio feasible */}
                    {customPortfolio && !customPortfolio.infeasible && (
                      <Scatter
                        name="Personalizada (target del usuario)"
                        data={[{ x: customPortfolio.sigma, y: customPortfolio.mu }]}
                        fill="#5a3fa0"
                        shape={(props) => <OptimumMarker {...props} color="#5a3fa0" label="TU OBJETIVO" />}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={styles.legend}>
                  <span><span style={{...styles.dot, background: "var(--accent)", opacity: 0.3}}/> Nube de portafolios factibles</span>
                  <span><span style={{...styles.dot, background: "var(--positive)"}}/> Mínima Varianza</span>
                  <span><span style={{...styles.dot, background: "var(--gold)"}}/> Max Sharpe</span>
                  <span><span style={{...styles.dot, background: "var(--accent)"}}/> Máxima Rentabilidad</span>
                  {customPortfolio && !customPortfolio.infeasible && (
                    <span><span style={{...styles.dot, background: "#5a3fa0"}}/> Tu objetivo</span>
                  )}
                </div>
              </div>

              {/* ====== PICKER POR OBJETIVO ====== */}
              <TargetPicker
                markowitz={markowitz}
                customPortfolio={customPortfolio}
                targetMode={targetMode}
                setTargetMode={setTargetMode}
                targetMu={targetMu}
                setTargetMu={setTargetMu}
                targetSigma={targetSigma}
                setTargetSigma={setTargetSigma}
                onLoad={() => { setActivePortfolio("personalizada"); setTab("cartera"); }}
              />

              <h3 style={styles.h3}>Comparativa lado a lado</h3>
              <div style={styles.comparisonTable}>
                <ComparisonTable portfolios={[
                  { label: "Conservadora", ...markowitz.conservadora },
                  { label: "Neutra (Max Sharpe)", ...markowitz.neutra },
                  { label: "Agresiva", ...markowitz.agresiva },
                ]}/>
              </div>
            </>
          )}

          <h3 style={styles.h3}>Matriz de correlaciones · 16 × 16</h3>
          <p style={styles.distribIntro}>
            Insumo clave del optimizador. Correlaciones cercanas a +1 (rojo intenso) indican activos que se mueven juntos
            (poca diversificación), cercanas a 0 (blanco) son independientes (diversifican), y negativas (azul) son raras pero muy valiosas.
            <em> Cash y plazos fijos no aparecen coloreados porque su σ=0 anula su contribución al riesgo.</em>
          </p>
          <CorrelationMatrix effectiveAssets={effectiveAssets} correlation={effectiveC} />
        </section>
      )}

      {/* ============== TAB: HORIZONTE ============== */}
      {tab === "horizonte" && (
        <section style={styles.section}>
          <div style={styles.controlsRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.labelTop}>
                Horizonte: <strong>{horizon} años</strong>
              </label>
              <input
                type="range" min="1" max="40" step="1"
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                style={styles.range}
              />
            </div>
            <div>
              <label style={styles.labelTop}>Confianza (piso)</label>
              <div style={styles.confRow}>
                {[0.90, 0.95, 0.99].map(c => (
                  <button
                    key={c}
                    onClick={() => setConfidence(c)}
                    style={{ ...styles.confBtn, ...(confidence === c ? styles.confBtnActive : {}) }}
                  >
                    {(c*100).toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Headline result */}
          <div style={styles.headline}>
            <div style={styles.headlineLine}>
              A <strong>{horizon} años</strong>, con un <strong>{(confidence*100).toFixed(0)}%</strong> de probabilidad,
              {dcaMonthly_eff > 0
                ? <> tu inversión de <strong>{fmtUsd(V0_eff)}</strong> + aportes de <strong>{fmtUsd(dcaMonthly_eff)}/mes</strong> valdrá al menos </>
                : <> tu inversión de <strong>{fmtUsd(V0_eff)}</strong> valdrá al menos </>}
              <span style={styles.headlineNumber}> {fmtUsd(horizonScenarios.floors[confidence].value)}</span>
            </div>
            <div style={styles.headlineSub}>
              equivalente a un CAGR mínimo de <strong>{fmtPct(horizonScenarios.floors[confidence].cagr, 2)}</strong>
              {" · "}escenario neutro (mediana): <strong>{fmtUsd(horizonScenarios.scenarios.neutro.value)}</strong> ({fmtPct(horizonScenarios.scenarios.neutro.cagr, 2)} CAGR)
              {dcaMonthly_eff > 0 && (
                <>
                  {" · "}aporte total inyectado: <strong>{fmtUsd(V0_eff + dcaMonthly_eff * 12 * horizon)}</strong>
                </>
              )}
            </div>
          </div>

          {/* Scenarios table */}
          <h3 style={styles.h3}>Escenarios a {horizon} años</h3>
          <div style={styles.scenarioGrid}>
            {[
              ["muyPesimista", "Muy Pesimista", "P1", "negative"],
              ["pesimista", "Pesimista", "P10", "negative"],
              ["neutro", "Neutro (mediana)", "P50", "neutral"],
              ["optimista", "Optimista", "P90", "positive"],
              ["muyOptimista", "Muy Optimista", "P99", "positive"],
            ].map(([k, label, p, accent]) => (
              <ScenarioCard
                key={k}
                label={label}
                percentile={p}
                value={horizonScenarios.scenarios[k].value}
                cagr={horizonScenarios.scenarios[k].cagr}
                accent={accent}
              />
            ))}
          </div>

          {/* Fan chart */}
          <h3 style={styles.h3}>Distribución probabilística del CAGR a {horizon} años</h3>
          <p style={styles.distribIntro}>
            La curva log-normal muestra la densidad de probabilidad de cada CAGR posible. 
            El área sombreada en <span style={{color: "var(--negative)", fontWeight: 600}}>rojo</span> es el {((1-confidence)*100).toFixed(0)}% que evitas al confianza {(confidence*100).toFixed(0)}%; 
            el área <span style={{color: "var(--positive)", fontWeight: 600}}>verde</span> es la zona donde te encontrarás con {(confidence*100).toFixed(0)}% de probabilidad.
          </p>
          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={distributionData} margin={{ top: 30, right: 40, left: 20, bottom: 30 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="cagrPct"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v) => v.toFixed(1) + "%"}
                  stroke="var(--ink-muted)"
                  tick={{ fontSize: 11 }}
                  label={{ value: "CAGR anual (%)", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }}
                />
                <YAxis hide domain={[0, "dataMax"]} />

                {/* Bad tail (below confidence floor) */}
                <ReferenceArea
                  x1={distributionData[0].cagrPct}
                  x2={horizonScenarios.floors[confidence].cagr * 100}
                  fill="var(--negative)"
                  fillOpacity={0.12}
                />
                {/* Good zone (above confidence floor) */}
                <ReferenceArea
                  x1={horizonScenarios.floors[confidence].cagr * 100}
                  x2={distributionData[distributionData.length - 1].cagrPct}
                  fill="var(--positive)"
                  fillOpacity={0.08}
                />

                {/* Density curve */}
                <Area
                  type="monotone"
                  dataKey="density"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="var(--accent)"
                  fillOpacity={0.22}
                  isAnimationActive={false}
                />

                {/* Percentile markers */}
                <ReferenceLine
                  x={horizonScenarios.scenarios.pesimista.cagr * 100}
                  stroke="var(--ink-muted)"
                  strokeDasharray="3 3"
                  label={{ value: "P10", position: "top", fontSize: 10, fill: "var(--ink-muted)", offset: 5 }}
                />
                <ReferenceLine
                  x={horizonScenarios.scenarios.neutro.cagr * 100}
                  stroke="var(--ink)"
                  strokeWidth={2}
                  label={{ value: "Mediana", position: "top", fontSize: 11, fill: "var(--ink)", fontWeight: 600, offset: 5 }}
                />
                <ReferenceLine
                  x={horizonScenarios.scenarios.optimista.cagr * 100}
                  stroke="var(--ink-muted)"
                  strokeDasharray="3 3"
                  label={{ value: "P90", position: "top", fontSize: 10, fill: "var(--ink-muted)", offset: 5 }}
                />
                {/* Confidence floor */}
                <ReferenceLine
                  x={horizonScenarios.floors[confidence].cagr * 100}
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  label={{ value: `Piso ${(confidence*100).toFixed(0)}%`, position: "insideTopLeft", fontSize: 11, fill: "var(--gold)", fontWeight: 700, offset: 8 }}
                />

                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === "density") {
                      const cagr = props.payload.cagrPct;
                      const fv = props.payload.finalValue;
                      return [
                        <span key="line1" style={{display: 'block'}}>{cagr.toFixed(2)}% CAGR → {fmtUsd(fv)}</span>,
                        "Punto"
                      ];
                    }
                    return value;
                  }}
                  labelFormatter={() => ""}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={styles.legend}>
              <span><span style={{...styles.dot, background: "var(--accent)", opacity: 0.5}}/> Densidad de probabilidad</span>
              <span><span style={{...styles.dotSquare, background: "var(--negative)", opacity: 0.4}}/> Cola {((1-confidence)*100).toFixed(0)}% que evitas</span>
              <span><span style={{...styles.dotSquare, background: "var(--positive)", opacity: 0.4}}/> Zona {(confidence*100).toFixed(0)}% probable</span>
              <span><span style={{...styles.dot, background: "var(--gold)"}}/> Piso de confianza</span>
              <span><span style={{...styles.dot, background: "var(--ink)"}}/> Mediana</span>
            </div>
          </div>

          {/* Quick stats below the distribution */}
          <div style={styles.distribStats}>
            <div style={styles.distribStat}>
              <div style={styles.distribStatLabel}>Rango con 50% probabilidad (P25–P75)</div>
              <div style={styles.distribStatValue}>
                {fmtPct(cagrFromMultiple(lognormalPercentile(mu, sigma, horizon, 0.25), horizon), 2)}
                {" — "}
                {fmtPct(cagrFromMultiple(lognormalPercentile(mu, sigma, horizon, 0.75), horizon), 2)}
              </div>
              <div style={styles.distribStatSub}>
                Valor: {fmtUsd(10000 * lognormalPercentile(mu, sigma, horizon, 0.25))}
                {" — "}
                {fmtUsd(10000 * lognormalPercentile(mu, sigma, horizon, 0.75))}
              </div>
            </div>
            <div style={styles.distribStat}>
              <div style={styles.distribStatLabel}>Rango con 80% probabilidad (P10–P90)</div>
              <div style={styles.distribStatValue}>
                {fmtPct(horizonScenarios.scenarios.pesimista.cagr, 2)}
                {" — "}
                {fmtPct(horizonScenarios.scenarios.optimista.cagr, 2)}
              </div>
              <div style={styles.distribStatSub}>
                Valor: {fmtUsd(horizonScenarios.scenarios.pesimista.value)}
                {" — "}
                {fmtUsd(horizonScenarios.scenarios.optimista.value)}
              </div>
            </div>
            <div style={styles.distribStat}>
              <div style={styles.distribStatLabel}>Probabilidad de NO perder dinero</div>
              <div style={styles.distribStatValue}>
                {(() => {
                  // P(V_T > V_0) = P(log return > 0)
                  const xMean = mu - 0.5 * sigma * sigma;
                  const xStd = sigma / Math.sqrt(horizon);
                  // P(X > 0) where X ~ N(xMean, xStd)
                  // Use standard normal CDF approximation
                  const z = xMean / xStd;
                  const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
                  return fmtPct(cdf, 1);
                })()}
              </div>
              <div style={styles.distribStatSub}>P(CAGR &gt; 0) en {horizon} años</div>
            </div>
            <div style={styles.distribStat}>
              <div style={styles.distribStatLabel}>Probabilidad de batir 8% anual</div>
              <div style={styles.distribStatValue}>
                {(() => {
                  const xMean = mu - 0.5 * sigma * sigma;
                  const xStd = sigma / Math.sqrt(horizon);
                  const target = Math.log(1.08);
                  const z = (xMean - target) / xStd;
                  const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
                  return fmtPct(cdf, 1);
                })()}
              </div>
              <div style={styles.distribStatSub}>P(CAGR &gt; 8%) en {horizon} años</div>
            </div>
          </div>

          {/* ============ Barra de Objetivos ============ */}
          {(() => {
            const iefIdx   = ASSETS.findIndex(a => a.id === "ief");
            const pfpenIdx = ASSETS.findIndex(a => a.id === "pfpen");
            const cspxIdx  = ASSETS.findIndex(a => a.id === "cspx");

            // 5 metas, ordenadas de más fácil a más difícil de batir.
            // Las metas "ajustables" toman su rentabilidad de customReturns / histRet
            // (editado en la pestaña Cartera y Riesgo).
            const goals = [
              {
                id: "infl",
                icon: "📈",
                name: "Inflación",
                target: 0.03,
                hint: "3% anual — proxy estándar de inflación",
              },
              {
                id: "rfusd",
                icon: "🏦",
                name: "Risk-Free",
                target: customReturns[iefIdx] ?? ASSETS[iefIdx].ret,
                hint: "Treasury 10Y (IEF) · editable en Cartera y Riesgo",
              },
              {
                id: "pfpen",
                icon: "💵",
                name: "PF Pen",
                target: customReturns[pfpenIdx] ?? ASSETS[pfpenIdx].ret,
                hint: "Plazo Fijo PEN · editable en Cartera y Riesgo",
              },
              {
                id: "sp8",
                icon: "🎯",
                name: "S&P500 8%",
                target: 0.08,
                hint: "8% anual — premisa conservadora de largo plazo",
              },
              {
                id: "sp10y",
                icon: "🚀",
                name: "S&P500 histórico 10y",
                target: ASSETS[cspxIdx].histRet,
                hint: "Promedio histórico CSPX cargado en Cartera y Riesgo",
              },
            ];

            // Probabilidad lognormal de superar cada meta en el horizonte actual.
            // P(CAGR > r) = Φ((μ - σ²/2 - ln(1+r)) / (σ/√T))
            const xMean = mu - 0.5 * sigma * sigma;
            const xStd  = sigma > 0 ? sigma / Math.sqrt(horizon) : 1e-12;
            const goalsWithProb = goals.map(g => {
              const tgt = Math.log(1 + g.target);
              let prob;
              if (sigma > 0) {
                const z = (xMean - tgt) / xStd;
                prob = 0.5 * (1 + erf(z / Math.sqrt(2)));
              } else {
                prob = xMean > tgt ? 1 : (xMean === tgt ? 0.5 : 0);
              }
              return { ...g, prob };
            });

            const probColor = (p) => {
              if (p >= 0.95) return "var(--positive)";
              if (p >= 0.80) return "#4a8b5e";
              if (p >= 0.60) return "var(--gold)";
              if (p >= 0.40) return "#c97a2e";
              return "var(--negative)";
            };

            // Umbrales en el orden visual (izquierda → derecha)
            const thresholds = [0.50, 0.60, 0.70, 0.80, 0.90, 0.95, 0.99];
            const highestPassed = (p) => {
              const hit = thresholds.filter(t => p >= t);
              return hit.length ? hit[hit.length - 1] : null;
            };

            return (
              <>
                <h3 style={styles.h3}>Probabilidad de batir benchmarks a {horizon} años</h3>
                <p style={styles.distribIntro}>
                  Probabilidad lognormal de que tu cartera supere cada benchmark en {horizon} años,
                  usando tu <strong>μ = {fmtPct(mu, 2)}</strong> y <strong>σ = {fmtPct(sigma, 2)}</strong> actuales.
                  Las metas ajustables (Risk-Free, PF Pen, S&P500 histórico 10y) toman su rentabilidad de la
                  pestaña <em>Cartera y Riesgo</em>; cámbialas ahí y la barra se actualiza.
                </p>

                <div style={styles.benchmarksBox}>
                  {/* Header de columnas con niveles de confianza como títulos prominentes sobre la barra */}
                  <div style={styles.benchmarksHeader}>
                    <span style={styles.benchmarksColName}>Benchmark</span>
                    <span style={styles.benchmarksColMeta}>Meta</span>
                    <span style={styles.benchmarksColBar}>
                      <div style={styles.benchmarksTickLabelsRow}>
                        {[0.50, 0.80, 0.95, 0.99].map(t => (
                          <span
                            key={t}
                            style={{
                              ...styles.benchmarksTickLabel,
                              left: `${t * 100}%`,
                            }}
                          >
                            {(t * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </span>
                    <span style={styles.benchmarksColProb}>%</span>
                    <span style={styles.benchmarksColSpread}>Spread</span>
                  </div>
                  {goalsWithProb.map(g => {
                    const passed = highestPassed(g.prob);
                    const fillPct = Math.min(100, Math.max(0, g.prob * 100));
                    const color = probColor(g.prob);
                    const spread = mu - g.target;
                    return (
                      <div key={g.id} style={styles.benchmarkRow} title={g.hint}>
                        {/* Nombre con icon */}
                        <span style={styles.benchmarksColName}>
                          <span style={styles.benchmarkIcon}>{g.icon}</span>
                          {g.name}
                        </span>
                        {/* Meta CAGR */}
                        <span style={styles.benchmarksColMeta}>
                          {fmtPct(g.target, 2)}
                        </span>
                        {/* Barra horizontal compacta con ticks finos */}
                        <span style={styles.benchmarksColBar}>
                          <span style={styles.benchmarkBarTrack}>
                            <span
                              style={{
                                ...styles.benchmarkBarFill,
                                width: `${fillPct}%`,
                                background: color,
                              }}
                            />
                            {thresholds.map(t => (
                              <span
                                key={t}
                                style={{
                                  ...styles.benchmarkBarTickFine,
                                  left: `${t * 100}%`,
                                }}
                                title={`Umbral ${(t*100).toFixed(0)}%`}
                              />
                            ))}
                          </span>
                        </span>
                        {/* Porcentaje + status icon */}
                        <span style={{ ...styles.benchmarksColProb, color }}>
                          {(g.prob * 100).toFixed(1)}%
                          {passed !== null
                            ? <span style={{ marginLeft: 4, fontWeight: 700 }}>✓</span>
                            : <span style={{ marginLeft: 4, color: "var(--negative)", fontWeight: 700 }}>✗</span>}
                        </span>
                        {/* Spread vs cartera */}
                        <span style={{
                          ...styles.benchmarksColSpread,
                          color: spread >= 0 ? "var(--positive)" : "var(--negative)",
                        }}>
                          {spread >= 0 ? "+" : ""}{fmtPct(spread, 2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p style={styles.goalsFootnote}>
                  Modelo lognormal sin rebalanceo dinámico. Spread = μcartera − meta benchmark.
                </p>

                {/* ============ Gráfico: Probabilidad de batir cada benchmark vs tiempo ============ */}
                {(() => {
                  // Construir serie temporal: para cada año t en 1..MAX, P(CAGR cartera > meta) por benchmark
                  const MAX_YRS = 40;
                  const xMeanLN = mu - 0.5 * sigma * sigma;
                  const timeData = [];
                  for (let t = 1; t <= MAX_YRS; t++) {
                    const point = { year: t };
                    goals.forEach(g => {
                      const tgt = Math.log(1 + g.target);
                      let prob;
                      if (sigma > 0) {
                        const z = (xMeanLN - tgt) * Math.sqrt(t) / sigma;
                        prob = 0.5 * (1 + erf(z / Math.sqrt(2)));
                      } else {
                        prob = xMeanLN > tgt ? 1 : (xMeanLN === tgt ? 0.5 : 0);
                      }
                      point[g.id] = prob * 100;
                    });
                    timeData.push(point);
                  }

                  // Años necesarios para alcanzar cada nivel de confianza por benchmark.
                  // P(CAGR > r) ≥ p  ⇔  (μ-σ²/2 - log(1+r)) × √T / σ ≥ z_p
                  // Solo posible si μ-σ²/2 > log(1+r); si no, la prob CAE con el tiempo.
                  const Z_MAP = { 50: 0, 60: 0.2533, 70: 0.5244, 80: 0.8416, 90: 1.2816, 95: 1.6449, 99: 2.3263 };
                  const milestones = goals.map(g => {
                    const tgt = Math.log(1 + g.target);
                    const delta = xMeanLN - tgt;
                    const yrs = {};
                    Object.entries(Z_MAP).forEach(([p, z]) => {
                      if (sigma <= 0) {
                        yrs[p] = delta > 0 ? 0.01 : null;
                      } else if (delta <= 0) {
                        yrs[p] = null; // benchmark inalcanzable con esa confianza (μ-σ²/2 < log(1+r))
                      } else {
                        yrs[p] = Math.pow(z * sigma / delta, 2);
                      }
                    });
                    return { ...g, yrs };
                  });

                  // Colores por benchmark (de "fácil" a "difícil")
                  const benchColors = {
                    infl:  "#5a9d6e",   // verde
                    rfusd: "#3a5a7c",   // teal-blue
                    pfpen: "#b8923a",   // gold
                    sp8:   "#c97a2e",   // naranja
                    sp10y: "#7a1b1b",   // burgundy
                  };

                  // Niveles a marcar visualmente (en %)
                  const CONFIDENCE_LEVELS = [50, 80, 95, 99];

                  // Formato amigable de años
                  const fmtYrs = (y) => {
                    if (y === null || y === undefined) return "—";
                    if (y > 200) return "200+";
                    if (y < 0.5) return "<1";
                    if (y < 10) return `${y.toFixed(1)}`;
                    return `${y.toFixed(0)}`;
                  };

                  return (
                    <>
                      <h3 style={styles.h3}>¿Cuántos años necesito para batir cada benchmark?</h3>
                      <p style={styles.distribIntro}>
                        Para cada benchmark, la línea muestra cómo evoluciona la <strong>probabilidad de superar</strong> a medida que pasa el tiempo.
                        Para los benchmarks <em>alcanzables</em> (meta &lt; μ−σ²/2 de tu cartera), la línea sube hacia 100% conforme la volatilidad se promedia.
                        Para los <em>no alcanzables</em>, la línea baja hacia 0%: el tiempo no ayuda, la cartera estructuralmente no rinde lo suficiente.
                      </p>

                      <div style={styles.chartWrap}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={timeData} margin={{ top: 14, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                            <XAxis
                              dataKey="year"
                              stroke="var(--ink-muted)"
                              tick={{ fontSize: 11 }}
                              label={{ value: "Años", position: "insideBottom", offset: -8, style: { fontSize: 11, fill: "var(--ink-muted)" } }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tickFormatter={(v) => `${v}%`}
                              stroke="var(--ink-muted)"
                              tick={{ fontSize: 11 }}
                              label={{ value: "Probabilidad de superar", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--ink-muted)" } }}
                            />
                            <Tooltip
                              formatter={(v, name) => [`${v.toFixed(1)}%`, name]}
                              labelFormatter={(t) => `Año ${t}`}
                              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                            {/* Líneas de referencia horizontales en los niveles de confianza */}
                            {CONFIDENCE_LEVELS.map(p => (
                              <ReferenceLine
                                key={p}
                                y={p}
                                stroke="rgba(0,0,0,0.25)"
                                strokeDasharray="3 4"
                                label={{ value: `${p}%`, position: "right", fontSize: 9, fill: "var(--ink-muted)" }}
                              />
                            ))}
                            {/* Línea vertical en el horizonte actual */}
                            <ReferenceLine x={horizon} stroke="var(--ink)" strokeDasharray="3 3" label={{ value: `T = ${horizon}y`, position: "top", fontSize: 10, fill: "var(--ink)" }} />
                            {/* Una línea por benchmark */}
                            {goals.map(g => (
                              <Line
                                key={g.id}
                                type="monotone"
                                dataKey={g.id}
                                stroke={benchColors[g.id]}
                                strokeWidth={2}
                                dot={false}
                                name={`${g.name} (${fmtPct(g.target, 2)})`}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* ============ Tabla de años necesarios por nivel de confianza ============ */}
                      <h3 style={{ ...styles.h3, marginTop: 22 }}>Años necesarios para batir con X% de confianza</h3>
                      <div style={styles.milestonesTableWrap}>
                        <table style={styles.milestonesTable}>
                          <thead>
                            <tr>
                              <th style={styles.milestonesThLeft}>Benchmark</th>
                              <th style={styles.milestonesTh}>Meta</th>
                              {CONFIDENCE_LEVELS.map(p => (
                                <th key={p} style={styles.milestonesTh}>{p}%</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {milestones.map(g => {
                              const delta = xMeanLN - Math.log(1 + g.target);
                              const reachable = delta > 0;
                              return (
                                <tr key={g.id} style={{ borderTop: "1px dotted var(--border)" }}>
                                  <td style={styles.milestonesTdName}>
                                    <span style={{ ...styles.milestonesColorDot, background: benchColors[g.id] }} />
                                    <span style={styles.benchmarkIcon}>{g.icon}</span>
                                    {g.name}
                                  </td>
                                  <td style={styles.milestonesTd}>{fmtPct(g.target, 2)}</td>
                                  {CONFIDENCE_LEVELS.map(p => {
                                    const y = g.yrs[p];
                                    const isInfinite = y === null;
                                    return (
                                      <td key={p} style={{
                                        ...styles.milestonesTd,
                                        color: isInfinite ? "var(--negative)" : (y > MAX_YRS ? "var(--ink-muted)" : "var(--ink)"),
                                        fontWeight: isInfinite || y > MAX_YRS ? 500 : 700,
                                      }}>
                                        {fmtYrs(y)}{y !== null && y < 200 ? "y" : ""}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={styles.milestonesNote}>
                          <strong>Lectura:</strong> los benchmarks <em>alcanzables</em> (meta &lt; μ−σ²/2 de tu cartera) muestran años finitos.
                          Los <span style={{ color: "var(--negative)", fontWeight: 700 }}>—</span> indican que esa meta es <em>inalcanzable</em> con esa confianza:
                          la rentabilidad esperada de la cartera es estructuralmente menor que la meta, así que más tiempo solo aumenta la incertidumbre sin acercarte.
                          Valores ≥ {MAX_YRS}y se muestran en gris (escala fuera del gráfico).
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            );
          })()}
        </section>
      )}

      {/* ============== TAB: PIGNORACIÓN ============== */}
      {tab === "pignoracion" && (
        <section style={styles.section}>
          {/* HERO */}
          <div style={styles.pignHero}>
            <h2 style={styles.pignHeroTitle}>Pignoración</h2>
            <p style={styles.pignHeroSub}>
              Apalancá tu cartera y vivi del crédito. Cada año retirás el <strong>menor</strong> entre una tasa fija
              del patrimonio neto y un monto objetivo en USD. Al inicio domina la tasa (NW chico → retiro chico);
              cuando la cartera crece lo suficiente, se activa el techo del monto deseado.
            </p>
          </div>

          {/* RECUADRO DESTACADO — MONTO DESEADO */}
          <div style={styles.withdrawalHero}>
            <div style={styles.withdrawalHeroLeft}>
              <div style={styles.withdrawalHeroLabel}>Monto deseado para retirar (techo)</div>
              <div style={styles.withdrawalHeroInputRow}>
                <span style={styles.withdrawalHeroPrefix}>USD</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={withdrawalMonthly}
                  onChange={(e) => setWithdrawalMonthly(e.target.value.replace(/[^0-9.,]/g, ""))}
                  style={styles.withdrawalHeroInput}
                  placeholder="4000"
                />
                <span style={styles.withdrawalHeroSuffix}>/mes</span>
              </div>
              <div style={styles.withdrawalHeroDesc}>
                Cada año retiras el <strong>menor</strong> entre <code>{fmtPct(withdrawalRate, 1)} × NW</code> y <strong>{fmtUsd(withdrawalMonthly_eff)}/mes</strong>.
                Al inicio domina la tasa (NW chico → retiro chico, preservás capital). Cuando la cartera crece y <code>{fmtPct(withdrawalRate, 1)} × NW &gt; ${withdrawalMonthly_eff}</code>, se activa el techo.
              </div>
            </div>
            <div style={styles.withdrawalHeroRight}>
              <div style={styles.withdrawalHeroRatioLabel}>Año del cruce (estimado)</div>
              <div style={styles.withdrawalHeroRatioValue}>
                {withdrawalMonthly_eff > 0 && withdrawalRate > 0 && V0_eff > 0
                  ? (() => {
                      // Estimar año en que rate × NW(t) iguala desired, asumiendo crecimiento mediano sin retiros
                      const NW_target = withdrawalMonthly_eff * 12 / withdrawalRate;
                      const muEff = mu + leverage * (mu - intRate);
                      const driftMedian = muEff - 0.5 * sigma * sigma;
                      const yearCross = NW_target > V0_eff && driftMedian > 0
                        ? Math.log(NW_target / V0_eff) / driftMedian
                        : 0;
                      return yearCross > 0 && yearCross < 100 ? `año ${yearCross.toFixed(1)}` : "—";
                    })()
                  : "—"}
              </div>
              <div style={styles.withdrawalHeroRatioDesc}>
                cuando NW × {fmtPct(withdrawalRate, 1)} = {fmtUsd(withdrawalMonthly_eff * 12)}/año (estimación mediana)
              </div>
            </div>
          </div>

          {/* CONTROLES SIMPLIFICADOS */}
          <div style={styles.pignControlsGridSimple}>
            <SliderControl label="Apalancamiento inicial" value={leverage}
              min={0} max={1.0} step={0.05} onChange={setLeverage}
              fmt={v => fmtPct(v, 0)}
              hint={`cartera ${(1+leverage).toFixed(2)}× capital propio`} />
            <SliderControl label="Tasa préstamo" value={intRate}
              min={0.02} max={0.10} step={0.0025} onChange={setIntRate}
              fmt={v => fmtPct(v, 2)} hint="anual fija" />
            <SliderControl label="Umbral margin call" value={mcLTV}
              min={0.50} max={0.85} step={0.05} onChange={setMcLTV}
              fmt={v => fmtPct(v, 0)} hint="L/V máximo del banco" />
            <SliderControl label="Tasa de retiro" value={withdrawalRate}
              min={0} max={0.10} step={0.0025} onChange={setWithdrawalRate}
              fmt={v => fmtPct(v, 2)} hint="% NW · piso de seguridad" />
            <div style={styles.horizonLink}>
              <div style={styles.sliderLabel}>HORIZONTE</div>
              <div style={styles.horizonLinkValue}>{horizon} años</div>
              <button onClick={() => setTab("horizonte")} style={styles.horizonLinkBtn}>
                ajustar en pestaña III →
              </button>
            </div>
          </div>

          <div style={styles.runRow}>
            <button onClick={runPledge}
              style={{
                ...styles.runBtn,
                ...(paramsStale ? { boxShadow: "0 0 0 2px var(--gold)", background: "var(--gold)" } : {}),
              }}
              disabled={pledgeRunning}>
              {pledgeRunning ? "Simulando..." : pledgeResult ? (paramsStale ? "⚠ Recalcular con nuevos parámetros" : "↻ Recalcular") : "▶ Correr Monte Carlo"}
            </button>
            <span style={styles.runHint}>
              μ <strong>{fmtPct(mu, 2)}</strong> · σ <strong>{fmtPct(sigma, 2)}</strong>
              {dcaMonthly_eff > 0 && <> · DCA <strong>{fmtUsd(dcaMonthly_eff)}/mes</strong></>}
              {" · "}10,000 paths MC
              {paramsStale && (
                <span style={styles.staleBadge}>
                  Parámetros cambiados desde la última simulación
                </span>
              )}
            </span>
          </div>

          {!pledgeResult ? (
            <div style={styles.placeholder}>
              Configurá los parámetros arriba y corré la simulación.
            </div>
          ) : (
            <>
              {/* HEADLINE — 5 metrics inline incl. beneficio del apalancamiento */}
              <div style={styles.pignHeadlineHero}>
                <div style={styles.pignHeadlineItem}>
                  <div style={styles.pignHeadlineLabel}>Patrimonio neto al año {pledgeResult._params.T}</div>
                  <div style={styles.pignHeadlineValue}>
                    {fmtUsd(pledgeResult.netPatrimony_p50)}
                  </div>
                  <div style={styles.pignHeadlineSub}>
                    <strong>{(pledgeResult.netPatrimony_p50 / V0_eff).toFixed(2)}×</strong> capital inicial
                    {pledgeResult.yearStats[pledgeResult._params.T]?.nw_p1 !== undefined && (
                      <> · peor 1%: <strong style={{ color: "var(--negative)" }}>{fmtUsdCompact(Math.max(0, pledgeResult.yearStats[pledgeResult._params.T].nw_p1))}</strong></>
                    )}
                  </div>
                </div>
                <div style={styles.pignHeadlineDivider} />
                <div style={styles.pignHeadlineItem}>
                  <div style={styles.pignHeadlineLabel}>Beneficio del apalancamiento</div>
                  {leverage > 0 ? (() => {
                    const baseNW = pledgeResult.baseline?.netPatrimony_p50 ?? pledgeResult.netPatrimony_p50;
                    const delta = pledgeResult.netPatrimony_p50 - baseNW;
                    const pct = baseNW !== 0 ? (delta / Math.abs(baseNW)) * 100 : 0;
                    const color = delta > 0 ? "var(--positive)" : delta < 0 ? "var(--negative)" : "var(--ink)";
                    return (
                      <>
                        <div style={{ ...styles.pignHeadlineValue, color }}>
                          {delta >= 0 ? "+" : ""}{fmtUsd(delta)}
                        </div>
                        <div style={styles.pignHeadlineSub}>
                          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}% vs leverage 0% ({fmtUsd(baseNW)})
                        </div>
                      </>
                    );
                  })() : (
                    <>
                      <div style={{ ...styles.pignHeadlineValue, color: "var(--ink-muted)" }}>—</div>
                      <div style={styles.pignHeadlineSub}>(leverage 0% · activá para comparar)</div>
                    </>
                  )}
                </div>
                <div style={styles.pignHeadlineDivider} />
                <div style={styles.pignHeadlineItem}>
                  <div style={styles.pignHeadlineLabel}>P(margin call)</div>
                  <div style={{
                    ...styles.pignHeadlineValue,
                    color: pledgeResult.mcProb < 0.05 ? "var(--positive)" : pledgeResult.mcProb < 0.10 ? "var(--gold)" : "var(--negative)",
                  }}>
                    {fmtPct(pledgeResult.mcProb, 1)}
                  </div>
                  <div style={styles.pignHeadlineSub}>
                    Confianza {fmtPct(1 - pledgeResult.mcProb, 1)}
                    {pledgeResult.avgMCTime !== null && <> · típicamente año {pledgeResult.avgMCTime.toFixed(1)}</>}
                  </div>
                </div>
                <div style={styles.pignHeadlineDivider} />
                <div style={styles.pignHeadlineItem}>
                  <div style={styles.pignHeadlineLabel}>LTV al año {pledgeResult._params.T}</div>
                  <div style={{
                    ...styles.pignHeadlineValue,
                    color: pledgeResult.yearStats[pledgeResult._params.T].ltv_p50 < 50 ? "var(--positive)" : pledgeResult.yearStats[pledgeResult._params.T].ltv_p50 < 65 ? "var(--gold)" : "var(--negative)",
                  }}>
                    {(pledgeResult.yearStats[pledgeResult._params.T].ltv_p50).toFixed(1)}%
                  </div>
                  <div style={styles.pignHeadlineSub}>
                    inicial {(leverage / (1 + leverage) * 100).toFixed(1)}% · margen al umbral {(mcLTV * 100 - pledgeResult.yearStats[pledgeResult._params.T].ltv_p50).toFixed(1)} pp
                  </div>
                </div>
              </div>

              {/* GRÁFICO 1 — PATRIMONIO NETO POR ESCENARIOS (áreas) */}
              <div style={styles.pignChartSection}>
                <div style={styles.pignSectionHeader}>
                  <h3 style={styles.pignSectionTitle}>Patrimonio neto a lo largo del tiempo · por escenario</h3>
                  <p style={styles.pignSectionDesc}>
                    Bandas concéntricas muestran 7 escenarios — desde la <strong>cola extrema p1 (peor 1%)</strong>
                    hasta la <strong>cola extrema p99 (mejor 1%)</strong>, capturando 98% de los caminos simulados.
                    La banda más clara abajo es el <strong>peor escenario al 99% de confianza</strong>: tu NW al año T
                    no debería ser inferior al valor de esa banda con probabilidad del 99%.
                    Con leverage 0% y retiro $0, la mediana debe coincidir con el escenario neutro de la pestaña III.
                  </p>
                </div>
                <NetWorthAreaChart pledgeResult={pledgeResult} T={pledgeResult._params.T} V0Propio={V0_eff} />
              </div>

              {/* GRÁFICO 2 — ¿CUÁNDO TOCO EL UMBRAL? */}
              <div style={styles.pignChartSection}>
                <div style={styles.pignSectionHeader}>
                  <h3 style={styles.pignSectionTitle}>¿Cuándo toco el margin call?</h3>
                  <p style={styles.pignSectionDesc}>
                    Trayectoria de la LTV para 5 niveles fijos de monto deseado: <strong>1%, 2%, 3%, 4%, 5% de V₀ anual</strong>
                    (independientes de tu input). Cada nivel tiene <strong>dos líneas del mismo color</strong>:
                    <strong> sólida = mediana</strong> (escenario neutro) y <strong>punteada = p99</strong> (escenario extremo, peor 1%).
                    Si la línea sólida cruza el umbral rojo, el retiro es insostenible en mediana.
                    <strong> Si la punteada NO cruza, estás seguro al 99%</strong> — solo 1 de cada 100 escenarios tocaría margin call.
                  </p>
                </div>
                {!marginCallCurves ? (
                  <div style={styles.placeholder}>Calculando curvas…</div>
                ) : (
                  <MarginCallCurvesChart marginCallCurves={marginCallCurves} mcLTV={mcLTV} T={pledgeResult._params.T} />
                )}
                {marginCallCurves && (
                  <div style={styles.mcCurveCards}>
                    {marginCallCurves.map((c, idx) => {
                      const colors = ["#2d7a40", "#7aa83a", "#b89535", "#c97a2e", "#a83a35"];
                      const crossesMedian = c.crossYearMedian !== null;
                      const crossesStress = c.crossYearStress !== null;
                      return (
                        <div key={idx} style={{
                          ...styles.mcCurveCard,
                          borderColor: colors[idx],
                        }}
                        onClick={() => { setWithdrawalMonthly(String(Math.round(c.monthly))); setTimeout(() => runPledge(), 60); }}>
                          <div style={{ ...styles.mcCurveLabel, color: colors[idx] }}>{c.label}</div>
                          <div style={styles.mcCurveSubLabel}>{fmtUsd(c.monthly)}/mes deseado</div>
                          <div style={styles.mcCurveMetric}>
                            <span style={styles.mcCurveMetricLabel}>P(MC):</span>
                            <span style={{ fontWeight: 600, color: c.mcProb < 0.05 ? "var(--positive)" : c.mcProb < 0.10 ? "var(--gold)" : "var(--negative)" }}>
                              {fmtPct(c.mcProb, 1)}
                            </span>
                          </div>
                          <div style={styles.mcCurveMetric}>
                            <span style={styles.mcCurveMetricLabel}>LTV año {pledgeResult._params.T}:</span>
                            <span style={{ fontWeight: 600, fontSize: 10.5 }}>
                              {c.ltv_p50_final.toFixed(1)}% / {c.ltv_p99_final.toFixed(1)}%
                            </span>
                          </div>
                          <div style={styles.mcCurveMetric}>
                            <span style={styles.mcCurveMetricLabel}>NW final p50:</span>
                            <span style={{ fontWeight: 600 }}>{fmtUsdCompact(c.netFinal_p50)}</span>
                          </div>
                          <div style={{
                            ...styles.mcCurveStatus,
                            color: crossesMedian ? "var(--negative)" : crossesStress ? "var(--gold)" : "var(--positive)",
                          }}>
                            {crossesMedian
                              ? `⚠ Mediana cruza año ${c.crossYearMedian}`
                              : crossesStress
                                ? `△ p99 cruza año ${c.crossYearStress}`
                                : "✓ Ni mediana ni p99 cruzan"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TABLA DE SENSIBILIDAD COMPLETA */}
              <details style={styles.pignDetails}>
                <summary style={styles.pignSummary}>
                  Tabla de sensibilidad · {confidenceTable?.rows.length || 0} niveles de monto deseado desde 0% hasta 8% (anual sobre V₀)
                </summary>
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    Click en cualquier fila para aplicar ese monto. La columna <strong>"Realizado p50"</strong> muestra el retiro promedio mediano
                    efectivamente realizado (puede ser menor al deseado en años tempranos cuando domina la tasa {fmtPct(withdrawalRate, 1)} × NW).
                  </p>
                  {confidenceTable && (
                    <ConfidenceSensitivityTableV2
                      confidenceTable={confidenceTable}
                      V0Propio={V0_eff}
                      currentAnnualPct={V0_eff > 0 ? (withdrawalMonthly_eff * 12) / V0_eff : 0}
                      onApply={(monthlyUSD) => { setWithdrawalMonthly(String(Math.round(monthlyUSD))); setTimeout(() => runPledge(), 60); }}
                    />
                  )}
                </div>
              </details>

              {/* AÑO POR AÑO COLAPSABLE */}
              <details style={styles.pignDetails}>
                <summary style={styles.pignSummary}>
                  Detalle año por año · V, L, retiro realizado, % efectivo, LTV, NW
                </summary>
                <div style={{ marginTop: 14 }}>
                  <YearByYearTable pledgeResult={pledgeResult} T={pledgeResult._params.T} V0Propio={V0_eff} />
                </div>
              </details>

              {/* MECÁNICA */}
              <div style={styles.pignMechBox}>
                <div style={styles.pignMechTitle}>Mecánica anual del modelo</div>
                <ol style={styles.pignMechList}>
                  <li>La cartera <strong>V</strong> crece por GBM: <code>V × exp((μ − σ²/2) + σZ)</code> + DCA</li>
                  <li>Patrimonio neto pre-retiro: <code>NW = V − L</code></li>
                  <li>Retiro del año: <code>W = min({fmtPct(withdrawalRate, 1)} × NW, {fmtUsd(withdrawalMonthly_eff * 12)}/año)</code> — el <strong>menor</strong></li>
                  <li>Préstamo: <code>L_t = L_(t−1) × (1 + {fmtPct(intRate, 2)}) + W</code></li>
                  <li>Margin call si <code>L_t / V_t &gt; {fmtPct(mcLTV, 0)}</code></li>
                  <li>Patrimonio neto al cierre: <code>NW_t = V_t − L_t</code></li>
                </ol>
                <div style={{ ...styles.pignMechTitle, marginTop: 14 }}>Sanity check</div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.55 }}>
                  Con <code>leverage = 0%</code> y <code>retiro = $0</code>, el patrimonio neto mediano al año {pledgeResult._params.T} debe
                  coincidir con el escenario neutro de la pestaña III: <code>V₀ × exp((μ − σ²/2) × T)</code> + aportes DCA.
                  Eso es <strong>{fmtUsd(V0_eff * Math.exp((mu - 0.5 * sigma * sigma) * pledgeResult._params.T))}</strong> ignorando DCA.
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ============== TAB: BACKTESTING (WALK-FORWARD) ============== */}
      {tab === "backtest" && (
        <section style={styles.section}>
          <div style={styles.markowitzHeader}>
            <div>
              <h2 style={styles.h2}>Backtesting Walk-Forward · vs S&P 500</h2>
              <p style={styles.intro}>
                Tres líneas sobre data histórica real ({marketData?.meta?.month_from ?? "—"} → {marketData?.meta?.month_to ?? "—"}):
                {" "}<strong style={{ color: "var(--accent)" }}>HOY hold</strong> = tus pesos actuales aplicados a la historia,
                {" "}<strong style={{ color: "var(--gold)" }}>Walk-forward</strong> = en cada rebalanceo re-optimizo Markowitz con σ/corr de los últimos 24 meses (μ = tus supuestos), y
                {" "}<strong style={{ color: "var(--ink)" }}>S&P 500</strong> = benchmark puro (CSPX). Burn-in 24 meses (no rebal hasta tener ventana completa).
              </p>
            </div>
            <button onClick={runBacktestSim} style={styles.runBtn} disabled={backtestRunning || !marketData?.monthly_returns}>
              {backtestRunning ? "Simulando..." : backtestResult ? "Re-correr" : "Correr Backtest"}
            </button>
          </div>

          <div style={styles.btControls}>
            <div style={styles.btControlGroup}>
              <span style={styles.labelTop}>Frecuencia de rebalanceo</span>
              <div style={styles.confRow}>
                {[1, 3, 6, 12].map(m => (
                  <button
                    key={m}
                    onClick={() => setRebalanceFreq(m)}
                    style={{ ...styles.confBtn, ...(rebalanceFreq === m ? styles.confBtnActive : {}) }}
                  >
                    {m === 1 ? "1 mes" : m === 12 ? "1 año" : `${m} meses`}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.btControlGroup}>
              <span style={styles.labelTop}>Ventana móvil σ/corr</span>
              <div style={styles.confRow}>
                <button style={{ ...styles.confBtn, ...styles.confBtnActive }}>24 meses (fijo)</button>
              </div>
            </div>
          </div>

          {!marketData && (
            <div style={{ ...styles.placeholder, color: "var(--gold)" }}>
              ⚠ Sin JSON de datos de mercado cargado.
              <br/><span style={{fontSize: 11, opacity: 0.85}}>
                Subí un <code>yfinance_results.json</code> arriba (botón <strong>📂 Cargar JSON</strong>). El backtest walk-forward necesita la matriz mensual de retornos reales para correr.
              </span>
            </div>
          )}

          {marketData && !marketData.monthly_returns && (
            <div style={{ ...styles.placeholder, color: "var(--negative)" }}>
              ⚠ Tu JSON está cargado pero le falta <code>monthly_returns</code> y <code>monthly_dates</code>.
              <br/><span style={{fontSize: 11, opacity: 0.85}}>
                Regenerá el JSON con la versión actualizada del <code>download_data.py</code> (incluye matriz mensual N×16 para el backtest histórico real).
              </span>
            </div>
          )}

          {marketData?.monthly_returns && !backtestResult && !backtestRunning && (() => {
            // Ventana efectiva basada en los activos con peso > 0 del portafolio actual
            const win = computeBacktestWindow(marketData.monthly_returns, weights);
            const totalMonths = marketData.monthly_returns.length;
            const effective = Math.max(0, win.nMonths - 24);
            const tooShort = effective < 12;
            const inceptions = marketData.meta?.inception_dates || {};
            const limitingNames = win.limitingIndices.map(i => {
              const key = ASSETS[i]?.id || `idx${i}`;
              const tk = marketData.meta?.tickers_used?.[key] || key;
              const inc = inceptions[key] || "?";
              return `${tk} (${inc})`;
            });
            return (
              <div style={{ ...styles.placeholder, color: tooShort ? "var(--negative)" : undefined }}>
                {tooShort ? "⚠ " : ""}{totalMonths} meses totales en el JSON · ventana efectiva del portafolio actual: <strong>{win.nMonths} meses</strong> ({effective} efectivos post burn-in 24m).
                {tooShort && (
                  <>
                    <br/><span style={{fontSize: 11.5, opacity: 0.95}}>
                      Con {effective} {effective === 1 ? "mes" : "meses"} efectivos no se puede comparar frecuencias de rebalanceo de forma significativa.
                    </span>
                    {limitingNames.length > 0 && (
                      <>
                        <br/><span style={{fontSize: 11, opacity: 0.85, color: "var(--ink-muted)"}}>
                          <strong>Activos limitantes en tu cartera:</strong> {limitingNames.join(", ")}. Reducí su peso a 0% o reemplazá esos tickers por otros con más historia.
                        </span>
                      </>
                    )}
                  </>
                )}
                {!tooShort && (
                  <>
                    <br/><span style={{fontSize: 11, opacity: 0.7}}>
                      Tip: prueba la misma cartera con 1m / 3m / 6m / 1y y compara CAGR y drawdown.
                    </span>
                  </>
                )}
              </div>
            );
          })()}

          {backtestResult && (
            <>
              {/* Tres cards de métricas: HOY hold / Walk-forward / S&P */}
              <div style={styles.btMetricsGrid}>
                <BacktestLineCard
                  title="HOY hold"
                  subtitle="Pesos actuales · sin rebalanceo"
                  data={backtestResult.metrics.hold}
                  accent="accent"
                  V0={10000}
                />
                <BacktestLineCard
                  title={`Walk-forward · ${rebalanceFreq === 1 ? "1m" : rebalanceFreq === 12 ? "1y" : `${rebalanceFreq}m`}`}
                  subtitle={`${backtestResult.nReopt} re-optimizaciones · ventana 24m`}
                  data={backtestResult.metrics.wf}
                  accent="gold"
                  V0={10000}
                />
                <BacktestLineCard
                  title="S&P 500 (CSPX)"
                  subtitle="Benchmark · buy & hold"
                  data={backtestResult.metrics.sp}
                  accent="ink"
                  V0={10000}
                />
              </div>

              {/* Equity curve — 3 lines */}
              <h3 style={styles.h3}>Curvas de capital · {backtestResult.dates[0]} → {backtestResult.dates[backtestResult.dates.length-1]}</h3>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart
                    data={backtestResult.dates.map((d, i) => ({
                      date: d,
                      hold: backtestResult.holdEquity[i],
                      wf: backtestResult.wfEquity[i],
                      sp: backtestResult.spEquity[i],
                    }))}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => v.slice(0, 7)}
                      stroke="var(--ink-muted)"
                      tick={{ fontSize: 11 }}
                      minTickGap={40}
                    />
                    <YAxis tickFormatter={(v) => fmtUsdK(v)} stroke="var(--ink-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v, name) => [fmtUsd(v), name]}
                      labelFormatter={(d) => `Fecha: ${d}`}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="hold" stroke="var(--accent)" strokeWidth={2.2} dot={false} name="HOY hold" isAnimationActive={false} />
                    <Line type="monotone" dataKey="wf"   stroke="var(--gold)"  strokeWidth={2.2} dot={false} name={`Walk-forward · ${rebalanceFreq}m`} isAnimationActive={false} />
                    <Line type="monotone" dataKey="sp"   stroke="var(--ink)"   strokeWidth={1.6} strokeDasharray="5 3" dot={false} name="S&P 500" isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={styles.legend}>
                  <span><span style={{...styles.dot, background: "var(--accent)"}}/> HOY hold (pesos actuales)</span>
                  <span><span style={{...styles.dot, background: "var(--gold)"}}/> Walk-forward (rebal {rebalanceFreq}m)</span>
                  <span><span style={{...styles.dot, background: "var(--ink)"}}/> S&P 500</span>
                </div>
              </div>

              <div style={styles.btNote}>
                <strong>Lectura.</strong> Si "Walk-forward" supera a "HOY hold" sistemáticamente, hay valor en rebalancear con σ/corr actualizadas
                (la cartera de hoy "ignora" la información de los últimos 2 años). Si "HOY hold" gana, la cartera actual capturó algo que el
                proceso walk-forward pierde — posiblemente lookahead implícito en los supuestos μ que pusiste sabiendo lo que ya pasó.
                S&P 500 es el "fácil de batir" — si ninguna línea supera al S&P, la diversificación cuesta retorno.
                <br/><br/>
                <strong>β vs S&P 500:</strong> HOY hold β={backtestResult.metrics.hold.beta?.toFixed(2)} · Walk-forward β={backtestResult.metrics.wf.beta?.toFixed(2)}. β &lt;1 = menos amplificación de movimientos del mercado.
              </div>
            </>
          )}
        </section>
      )}

      <footer style={styles.footer}>
        Datos dummy · Próximos pasos: descarga histórica yfinance + optimización Markowitz + t-Student para fat tails
      </footer>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function Stat({ label, value, accent }) {
  const color = accent === "positive" ? "var(--positive)" : accent === "negative" ? "var(--negative)" : "var(--ink)";
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
    </div>
  );
}

function AssetSlider({ asset, weight, customRet, onRetChange, taxRate, onTickerChange, onRangeChange, hasMarketData, enforceMaxCaps, pensovSigma, setPensovSigma }) {
  const effRet = asset.isCash ? customRet * (1 - taxRate) : customRet;
  // Tope recomendado para este activo (solo si σ > 25%)
  const capW = recommendedMaxW(asset);
  const hasCap = capW < 1.0;
  // Pensov: σ es configurable por el usuario (sin ticker en yfinance)
  const isPensov = asset.id === "pensov";

  // ============ 5 markers: DAMOD + HIST arriba, PESIM/NEUTRAL/OPTIM abajo ============
  // PESIM/NEUTRAL/OPTIM muestran los valores BLENDED (CAGR 10y del path
  // consenso → Damodaran). DAMOD y HIST son los datos crudos de referencia.
  const upperThresholds = [
    { key: "damodaran", label: "DAMOD.", value: asset.damodaran, color: "#c97a2e", desc: "Cost of equity por industria · Damodaran NYU Stern (rentabilidad de equilibrio de largo plazo)" },
    { key: "hist10y",   label: "HIST",   value: asset.histRet,   color: "var(--ink-muted)", desc: "CAGR realizado en la ventana disponible (yfinance)" },
  ].filter(t => typeof t.value === "number" && isFinite(t.value));

  const lowerThresholds = [
    { key: "pBlend", label: "PESIM.",  value: asset.pBlended, color: "#c97a2e",
      desc: asset.pBlendedFromHist
        ? `Pesimista: CAGR histórico realizado (${fmtPct(asset.histRet,2)}) — fue peor que el blended, así que prima el histórico`
        : `Pesimista: CAGR 10y del path consenso pesim (${typeof asset.consensusLow === "number" ? fmtPct(asset.consensusLow,1) : "—"}) → Damodaran (${typeof asset.damodaran === "number" ? fmtPct(asset.damodaran,1) : "—"})` },
    { key: "nBlend", label: "NEUTRAL", value: asset.nBlended, color: "var(--gold)",
      desc: `Neutral: CAGR 10y del path consenso neutral (${typeof asset.consensusMean === "number" ? fmtPct(asset.consensusMean,1) : "—"}) → Damodaran (${typeof asset.damodaran === "number" ? fmtPct(asset.damodaran,1) : "—"})` },
    { key: "oBlend", label: "OPTIM.",  value: asset.oBlended, color: "#5a9d6e",
      desc: asset.oBlendedFromHist
        ? `Optimista: CAGR histórico realizado (${fmtPct(asset.histRet,2)}) — superó al blended optimista, así que prima el histórico`
        : `Optimista: CAGR 10y del path consenso optim (${typeof asset.consensusHigh === "number" ? fmtPct(asset.consensusHigh,1) : "—"}) → Damodaran (${typeof asset.damodaran === "number" ? fmtPct(asset.damodaran,1) : "—"})` },
  ].filter(t => typeof t.value === "number" && isFinite(t.value));

  const allThresholds = [...upperThresholds, ...lowerThresholds];

  // RANGO PER-ASSET del bar: directamente de PESIM a OPTIM (con override
  // por HIST ya aplicado en effectiveAssets).
  // - PESIM = blend(consensusLow, damodaran) o HIST si HIST < blend
  // - OPTIM = blend(consensusHigh, damodaran) o HIST si HIST > blend
  // El bar va literalmente desde PESIM (extremo izq) a OPTIM (extremo der),
  // con un buffer mínimo de 2% si la ventana colapsa (cash assets).
  const pVal = typeof asset.pBlended === "number" && isFinite(asset.pBlended) ? asset.pBlended : 0;
  const oVal = typeof asset.oBlended === "number" && isFinite(asset.oBlended) ? asset.oBlended : 0.10;
  let minRet = pVal;
  let maxRet = oVal;
  // Garantizar que DAMOD y HIST también queden adentro (aunque normalmente sí lo están)
  if (typeof asset.damodaran === "number" && isFinite(asset.damodaran)) {
    minRet = Math.min(minRet, asset.damodaran);
    maxRet = Math.max(maxRet, asset.damodaran);
  }
  if (typeof asset.histRet === "number" && isFinite(asset.histRet)) {
    minRet = Math.min(minRet, asset.histRet);
    maxRet = Math.max(maxRet, asset.histRet);
  }
  // Buffer mínimo si la ventana colapsa
  if (maxRet - minRet < 0.02) {
    const mid = (minRet + maxRet) / 2;
    minRet = mid - 0.01;
    maxRet = mid + 0.01;
  }
  const step = 0.0005;
  const pctOf = (v) => Math.max(0, Math.min(100, ((v - minRet) / (maxRet - minRet)) * 100));

  // Todos los umbrales visibles dentro del rango per-asset (los markers extremos
  // como consensus_high 108% pueden quedar fuera; el hint debajo los lista).
  const visibleUpperThresholds = upperThresholds.filter(t => t.value >= minRet && t.value <= maxRet);
  const visibleLowerThresholds = lowerThresholds.filter(t => t.value >= minRet && t.value <= maxRet);
  const visibleAllThresholds = [...visibleUpperThresholds, ...visibleLowerThresholds];
  const hiddenThresholds = allThresholds.filter(t => t.value < minRet || t.value > maxRet);

  // ============ Stacking de labels para evitar superposición ============
  // Si dos labels caen a menos de `minSpacing` (en % del ancho del bar) uno
  // del otro, los apilamos verticalmente: el segundo se va a una fila más alta
  // (arriba: row 0 = más cercano al bar; abajo: row 0 = más cercano al bar).
  const assignStackRows = (thresholds, minSpacingPct = 8) => {
    const items = thresholds
      .map(t => ({ ...t, x: pctOf(t.value) }))
      .sort((a, b) => a.x - b.x);
    const rowEnds = []; // rowEnds[i] = x-position del último label asignado a la fila i
    for (const it of items) {
      let row = 0;
      for (; row < rowEnds.length; row++) {
        if (it.x - rowEnds[row] >= minSpacingPct) break;
      }
      if (row === rowEnds.length) rowEnds.push(it.x);
      else rowEnds[row] = it.x;
      it.row = row;
    }
    return { items, nRows: Math.max(1, rowEnds.length) };
  };
  const upperStacked = assignStackRows(visibleUpperThresholds);
  const lowerStacked = assignStackRows(visibleLowerThresholds);
  const ROW_HEIGHT = 14; // altura por fila (solo el label, sin value)

  // ============ Tick marks para el eje X ============
  const generateTicks = (mn, mx) => {
    const range = mx - mn;
    const niceSteps = [0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1];
    let step = 0.05;
    for (const s of niceSteps) {
      if (range / s <= 7) { step = s; break; }
    }
    const ticks = [];
    const start = Math.ceil(mn / step) * step;
    for (let v = start; v <= mx + 1e-9; v += step) {
      ticks.push(Math.round(v / step) * step);
    }
    return ticks;
  };
  const xAxisTicks = generateTicks(minRet, maxRet);

  return (
    <div style={{
      ...styles.assetRow,
      ...(asset.editable ? styles.assetRowEditable : {}),
    }}>
      <div style={styles.assetInfo}>
        {/* Top line: nombre + currency + sigma + valor μ actual */}
        <div style={styles.assetTopLine}>
          {asset.editable ? (
            <>
              <input
                type="text"
                value={asset.id.toUpperCase()}
                onChange={(e) => onTickerChange(e.target.value.toUpperCase().trim())}
                placeholder={asset.kind === "growth" ? "ej: MSFT, NVDA, AAPL" : "ej: UBER, BRK-B, JNJ"}
                style={styles.tickerInput}
                maxLength="8"
                title={asset.kind === "growth" ? "Activo configurable 1 (JL)" : "Activo configurable 2 (JL)"}
              />
              <span style={styles.tag}>{asset.cur}</span>
              <span style={styles.assetName}
                    title={asset.tickerMeta?.longName ? `Nombre oficial yfinance: ${asset.tickerMeta.longName}` : undefined}>
                {asset.tickerMeta?.longName || (asset.kind === "growth" ? "Activo 1 JL" : "Activo 2 JL")}
              </span>
              {hasCap && (
                <span style={enforceMaxCaps ? styles.capBadgeActive : styles.capBadgeInactive}
                      title={enforceMaxCaps
                        ? `Tope activo: el optimizador no puede asignar más de ${fmtPct(capW,0)} a este activo (σ ${fmtPct(asset.vol,1)})`
                        : `Tope sugerido ${fmtPct(capW,0)} (no aplicado · activa "Topes por volatilidad")`}>
                  tope {fmtPct(capW, 0)}
                </span>
              )}
            </>
          ) : (
            <>
              <span style={styles.assetName}
                    title={asset.tickerMeta?.longName ? `Nombre oficial yfinance: ${asset.tickerMeta.longName}` : undefined}>
                {asset.tickerMeta?.longName || asset.name}
              </span>
              <span style={styles.tag}>{asset.cur}</span>
              {hasCap && (
                <span style={enforceMaxCaps ? styles.capBadgeActive : styles.capBadgeInactive}
                      title={enforceMaxCaps
                        ? `Tope activo: el optimizador no puede asignar más de ${fmtPct(capW,0)} a este activo (σ ${fmtPct(asset.vol,1)})`
                        : `Tope sugerido ${fmtPct(capW,0)} (no aplicado · activa "Topes por volatilidad")`}>
                  tope {fmtPct(capW, 0)}
                </span>
              )}
            </>
          )}
          <span style={styles.assetSpacer} />
          {/* Grupo de métricas a la derecha: HIST + σ arriba, μ abajo */}
          <div style={styles.assetMetricsGroup}>
            <div style={styles.assetMetricsTopRow}>
              <span style={typeof asset.yearsAvailable === "number" && asset.yearsAvailable >= 9.5 ? styles.histBadgeFull : styles.histBadgePartial}
                    title={typeof asset.yearsAvailable === "number"
                      ? `${asset.yearsAvailable.toFixed(1)}y de history real en yfinance · σ y métricas computadas sobre esta ventana`
                      : "Sin JSON cargado · σ y métricas vienen de la data embebida (asume ~10y)"}>
                hist {typeof asset.yearsAvailable === "number" ? asset.yearsAvailable.toFixed(1) + "y" : "?"}
              </span>
              {isPensov && setPensovSigma ? (
                <span style={styles.assetSigmaTop}>
                  σ{" "}
                  <select
                    value={pensovSigma.toFixed(4)}
                    onChange={(e) => setPensovSigma(parseFloat(e.target.value))}
                    style={styles.pensovSigmaSelect}
                    title="σ del bono soberano peruano · ajustable porque no tiene ticker en yfinance"
                  >
                    {PENSOV_SIGMA_OPTIONS.map(v => (
                      <option key={v.toFixed(4)} value={v.toFixed(4)}>
                        {(v * 100).toFixed(2)}%
                      </option>
                    ))}
                  </select>
                </span>
              ) : (
                <span style={styles.assetSigmaTop}>σ {fmtPct(asset.vol, 1)}</span>
              )}
            </div>
            <span style={styles.assetCurrentMu}>
              μ <strong style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                color: "var(--accent)",
              }}>{fmtPct(customRet, 2)}</strong>
            </span>
          </div>
        </div>

        {/* Long name (yfinance) + descripción del activo */}
        {(() => {
          const meta = asset.tickerMeta;
          // longName ya se muestra arriba en assetName. Aquí solo summary y tags.
          const summary = (meta?.summary || asset.desc || "").trim();
          const truncated = summary.length > 220 ? summary.slice(0, 220).trim() + "…" : summary;
          const hasSectorTags = meta?.sector && meta?.industry;
          if (!truncated && !hasSectorTags) return null;
          return (
            <div style={styles.assetMetaBlock}>
              {truncated && (
                <div style={styles.assetDesc} title={summary.length > 220 ? summary : undefined}>
                  {truncated}
                </div>
              )}
              {hasSectorTags && (
                <div style={styles.assetSectorRow}>
                  <span style={styles.assetSectorTag}>{meta.sector}</span>
                  <span style={styles.assetIndustryTag}>{meta.industry}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Info row (consenso source, tax, range si editable) */}
        {(asset.consensusSource || asset.isCash || asset.editable) && (
          <div style={styles.assetSourceRow}>
            {asset.consensusSource && (
              <>
                <span style={styles.sourceLabel}>Consenso:</span>
                <code style={styles.sourceCode}>{asset.consensusSource}</code>
              </>
            )}
            {asset.isCash && (
              <>
                {asset.consensusSource && <span style={styles.refSep}>·</span>}
                <span style={styles.taxIndicator}>
                  Neto post-tax {fmtPct(taxRate, 0)}: <strong>{fmtPct(effRet, 2)}</strong>
                </span>
              </>
            )}
            {asset.editable && (
              <>
                {(asset.consensusSource || asset.isCash) && <span style={styles.refSep}>·</span>}
                <span style={styles.refItem}>
                  Rango Damodaran:{" "}
                  <input
                    type="number" step="0.5"
                    value={(asset.retLow * 100).toFixed(1)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) / 100;
                      if (!isNaN(v)) onRangeChange({ retLow: v, retHigh: asset.retHigh });
                    }}
                    style={styles.rangeMiniInput}
                  /><span style={styles.rangeMiniPct}>%</span>
                  <span style={{ margin: "0 4px" }}>–</span>
                  <input
                    type="number" step="0.5"
                    value={(asset.retHigh * 100).toFixed(1)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) / 100;
                      if (!isNaN(v)) onRangeChange({ retLow: asset.retLow, retHigh: v });
                    }}
                    style={styles.rangeMiniInput}
                  /><span style={styles.rangeMiniPct}>%</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* ============ Barra con labels stackeados + eje X de rentabilidades ============ */}
        <div style={styles.thresholdBarWrap}>
          {/* === Labels ARRIBA: stackeados verticalmente si están muy cerca === */}
          <div style={{
            ...styles.thresholdLabelsTop,
            height: upperStacked.nRows * ROW_HEIGHT,
          }}>
            {upperStacked.items.map((t) => (
              <button
                key={t.key + "-top"}
                onClick={() => onRetChange(t.value)}
                style={{
                  ...styles.thresholdBtnTop,
                  left: `${t.x}%`,
                  // Row 0 = más cercano al bar (abajo); rows mayores = más arriba
                  bottom: `${t.row * ROW_HEIGHT}px`,
                  top: "auto",
                  color: t.color,
                }}
                title={`${t.desc} · click para usar ${fmtPct(t.value, 2)}`}
              >
                <div style={styles.thresholdBtnLabel}>{t.label}</div>
              </button>
            ))}
          </div>

          {/* === Track con tick lines + slider integrado === */}
          <div style={styles.thresholdTrackInteractive}>
            <div style={styles.thresholdTrackBg} />
            {visibleAllThresholds.map(t => (
              <div
                key={t.key + "-line"}
                style={{
                  ...styles.thresholdTickLine,
                  left: `${pctOf(t.value)}%`,
                  background: t.color,
                }}
                title={`${t.label}: ${fmtPct(t.value, 2)}`}
              />
            ))}
            <input
              type="range"
              min={minRet}
              max={maxRet}
              step={step}
              value={Math.max(minRet, Math.min(maxRet, customRet))}
              onChange={(e) => onRetChange(parseFloat(e.target.value))}
              style={styles.thresholdRangeInput}
              className="threshold-slider"
              aria-label={`Rentabilidad esperada de ${asset.name}`}
            />
          </div>

          {/* === Labels ABAJO: stackeados verticalmente si están muy cerca === */}
          <div style={{
            ...styles.thresholdLabelsBottom,
            height: lowerStacked.nRows * ROW_HEIGHT,
          }}>
            {lowerStacked.items.map((t) => (
              <button
                key={t.key + "-bot"}
                onClick={() => onRetChange(t.value)}
                style={{
                  ...styles.thresholdBtnBottom,
                  left: `${t.x}%`,
                  // Row 0 = más cercano al bar (arriba); rows mayores = más abajo
                  top: `${t.row * ROW_HEIGHT}px`,
                  color: t.color,
                }}
                title={`${t.desc} · click para usar ${fmtPct(t.value, 2)}`}
              >
                <div style={styles.thresholdBtnLabel}>{t.label}</div>
              </button>
            ))}
          </div>

          {/* === Eje X: ticks de rentabilidad === */}
          <div style={styles.thresholdXAxis}>
            {xAxisTicks.map((v) => (
              <div key={v.toFixed(4)} style={{ ...styles.thresholdXTickWrap, left: `${pctOf(v)}%` }}>
                <div style={styles.thresholdXTickMark} />
                <div style={styles.thresholdXTickLabel}>{fmtPct(v, v >= 0.1 || v <= -0.1 ? 0 : 1)}</div>
              </div>
            ))}
          </div>

          {/* Hint si hay umbrales fuera del rango */}
          {hiddenThresholds.length > 0 && (
            <div style={styles.thresholdHidden} title={hiddenThresholds.map(t => `${t.label}: ${fmtPct(t.value, 2)}`).join(" · ")}>
              {hiddenThresholds.length} umbral{hiddenThresholds.length > 1 ? "es" : ""} fuera de rango: {hiddenThresholds.map(t => `${t.label} ${fmtPct(t.value, 0)}`).join(" · ")}
            </div>
          )}
        </div>
      </div>

      {/* Weight display (read-only, from Markowitz) */}
      <div style={styles.weightBox}>
        <div style={styles.weightBoxLabel}>Peso óptimo</div>
        <div style={styles.weightBoxValue}>{fmtPct(weight, 1)}</div>
        {weight > 0.001 && (
          <div style={styles.weightBar}>
            <div style={{
              ...styles.weightBarFill,
              // Escala visual: peso del 50% llena la barra. Sin tope dependiente de maxW.
              width: `${Math.min(weight * 200, 100)}%`,
            }}/>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }) {
  const color = accent === "positive" ? "var(--positive)" : accent === "negative" ? "var(--negative)" : "var(--ink)";
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color }}>{value}</div>
      {sub && <div style={styles.metricSub}>{sub}</div>}
    </div>
  );
}

// Versión compacta para el banner horizontal de la pestaña Cartera
function MetricCardCompact({ label, value, sub, accent }) {
  const color = accent === "positive" ? "var(--positive)" : accent === "negative" ? "var(--negative)" : "var(--ink)";
  return (
    <div style={styles.metricCompact}>
      <div style={styles.metricCompactLabel}>{label}</div>
      <div style={{ ...styles.metricCompactValue, color }}>{value}</div>
      {sub && <div style={styles.metricCompactSub}>{sub}</div>}
    </div>
  );
}

// Pie chart de composición por clase de activo (5 buckets: RV, RF, Cash, Commodities, Bitcoin)
function CompositionPie({ weights, assets }) {
  const data = useMemo(() => computeGroupWeights(weights, assets), [weights, assets]);
  if (data.length === 0) return null;

  // Etiqueta dentro de cada slice (porcentaje, solo si >= 4% para no llenar de números)
  const renderLabel = (entry) => {
    if (entry.value < 0.04) return null;
    return `${(entry.value * 100).toFixed(0)}%`;
  };

  return (
    <div style={styles.compositionPieBox}>
      <div style={styles.compositionPieHeader}>
        <h3 style={styles.compositionPieTitle}>Composición por clase de activo</h3>
        <div style={styles.compositionPieSub}>
          Agrupación independiente de moneda (USD/PEN). 5 buckets: Renta Variable, Renta Fija, Cash, Commodities, Bitcoin.
        </div>
      </div>
      <div style={styles.compositionPieGrid}>
        {/* Pie chart a la izquierda */}
        <div style={styles.compositionPieChart}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={1}
                stroke="var(--surface)"
                strokeWidth={2}
                label={renderLabel}
                labelLine={false}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmtPct(v, 2)}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Tabla con valores a la derecha */}
        <div style={styles.compositionPieTable}>
          {data.map((d) => (
            <div key={d.name} style={styles.compositionPieRow}>
              <span style={{
                ...styles.compositionPieSwatch,
                background: d.color,
              }} />
              <span style={styles.compositionPieLabel}>{d.name}</span>
              <span style={styles.compositionPieValue}>{fmtPct(d.value, 2)}</span>
            </div>
          ))}
          <div style={{ ...styles.compositionPieRow, borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 6, fontWeight: 700 }}>
            <span style={{ ...styles.compositionPieSwatch, background: "transparent" }} />
            <span style={styles.compositionPieLabel}>Total</span>
            <span style={styles.compositionPieValue}>
              {fmtPct(data.reduce((a, d) => a + d.value, 0), 2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryBars({ weights }) {
  const cats = {};
  for (const g of ASSET_GROUP_ORDER) cats[g] = 0;
  ASSETS.forEach((a, i) => { cats[groupOf(a)] += weights[i]; });
  const total = Object.values(cats).reduce((a, b) => a + b, 0);
  return (
    <div style={styles.catBars}>
      <div style={styles.catBarStrip}>
        {ASSET_GROUP_ORDER.filter(g => cats[g] > 0).map((cat) => (
          <div key={cat} style={{
            width: `${(cats[cat]/total)*100}%`,
            background: ASSET_GROUP_COLORS[cat],
            height: "100%",
          }} title={`${cat}: ${fmtPct(cats[cat], 1)}`}/>
        ))}
      </div>
      <div style={styles.catLegend}>
        {ASSET_GROUP_ORDER.filter(g => cats[g] > 0).map((cat) => (
          <div key={cat} style={styles.catLegendItem}>
            <span style={{ ...styles.dot, background: ASSET_GROUP_COLORS[cat] }} />
            <span style={styles.catLegendName}>{cat}</span>
            <span style={styles.catLegendValue}>{fmtPct(cats[cat], 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenarioCard({ label, percentile, value, cagr, accent }) {
  const color = accent === "positive" ? "var(--positive)" : accent === "negative" ? "var(--negative)" : "var(--ink)";
  return (
    <div style={styles.scenario}>
      <div style={styles.scenarioHead}>
        <span style={styles.scenarioLabel}>{label}</span>
        <span style={styles.scenarioP}>{percentile}</span>
      </div>
      <div style={{ ...styles.scenarioValue, color }}>{fmtUsd(value)}</div>
      <div style={styles.scenarioCagr}>CAGR <strong>{fmtPct(cagr, 2)}</strong></div>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, onChange, fmt, hint }) {
  return (
    <div style={styles.sliderControl}>
      <div style={styles.sliderTop}>
        <span style={styles.sliderLabel}>{label}</span>
        <span style={styles.sliderValue}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={styles.range}
      />
      {hint && <div style={styles.sliderHint}>{hint}</div>}
    </div>
  );
}

// ============================================================
// TARGET PICKER — Cartera personalizada por objetivo del usuario
// Muestra dos sliders (μ y σ) sobre la nube de Markowitz. El usuario
// arrastra uno de los dos y la calculadora encuentra automáticamente
// el portafolio con mejor Sharpe que cumple ese objetivo:
//   - Slider μ activo → "quiero al menos X% de retorno" → min σ s.t. μ ≥ X
//   - Slider σ activo → "tolero hasta X% de vol"        → max μ s.t. σ ≤ X
// El slider inactivo se sincroniza con el resultado para mostrar el
// trade-off realizado.
// ============================================================
const PURPLE = "#5a3fa0";
function TargetPicker({ markowitz, customPortfolio, targetMode, setTargetMode, targetMu, setTargetMu, targetSigma, setTargetSigma, onLoad }) {
  if (!markowitz?.bounds) return null;
  const { muMin, muMax, sigmaMin, sigmaMax } = markowitz.bounds;
  // Padding del slider: empezamos un toque más arriba/abajo del mínimo/máximo
  // de la nube, redondeado a 0.005 para que los marks queden prolijos.
  const niceFloor = (v) => Math.floor(v * 200) / 200; // floor a 0.005
  const niceCeil  = (v) => Math.ceil(v * 200) / 200;
  const muLo = niceFloor(muMin), muHi = niceCeil(muMax);
  const sgLo = niceFloor(sigmaMin), sgHi = niceCeil(sigmaMax);

  const muSafe = targetMu ?? markowitz.neutra.mu;
  const sgSafe = targetSigma ?? markowitz.neutra.sigma;

  // Si el modo cambia, sincronizamos el OTRO slider al resultado, para que
  // refleje el trade-off realizado (e.g. "para μ=8% acabo con σ=5.3%").
  // Hacemos esto vía useEffect dentro del componente: cuando customPortfolio
  // cambia, el slider pasivo se actualiza.
  useEffect(() => {
    if (!customPortfolio || customPortfolio.infeasible) return;
    if (targetMode === "mu" && Math.abs(customPortfolio.sigma - sgSafe) > 1e-6) {
      setTargetSigma(customPortfolio.sigma);
    } else if (targetMode === "sigma" && Math.abs(customPortfolio.mu - muSafe) > 1e-6) {
      setTargetMu(customPortfolio.mu);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customPortfolio?.mu, customPortfolio?.sigma, targetMode]);

  const isMu = targetMode === "mu";
  const isInfeasible = customPortfolio?.infeasible;

  // Top 6 posiciones del portafolio personalizado
  const ranked = customPortfolio?.w
    ? customPortfolio.w.map((w, i) => ({ w, asset: ASSETS[i] }))
        .filter(x => x.w > 0.005)
        .sort((a, b) => b.w - a.w)
    : [];
  const top6 = ranked.slice(0, 6);
  const restSum = ranked.slice(6).reduce((a, x) => a + x.w, 0);

  // Comparativa contra Neutra (cuál es el costo/beneficio del custom vs el max Sharpe puro)
  const neutra = markowitz.neutra;
  const cmp = customPortfolio && !isInfeasible && neutra ? {
    dMu:     customPortfolio.mu - neutra.mu,
    dSigma:  customPortfolio.sigma - neutra.sigma,
    dSharpe: customPortfolio.sharpe - neutra.sharpe,
  } : null;

  return (
    <div style={styles.targetPickerWrap}>
      <div style={styles.targetPickerHeader}>
        <div>
          <h3 style={{ ...styles.h3, marginTop: 0, marginBottom: 4 }}>Cartera personalizada por objetivo</h3>
          <p style={styles.targetPickerIntro}>
            Movés <strong>uno</strong> de los dos sliders y la calculadora elige automáticamente,
            sobre la nube de {markowitz.searchPool.length.toLocaleString()} portafolios factibles,
            el que cumple tu objetivo con el <strong>mejor Sharpe posible</strong>.
            El otro slider se sincroniza para mostrarte el trade-off.
          </p>
        </div>
      </div>

      {/* Tabs modo */}
      <div style={styles.targetModeTabs}>
        <button
          onClick={() => setTargetMode("mu")}
          style={{ ...styles.targetModeTab, ...(isMu ? styles.targetModeTabActive : {}) }}
        >
          <span style={styles.targetModeTabKey}>μ</span>
          <span style={styles.targetModeTabLabel}>Fijar retorno mínimo</span>
          <span style={styles.targetModeTabHint}>→ min σ con μ ≥ target</span>
        </button>
        <button
          onClick={() => setTargetMode("sigma")}
          style={{ ...styles.targetModeTab, ...(!isMu ? styles.targetModeTabActive : {}) }}
        >
          <span style={styles.targetModeTabKey}>σ</span>
          <span style={styles.targetModeTabLabel}>Fijar volatilidad máxima</span>
          <span style={styles.targetModeTabHint}>→ max μ con σ ≤ target</span>
        </button>
      </div>

      {/* Sliders */}
      <div style={styles.targetSlidersGrid}>
        <TargetSlider
          label="Retorno objetivo (μ)"
          icon="μ"
          value={muSafe}
          min={muLo}
          max={muHi}
          step={0.0025}
          onChange={setTargetMu}
          active={isMu}
          activeColor={PURPLE}
          format={(v) => fmtPct(v, 2)}
          subLeft={`min cloud ${fmtPct(muLo,1)}`}
          subRight={`max cloud ${fmtPct(muHi,1)}`}
        />
        <TargetSlider
          label="Volatilidad objetivo (σ)"
          icon="σ"
          value={sgSafe}
          min={sgLo}
          max={sgHi}
          step={0.0025}
          onChange={setTargetSigma}
          active={!isMu}
          activeColor={PURPLE}
          format={(v) => fmtPct(v, 2)}
          subLeft={`min cloud ${fmtPct(sgLo,1)}`}
          subRight={`max cloud ${fmtPct(sgHi,1)}`}
        />
      </div>

      {/* Resultado */}
      {isInfeasible ? (
        <div style={styles.targetInfeasible}>
          <strong>Objetivo infactible.</strong>{" "}
          {isMu
            ? `Ningún portafolio en la nube alcanza μ ≥ ${fmtPct(muSafe, 2)}. Bajá el target o relajá restricciones (toggles de pisos/topes).`
            : `Ningún portafolio en la nube tiene σ ≤ ${fmtPct(sgSafe, 2)}. Subí el target o relajá restricciones.`}
        </div>
      ) : customPortfolio ? (
        <div style={styles.targetResultCard}>
          <div style={styles.targetResultTop}>
            <div>
              <div style={styles.targetResultLabel}>Mejor Sharpe que cumple tu objetivo</div>
              <div style={styles.targetResultDesc}>
                {isMu
                  ? `Mínima volatilidad con μ ≥ ${fmtPct(muSafe, 2)}`
                  : `Máximo retorno con σ ≤ ${fmtPct(sgSafe, 2)}`}
              </div>
            </div>
            <button onClick={onLoad} style={{ ...styles.loadBtn, background: PURPLE }}>
              Cargar en Cartera →
            </button>
          </div>

          <div style={styles.targetResultMetrics}>
            <div style={styles.targetResultMetric}>
              <div style={styles.targetResultMetricLabel}>Retorno μ</div>
              <div style={styles.targetResultMetricValue}>{fmtPct(customPortfolio.mu, 2)}</div>
              {cmp && (
                <div style={{ ...styles.targetResultMetricDelta, color: cmp.dMu >= 0 ? "var(--positive)" : "var(--negative)" }}>
                  {cmp.dMu >= 0 ? "+" : ""}{(cmp.dMu * 100).toFixed(2)} pp vs Neutra
                </div>
              )}
            </div>
            <div style={styles.targetResultMetric}>
              <div style={styles.targetResultMetricLabel}>Volatilidad σ</div>
              <div style={styles.targetResultMetricValue}>{fmtPct(customPortfolio.sigma, 2)}</div>
              {cmp && (
                <div style={{ ...styles.targetResultMetricDelta, color: cmp.dSigma <= 0 ? "var(--positive)" : "var(--negative)" }}>
                  {cmp.dSigma >= 0 ? "+" : ""}{(cmp.dSigma * 100).toFixed(2)} pp vs Neutra
                </div>
              )}
            </div>
            <div style={styles.targetResultMetric}>
              <div style={styles.targetResultMetricLabel}>Sharpe</div>
              <div style={{ ...styles.targetResultMetricValue, color: PURPLE }}>
                {customPortfolio.sharpe.toFixed(3)}
              </div>
              {cmp && (
                <div style={{ ...styles.targetResultMetricDelta, color: cmp.dSharpe >= 0 ? "var(--positive)" : "var(--negative)" }}>
                  {cmp.dSharpe >= 0 ? "+" : ""}{cmp.dSharpe.toFixed(3)} vs Neutra
                </div>
              )}
            </div>
          </div>

          {top6.length > 0 && (
            <div style={styles.targetResultPositions}>
              <div style={styles.targetResultPositionsLabel}>Composición · top {top6.length} posiciones</div>
              <div style={styles.targetResultPositionsList}>
                {top6.map(({ w, asset }) => (
                  <div key={asset.id} style={styles.targetResultPositionRow}>
                    <span style={styles.targetResultPositionName}>
                      <span style={styles.tag}>{asset.cur}</span> {asset.shortName || asset.name}
                    </span>
                    <span style={styles.targetResultPositionWeight}>{fmtPct(w, 1)}</span>
                  </div>
                ))}
                {restSum > 0.005 && (
                  <div style={styles.targetResultPositionRow}>
                    <span style={{ ...styles.targetResultPositionName, opacity: 0.5, fontStyle: "italic" }}>
                      + {ranked.length - top6.length} activos más
                    </span>
                    <span style={{ ...styles.targetResultPositionWeight, opacity: 0.5 }}>
                      {fmtPct(restSum, 1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Slider numérico bonito con label + valor grande + rieles de min/max.
function TargetSlider({ label, icon, value, min, max, step, onChange, active, activeColor, format, subLeft, subRight }) {
  const pct = ((value - min) / (max - min)) * 100;
  const handlePointerDown = () => {
    // Al tocar este slider, el padre puede setearlo como activo via onChange's caller
    // (no hacemos nada acá: el click ya dispara onChange si arrastrás).
  };
  return (
    <div style={{
      ...styles.targetSliderCard,
      ...(active ? { borderColor: activeColor, background: "var(--surface)" } : {}),
    }}>
      <div style={styles.targetSliderHeader}>
        <span style={{
          ...styles.targetSliderIcon,
          color: active ? activeColor : "var(--ink-muted)",
          fontWeight: active ? 700 : 500,
        }}>{icon}</span>
        <div style={styles.targetSliderLabelGroup}>
          <span style={styles.targetSliderLabel}>{label}</span>
          {active && <span style={{ ...styles.targetSliderActiveBadge, color: activeColor, borderColor: activeColor }}>activo</span>}
        </div>
        <span style={{ ...styles.targetSliderValue, color: active ? activeColor : "var(--ink)" }}>
          {format(value)}
        </span>
      </div>
      <div style={styles.targetSliderRailWrap}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onPointerDown={handlePointerDown}
          style={{
            ...styles.targetSliderRange,
            // Override CSS var via inline accent (the existing global CSS uses var(--accent))
            // We use accentColor for native thumb tint where supported.
            accentColor: active ? activeColor : "var(--ink-muted)",
          }}
        />
      </div>
      <div style={styles.targetSliderFootRow}>
        <span>{subLeft}</span>
        <span>{subRight}</span>
      </div>
    </div>
  );
}

function OptimalPortfolioCard({ label, desc, portfolio, accent, highlight, onLoad }) {
  const accentColor = accent === "positive" ? "var(--positive)" : accent === "gold" ? "var(--gold)" : "var(--accent)";
  // Top 5 assets by weight
  const ranked = portfolio.w.map((w, i) => ({ w, asset: ASSETS[i] }))
    .filter(x => x.w > 0.005)
    .sort((a, b) => b.w - a.w);  const top5 = ranked.slice(0, 5);
  return (
    <div style={{
      ...styles.optCard,
      ...(highlight ? styles.optCardHighlight : {}),
      borderColor: highlight ? accentColor : "var(--border)",
    }}>
      <div style={styles.optCardTop}>
        <div>
          <div style={{...styles.optCardLabel, color: accentColor}}>{label}</div>
          <div style={styles.optCardDesc}>{desc}</div>
        </div>
        {highlight && <div style={{...styles.optBadge, background: accentColor}}>★ Recomendada</div>}
      </div>
      <div style={styles.optMetrics}>
        <div>
          <div style={styles.optMetricLabel}>Retorno</div>
          <div style={styles.optMetricValue}>{fmtPct(portfolio.mu)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Vol</div>
          <div style={styles.optMetricValue}>{fmtPct(portfolio.sigma)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Sharpe</div>
          <div style={{...styles.optMetricValue, color: accentColor}}>{portfolio.sharpe.toFixed(2)}</div>
        </div>
      </div>
      <div style={styles.optTopAssets}>
        <div style={styles.optTopAssetsLabel}>Top posiciones</div>
        {top5.map(({ w, asset }) => (
          <div key={asset.id} style={styles.optAssetRow}>
            <span style={styles.optAssetName}>{asset.name}</span>
            <span style={styles.optAssetWeight}>{fmtPct(w, 1)}</span>
          </div>
        ))}
        {ranked.length > 5 && (
          <div style={styles.optAssetRow}>
            <span style={{...styles.optAssetName, opacity: 0.5, fontStyle: "italic"}}>
              + {ranked.length - 5} activos más
            </span>
            <span style={{...styles.optAssetWeight, opacity: 0.5}}>
              {fmtPct(ranked.slice(5).reduce((a, x) => a + x.w, 0), 1)}
            </span>
          </div>
        )}
      </div>
      <button onClick={onLoad} style={{...styles.loadBtn, background: accentColor}}>
        Cargar en Cartera →
      </button>
    </div>
  );
}

function OptimumMarker({ cx, cy, color, label }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={color} stroke="var(--surface)" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={14} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} />
      <text x={cx + 14} y={cy + 4} fontSize={10} fontWeight={600} fill={color} fontFamily="'JetBrains Mono', monospace" letterSpacing="0.05em">
        {label}
      </text>
    </g>
  );
}

function CorrelationMatrix({ effectiveAssets, correlation }) {
  // Color scale: red for positive, white for zero, blue for negative
  const colorFor = (v) => {
    if (v >= 0.7) return "rgba(122, 27, 27, 0.85)";
    if (v >= 0.4) return "rgba(122, 27, 27, 0.55)";
    if (v >= 0.2) return "rgba(122, 27, 27, 0.30)";
    if (v > -0.2) return "rgba(255, 255, 255, 0.40)";
    if (v > -0.4) return "rgba(58, 90, 124, 0.30)";
    if (v > -0.7) return "rgba(58, 90, 124, 0.55)";
    return "rgba(58, 90, 124, 0.85)";
  };
  const textColor = (v) => Math.abs(v) > 0.4 ? "var(--bg)" : "var(--ink)";

  // Fallback si no llegan props (compat con invocación vieja)
  const assets = effectiveAssets || ASSETS;
  const corrM  = correlation || C;

  // Reordenar índices por los 5 buckets (Renta Variable → Renta Fija → Cash → Commodities → Bitcoin)
  // y dentro de cada bucket preservar el orden original de ASSETS.
  const orderedIndices = useMemo(() => {
    const byGroup = {};
    for (const g of ASSET_GROUP_ORDER) byGroup[g] = [];
    assets.forEach((a, i) => byGroup[groupOf(a)].push(i));
    return ASSET_GROUP_ORDER.flatMap(g => byGroup[g]);
  }, [assets]);

  // Nombre para display: tickerMeta.longName si está, sino shortName, sino name
  // Para activos editables (Activo 1 JL / 2 JL), siempre el ticker actual (id.toUpperCase())
  const displayName = (asset) => {
    if (asset.editable) return asset.id.toUpperCase();
    return asset.shortName || asset.name;
  };

  const cellSize = 42;
  const labelColWidth = 170;

  // Para los separadores de bucket: encontrar las posiciones donde cambia el grupo
  const groupBoundaries = useMemo(() => {
    const set = new Set();
    let prevG = null;
    orderedIndices.forEach((idx, pos) => {
      const g = groupOf(assets[idx]);
      if (prevG !== null && g !== prevG) set.add(pos);
      prevG = g;
    });
    return set;
  }, [orderedIndices, assets]);

  return (
    <div style={{ overflowX: "auto", background: "var(--surface)", border: "1px solid var(--border)", padding: 14 }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
        <thead>
          {/* Fila de headers angulados a -55° */}
          <tr>
            <th style={{ width: labelColWidth, height: 120, borderBottom: "1.5px solid var(--ink)" }}></th>
            {orderedIndices.map((idx, pos) => {
              const a = assets[idx];
              const grp = groupOf(a);
              const isBoundary = groupBoundaries.has(pos);
              return (
                <th
                  key={idx}
                  style={{
                    width: cellSize, minWidth: cellSize, height: 120,
                    padding: 0,
                    borderBottom: "1.5px solid var(--ink)",
                    borderLeft: isBoundary ? "2px solid var(--ink)" : "none",
                    position: "relative",
                    verticalAlign: "bottom",
                  }}
                  title={`${a.name} · grupo: ${grp}`}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: "50%",
                      transformOrigin: "left bottom",
                      transform: "translateX(0) rotate(-55deg)",
                      whiteSpace: "nowrap",
                      fontSize: 11,
                      fontWeight: 600,
                      color: ASSET_GROUP_COLORS[grp],
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {displayName(a)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {orderedIndices.map((iIdx, iPos) => {
            const aRow = assets[iIdx];
            const grpRow = groupOf(aRow);
            const isRowBoundary = groupBoundaries.has(iPos);
            return (
              <tr key={iIdx}>
                <th style={{
                  width: labelColWidth, height: cellSize,
                  textAlign: "right",
                  fontSize: 11.5, padding: "0 10px",
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: ASSET_GROUP_COLORS[grpRow],
                  borderRight: "1.5px solid var(--ink)",
                  borderTop: isRowBoundary ? "2px solid var(--ink)" : "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={`${aRow.name} · grupo: ${grpRow}`}
                >
                  {displayName(aRow)}
                </th>
                {orderedIndices.map((jIdx, jPos) => {
                  const aCol = assets[jIdx];
                  const v = corrM[iIdx][jIdx];
                  const greyOut = aRow.vol === 0 || aCol.vol === 0;
                  const isColBoundary = groupBoundaries.has(jPos);
                  return (
                    <td
                      key={jIdx}
                      style={{
                        width: cellSize, height: cellSize,
                        background: greyOut ? "rgba(0,0,0,0.04)" : colorFor(v),
                        color: greyOut ? "var(--ink-muted)" : textColor(v),
                        textAlign: "center",
                        fontWeight: iIdx === jIdx ? 700 : 500,
                        border: "1px solid var(--bg)",
                        borderLeft: isColBoundary ? "2px solid var(--ink)" : "1px solid var(--bg)",
                        borderTop: isRowBoundary ? "2px solid var(--ink)" : "1px solid var(--bg)",
                        fontSize: 10.5,
                        fontVariantNumeric: "tabular-nums",
                        opacity: greyOut ? 0.5 : 1,
                      }}
                      title={`Corr(${displayName(aRow)}, ${displayName(aCol)}) = ${v.toFixed(2)}`}
                    >
                      {v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 11, color: "var(--ink-muted)", alignItems: "center", flexWrap: "wrap" }}>
        <span>Escala:</span>
        <span><span style={{...styles.dotSquare, background: "rgba(58, 90, 124, 0.85)"}}/> &lt; -0.7</span>
        <span><span style={{...styles.dotSquare, background: "rgba(58, 90, 124, 0.30)"}}/> -0.4 a -0.2</span>
        <span><span style={{...styles.dotSquare, background: "rgba(255,255,255,0.40)", border: "1px solid var(--border)"}}/> ±0.2</span>
        <span><span style={{...styles.dotSquare, background: "rgba(122, 27, 27, 0.30)"}}/> +0.2 a +0.4</span>
        <span><span style={{...styles.dotSquare, background: "rgba(122, 27, 27, 0.85)"}}/> &gt; +0.7</span>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>Celdas grises = activos con σ=0 (cash/PF)</span>
      </div>
    </div>
  );
}

function CopyCodeButton({ code, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      // Fallback for older browsers / non-https contexts
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch (e2) {
        alert('No se pudo copiar. Selecciona y copia manualmente.');
      }
      document.body.removeChild(ta);
    }
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        ...styles.copyCodeBtn,
        background: copied ? "var(--positive)" : "var(--ink)",
      }}
    >
      {copied ? "✓ Código copiado · pégalo en un archivo .py" : `📋 ${label}`}
    </button>
  );
}

// ============================================================
// V2 COMPONENTS — para el modelo apalancado con cash account
// (la confidence table v2 tiene la columna wPctNet en lugar de wPct,
// y los retiros se calculan sobre patrimonio neto que crece año a año)
// ============================================================
function ConfidenceCardsV2({ confidenceTable, horizon, V0, onApply, currentWPctNet }) {
  if (!confidenceTable) return null;
  const items = [
    { key: "99", label: "99% confianza", desc: "P(margin call) ≤ 1%", row: confidenceTable.max99, color: "var(--positive)", tone: "Muy conservador" },
    { key: "95", label: "95% confianza", desc: "P(margin call) ≤ 5%", row: confidenceTable.max95, color: "var(--gold)",     tone: "Conservador estándar" },
    { key: "90", label: "90% confianza", desc: "P(margin call) ≤ 10%", row: confidenceTable.max90, color: "#c97a2e",         tone: "Moderado" },
  ];
  return (
    <div style={styles.confidenceCardsGrid}>
      {items.map(it => {
        if (!it.row) {
          return (
            <div key={it.key} style={{ ...styles.confidenceCard, borderColor: "var(--border)" }}>
              <div style={styles.confidenceCardHeader}>
                <div style={{ ...styles.confidenceCardLabel, color: it.color }}>{it.label}</div>
                <div style={styles.confidenceCardDesc}>{it.desc}</div>
              </div>
              <div style={styles.confidenceCardInfeasible}>
                Ni siquiera 0%/año cumple esta confianza. Reducí el apalancamiento, subí el umbral, o ajustá la cartera.
              </div>
            </div>
          );
        }
        const r = it.row;
        const isCurrent = Math.abs(r.wPctNet - currentWPctNet) < 1e-6;
        return (
          <div key={it.key} style={{
            ...styles.confidenceCard,
            borderColor: it.color,
            ...(isCurrent ? styles.confidenceCardSelected : {}),
          }}>
            <div style={styles.confidenceCardHeader}>
              <div style={{ ...styles.confidenceCardLabel, color: it.color }}>{it.label}</div>
              <div style={styles.confidenceCardDesc}>{it.desc} · {it.tone}</div>
            </div>
            <div style={styles.confidenceCardMainNumber}>
              <span style={{ color: it.color }}>{fmtPct(r.wPctNet, 2)}</span>
              <span style={styles.confidenceCardMainSub}>del NW al año</span>
            </div>
            <div style={styles.confidenceCardMetrics}>
              <div>
                <div style={styles.confidenceCardMetricLabel}>USD/año (promedio anual mediano)</div>
                <div style={styles.confidenceCardMetricValue}>{fmtUsd(r.W_year_p50)}</div>
              </div>
              <div>
                <div style={styles.confidenceCardMetricLabel}>USD/mes promedio</div>
                <div style={styles.confidenceCardMetricValue}>{fmtUsd(r.W_month_p50)}</div>
              </div>
              <div>
                <div style={styles.confidenceCardMetricLabel}>Patrimonio neto a {horizon}a (p50)</div>
                <div style={{
                  ...styles.confidenceCardMetricValue,
                  color: r.netFinal_p50 >= V0 ? "var(--positive)" : r.netFinal_p50 >= 0 ? "var(--ink)" : "var(--negative)",
                }}>{fmtUsd(r.netFinal_p50)}</div>
              </div>
            </div>
            <button
              onClick={() => onApply(r.wPctNet)}
              style={{
                ...styles.loadBtn,
                background: isCurrent ? "var(--ink-muted)" : it.color,
                cursor: isCurrent ? "default" : "pointer",
              }}
              disabled={isCurrent}
            >
              {isCurrent ? "✓ Activo" : "Elegir este retiro →"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceSensitivityTableV2({ confidenceTable, V0Propio, currentAnnualPct, onApply }) {
  if (!confidenceTable) return null;
  return (
    <div style={styles.sensitivityTableWrap}>
      <table style={styles.sensitivityTable}>
        <thead>
          <tr>
            <th style={{ ...styles.sensTh, textAlign: "left" }}>Monto deseado<br/>(% anual / V₀)</th>
            <th style={styles.sensTh}>USD/mes<br/>(techo)</th>
            <th style={styles.sensTh}>USD/año<br/>(techo)</th>
            <th style={styles.sensTh}>Realizado p50<br/>(promedio/año)</th>
            <th style={styles.sensTh}>Confianza</th>
            <th style={styles.sensTh}>99%</th>
            <th style={styles.sensTh}>95%</th>
            <th style={styles.sensTh}>90%</th>
            <th style={styles.sensTh}>Net p10</th>
            <th style={styles.sensTh}>Net p50</th>
            <th style={styles.sensTh}>Net p90</th>
            <th style={styles.sensTh}></th>
          </tr>
        </thead>
        <tbody>
          {confidenceTable.rows.map((r) => {
            const isCurrent = Math.abs(r.annualPct - currentAnnualPct) < 1e-6;
            const tier = r.passes99 ? "positive" : r.passes95 ? "gold" : r.passes90 ? "warn" : "neg";
            const tierBg =
              tier === "positive" ? "rgba(45, 94, 58, 0.06)" :
              tier === "gold"     ? "rgba(184, 146, 58, 0.07)" :
              tier === "warn"     ? "rgba(201, 122, 46, 0.08)" :
                                    "rgba(139, 44, 44, 0.06)";
            return (
              <tr key={r.annualPct}
                style={{
                  background: isCurrent ? "var(--surface-2)" : tierBg,
                  outline: isCurrent ? "2px solid var(--ink)" : "none",
                  cursor: "pointer",
                }}
                onClick={() => onApply(r.W_monthDesired)}>
                <td style={{ ...styles.sensTd, textAlign: "left", fontWeight: 600 }}>
                  {fmtPct(r.annualPct, 2)}
                  {isCurrent && <span style={styles.sensCurrentBadge}>actual</span>}
                </td>
                <td style={styles.sensTd}>{fmtUsd(r.W_monthDesired)}</td>
                <td style={styles.sensTd}>{fmtUsd(r.W_yearDesired)}</td>
                <td style={{ ...styles.sensTd, color: "var(--ink-muted)" }}>{fmtUsd(r.W_yearActual_p50)}</td>
                <td style={{ ...styles.sensTd, fontWeight: 600 }}>{fmtPct(r.confidence, 1)}</td>
                <td style={{ ...styles.sensTd, color: r.passes99 ? "var(--positive)" : "var(--ink-muted)" }}>{r.passes99 ? "✓" : "—"}</td>
                <td style={{ ...styles.sensTd, color: r.passes95 ? "var(--positive)" : "var(--ink-muted)" }}>{r.passes95 ? "✓" : "—"}</td>
                <td style={{ ...styles.sensTd, color: r.passes90 ? "var(--positive)" : "var(--ink-muted)" }}>{r.passes90 ? "✓" : "—"}</td>
                <td style={{ ...styles.sensTd, color: r.netFinal_p10 >= 0 ? "var(--ink-muted)" : "var(--negative)" }}>{fmtUsd(r.netFinal_p10)}</td>
                <td style={{
                  ...styles.sensTd, fontWeight: 600,
                  color: r.netFinal_p50 >= V0Propio ? "var(--positive)" : r.netFinal_p50 >= 0 ? "var(--ink)" : "var(--negative)",
                }}>{fmtUsd(r.netFinal_p50)}</td>
                <td style={{ ...styles.sensTd, color: "var(--positive)" }}>{fmtUsd(r.netFinal_p90)}</td>
                <td style={styles.sensTd}>
                  <button onClick={(e) => { e.stopPropagation(); onApply(r.W_monthDesired); }}
                    style={styles.sensApplyBtn} disabled={isCurrent}
                    title={isCurrent ? "Ya activo" : "Aplicar este retiro"}>
                    {isCurrent ? "✓" : "→"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function YearByYearTable({ pledgeResult, T, V0Propio }) {
  if (!pledgeResult?.yearStats) return null;
  const stats = pledgeResult.yearStats;
  const rows = [];
  let cumW = 0;
  for (let y = 1; y <= T && y < stats.length; y++) {
    const s = stats[y];
    cumW += s.w_p50;
    // Ratio efectivo de retiro: W_t / NW_t mediana en el año
    const effRatio = s.nw_p50 > 0 ? s.w_p50 / s.nw_p50 : 0;
    rows.push({ ...s, cumW, effRatio });
  }
  return (
    <div style={styles.monthlyImpactWrap}>
      <table style={styles.monthlyImpactTable}>
        <thead>
          <tr>
            <th style={styles.miTh}>Año</th>
            <th style={styles.miTh}>V<br/>(cartera p50)</th>
            <th style={styles.miTh}>L<br/>(préstamo p50)</th>
            <th style={styles.miTh}>Retiro/año<br/>(realizado p50)</th>
            <th style={styles.miTh}>Retiro/mes</th>
            <th style={styles.miTh}>% efectivo<br/>(W/NW)</th>
            <th style={styles.miTh}>LTV<br/>(p50)</th>
            <th style={styles.miTh}>NW = V − L<br/>(p50)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.year}>
              <td style={styles.miTdYear}>Año {r.year}</td>
              <td style={styles.miTd}>{fmtUsd(r.v_p50)}</td>
              <td style={{ ...styles.miTd, color: "var(--negative)" }}>{fmtUsd(r.l_p50)}</td>
              <td style={styles.miTd}>{fmtUsd(r.w_p50)}</td>
              <td style={{ ...styles.miTd, fontWeight: 600 }}>{fmtUsd(r.w_p50 / 12)}</td>
              <td style={{ ...styles.miTd, color: "var(--ink-muted)" }}>{fmtPct(r.effRatio, 2)}</td>
              <td style={{
                ...styles.miTd,
                color: r.ltv_p50 < 50 ? "var(--positive)" : r.ltv_p50 < 65 ? "var(--gold)" : "var(--negative)",
              }}>{r.ltv_p50.toFixed(1)}%</td>
              <td style={{
                ...styles.miTd, fontWeight: 600,
                color: r.nw_p50 >= V0Propio ? "var(--positive)" : r.nw_p50 >= 0 ? "var(--ink)" : "var(--negative)",
              }}>{fmtUsd(r.nw_p50)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// NET WORTH AREA CHART · escenarios apilados (p10, p25, p50, p75, p90)
// Bandas concéntricas tipo "fan chart". Mediana en línea oscura.
// Más simple y legible que Bollinger para distribuciones lognormales.
// ============================================================
function NetWorthAreaChart({ pledgeResult, T, V0Propio }) {
  if (!pledgeResult?.yearStats) return null;
  const baselineStats = pledgeResult.baseline?.yearStats;
  const data = pledgeResult.yearStats.slice(0, T + 1).map((s, idx) => {
    const p1  = Math.max(0, s.nw_p1);
    const p10 = Math.max(0, s.nw_p10);
    const p25 = Math.max(0, s.nw_p25);
    const p75 = Math.max(0, s.nw_p75);
    const p90 = Math.max(0, s.nw_p90);
    const p99 = Math.max(0, s.nw_p99);
    const baseline = baselineStats?.[idx]?.nw_p50 ?? null;
    return {
      year: s.year,
      base: p1,                            // base = p1 (la cola más pesimista)
      band_1_10:   p10 - p1,               // 1-10% paths: muy pesimista
      band_10_25:  p25 - p10,
      band_25_50:  s.nw_p50 - p25,
      band_50_75:  p75 - s.nw_p50,
      band_75_90:  p90 - p75,
      band_90_99:  p99 - p90,              // 90-99% paths: muy optimista
      p50: s.nw_p50,
      baseline_p50: baseline,
      p1, p10, p25, p75, p90, p99,
    };
  });
  const showBaseline = baselineStats !== undefined && baselineStats !== null;
  return (
    <div style={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 12, right: 24, left: 70, bottom: 30 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="year" stroke="var(--ink-muted)"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            label={{ value: "Año", position: "insideBottom", offset: -8, fill: "var(--ink-muted)", fontSize: 11 }} />
          <YAxis stroke="var(--ink-muted)"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            tickFormatter={(v) => fmtUsdCompact(v)}
            label={{ value: "Patrimonio neto (USD)", angle: -90, position: "insideLeft", offset: -55, fill: "var(--ink-muted)", fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'base' || name?.startsWith?.('band_')) return null;
              return [fmtUsd(value), name];
            }}
            labelFormatter={(y) => `Año ${y}`}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }} />
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, paddingTop: 8 }}
            payload={[
              { value: "p1–p10 (peor 1-10% · cola extrema)", type: "square", color: "rgba(139, 44, 44, 0.10)", payload: { strokeDasharray: "0" } },
              { value: "p10–p25 (pesimista)",  type: "square", color: "rgba(139, 44, 44, 0.18)", payload: { strokeDasharray: "0" } },
              { value: "p25–p50",              type: "square", color: "rgba(184, 146, 58, 0.22)", payload: { strokeDasharray: "0" } },
              { value: "p50–p75",              type: "square", color: "rgba(184, 146, 58, 0.22)", payload: { strokeDasharray: "0" } },
              { value: "p75–p90 (optimista)",  type: "square", color: "rgba(45, 94, 58, 0.18)", payload: { strokeDasharray: "0" } },
              { value: "p90–p99 (mejor 90-99% · cola extrema)", type: "square", color: "rgba(45, 94, 58, 0.10)", payload: { strokeDasharray: "0" } },
              { value: "Mediana (con apalancamiento)", type: "line", color: "var(--ink)", payload: { strokeDasharray: "0" } },
              ...(showBaseline ? [{ value: "Mediana sin apalancamiento (lev=0%)", type: "line", color: "var(--accent)", payload: { strokeDasharray: "6 4" } }] : []),
            ]} />
          {/* Bandas apiladas: base + 6 anchos */}
          <Area type="monotone" dataKey="base" stackId="band" stroke="none" fill="transparent" legendType="none" name="base" />
          <Area type="monotone" dataKey="band_1_10" stackId="band" stroke="none"
            fill="rgba(139, 44, 44, 0.10)" name="band_1_10" />
          <Area type="monotone" dataKey="band_10_25" stackId="band" stroke="none"
            fill="rgba(139, 44, 44, 0.18)" name="band_10_25" />
          <Area type="monotone" dataKey="band_25_50" stackId="band" stroke="none"
            fill="rgba(184, 146, 58, 0.22)" name="band_25_50" />
          <Area type="monotone" dataKey="band_50_75" stackId="band" stroke="none"
            fill="rgba(184, 146, 58, 0.22)" name="band_50_75" />
          <Area type="monotone" dataKey="band_75_90" stackId="band" stroke="none"
            fill="rgba(45, 94, 58, 0.18)" name="band_75_90" />
          <Area type="monotone" dataKey="band_90_99" stackId="band" stroke="none"
            fill="rgba(45, 94, 58, 0.10)" name="band_90_99" />
          {showBaseline && (
            <Line type="monotone" dataKey="baseline_p50" stroke="var(--accent)"
              strokeWidth={2} strokeDasharray="6 4" dot={false} name="Mediana sin apalancamiento" />
          )}
          <Line type="monotone" dataKey="p50" stroke="var(--ink)" strokeWidth={2.8} dot={false} name="Mediana" />
          <ReferenceLine y={V0Propio} stroke="var(--ink-muted)" strokeDasharray="2 3"
            label={{ value: `V₀ = ${fmtUsdCompact(V0Propio)}`, position: "insideTopRight",
                     fill: "var(--ink-muted)", fontSize: 10 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// MARGIN CALL CURVES CHART · LTV mediana a lo largo del horizonte
// para 5 niveles de retiro (1%, 2%, 3%, 4%, 5%). La línea horizontal
// punteada marca el umbral de margin call. Cuando una curva cruza
// arriba, ese retiro tocó el umbral en mediana.
// ============================================================
function MarginCallCurvesChart({ marginCallCurves, mcLTV, T }) {
  if (!marginCallCurves || marginCallCurves.length === 0) return null;
  const data = [];
  for (let t = 0; t <= T; t++) {
    const row = { year: t };
    marginCallCurves.forEach((c, i) => {
      row[`ltv_${i}_p50`] = c.yearStats[t]?.ltv_p50 ?? null;
      row[`ltv_${i}_p99`] = c.yearStats[t]?.ltv_p99 ?? null;
    });
    data.push(row);
  }
  const colors = ["#2d7a40", "#7aa83a", "#b89535", "#c97a2e", "#a83a35"];
  return (
    <div style={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={440}>
        <LineChart data={data} margin={{ top: 12, right: 28, left: 50, bottom: 30 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="year" stroke="var(--ink-muted)"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            label={{ value: "Año", position: "insideBottom", offset: -8, fill: "var(--ink-muted)", fontSize: 11 }} />
          <YAxis stroke="var(--ink-muted)" domain={[0, "dataMax + 10"]}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            label={{ value: "LTV (L/V, %)", angle: -90, position: "insideLeft", offset: -35, fill: "var(--ink-muted)", fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [value?.toFixed(1) + "%", name]}
            labelFormatter={(y) => `Año ${y}`}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }} />
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, paddingTop: 8 }}
            payload={[
              ...marginCallCurves.map((c, i) => ({
                value: `${c.label} · ${fmtUsdCompact(c.monthly)}/mes`,
                type: "line", color: colors[i],
                payload: { strokeDasharray: "0" },
              })),
              { value: "── sólida: mediana   ┄┄ punteada: p99 (peor 1%)",
                type: "line", color: "var(--ink-muted)",
                payload: { strokeDasharray: "0" } },
            ]} />
          <ReferenceLine y={mcLTV * 100} stroke="var(--negative)" strokeWidth={1.5} strokeDasharray="6 4"
            label={{ value: `MARGIN CALL @ ${(mcLTV * 100).toFixed(0)}%`,
                     position: "insideTopRight", fill: "var(--negative)",
                     fontSize: 10.5, fontWeight: 700 }} />
          {/* p50 (mediana) — líneas sólidas */}
          {marginCallCurves.map((c, i) => (
            <Line key={`p50_${i}`} type="monotone" dataKey={`ltv_${i}_p50`}
              name={`${c.label} · mediana`}
              stroke={colors[i]} strokeWidth={2.4} dot={false} legendType="none" />
          ))}
          {/* p99 (extremo) — líneas punteadas más finas */}
          {marginCallCurves.map((c, i) => (
            <Line key={`p99_${i}`} type="monotone" dataKey={`ltv_${i}_p99`}
              name={`${c.label} · p99 (peor 1%)`}
              stroke={colors[i]} strokeWidth={1.4} strokeDasharray="4 3"
              dot={false} legendType="none" />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BacktestCard({ title, subtitle, data, accent }) {
  const accentColor = accent === "accent" ? "var(--accent)" : "var(--ink)";
  return (
    <div style={{ ...styles.optCard, borderColor: accentColor }}>
      <div>
        <div style={{ ...styles.optCardLabel, color: accentColor }}>{title}</div>
        <div style={styles.optCardDesc}>{subtitle}</div>
      </div>
      <div style={styles.optMetrics}>
        <div>
          <div style={styles.optMetricLabel}>Valor final</div>
          <div style={styles.optMetricValue}>{fmtUsd(data.equity[data.equity.length-1])}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>CAGR</div>
          <div style={{...styles.optMetricValue, color: data.cagr >= 0 ? "var(--positive)" : "var(--negative)"}}>
            {fmtPct(data.cagr, 2)}
          </div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Sharpe</div>
          <div style={styles.optMetricValue}>{data.sharpe.toFixed(2)}</div>
        </div>
      </div>
      <div style={styles.optMetrics}>
        <div>
          <div style={styles.optMetricLabel}>Volatilidad</div>
          <div style={{...styles.optMetricValue, fontSize: 18}}>{fmtPct(data.vol, 1)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Max Drawdown</div>
          <div style={{...styles.optMetricValue, fontSize: 18, color: "var(--negative)"}}>{fmtPct(data.maxDD, 1)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Calmar</div>
          <div style={{...styles.optMetricValue, fontSize: 18}}>{(data.calmar || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// Versión para el walk-forward backtest: 3 líneas (hold/wf/sp)
function BacktestLineCard({ title, subtitle, data, accent, V0 = 10000 }) {
  const accentColor =
    accent === "accent" ? "var(--accent)" :
    accent === "gold"   ? "var(--gold)" :
                          "var(--ink)";
  return (
    <div style={{ ...styles.optCard, borderColor: accentColor }}>
      <div>
        <div style={{ ...styles.optCardLabel, color: accentColor }}>{title}</div>
        <div style={styles.optCardDesc}>{subtitle}</div>
      </div>
      <div style={styles.optMetrics}>
        <div>
          <div style={styles.optMetricLabel}>Valor final</div>
          <div style={styles.optMetricValue}>{fmtUsd(data.finalV)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>CAGR</div>
          <div style={{...styles.optMetricValue, color: data.cagr >= 0 ? "var(--positive)" : "var(--negative)"}}>
            {fmtPct(data.cagr, 2)}
          </div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Sharpe</div>
          <div style={styles.optMetricValue}>{data.sharpe.toFixed(2)}</div>
        </div>
      </div>
      <div style={styles.optMetrics}>
        <div>
          <div style={styles.optMetricLabel}>σ realizada</div>
          <div style={{...styles.optMetricValue, fontSize: 18}}>{fmtPct(data.vol, 1)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>Max DD</div>
          <div style={{...styles.optMetricValue, fontSize: 18, color: "var(--negative)"}}>{fmtPct(data.maxDD, 1)}</div>
        </div>
        <div>
          <div style={styles.optMetricLabel}>β vs S&P</div>
          <div style={{...styles.optMetricValue, fontSize: 18}}>
            {isFinite(data.beta) ? data.beta.toFixed(2) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable({ portfolios }) {
  // Identificar qué activos aparecen con peso > 0.5% en alguna cartera
  const usedSet = new Set();
  portfolios.forEach(p => p.w.forEach((w, i) => { if (w > 0.005) usedSet.add(i); }));

  // Agrupar por clase de activo (5 buckets independientes de moneda), en orden fijo
  const catsOrdered = ASSET_GROUP_ORDER.map(g => ({ cat: g, indices: [] }));
  ASSETS.forEach((a, i) => {
    if (!usedSet.has(i)) return;
    const g = groupOf(a);
    const bucket = catsOrdered.find(b => b.cat === g);
    if (bucket) bucket.indices.push(i);
  });
  // Filtra grupos vacíos
  const groups = catsOrdered.filter(g => g.indices.length > 0);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 18, overflowX: "auto" }}>
      <table style={styles.compTable}>
        <thead>
          <tr>
            <th style={{ ...styles.compTh, textAlign: "left" }}>Activo</th>
            {portfolios.map(p => (
              <th key={p.label} style={styles.compTh}>{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g, gi) => (
            <React.Fragment key={g.cat}>
              {/* Subheader de categoría */}
              <tr>
                <td colSpan={1 + portfolios.length} style={styles.compCatHeader}>
                  {g.cat}
                </td>
              </tr>
              {g.indices.map(i => (
                <tr key={i}>
                  <td style={styles.compTdAsset}>
                    <span style={styles.tag}>{ASSETS[i].cur}</span>{" "}
                    <span style={{ marginLeft: 4 }}>{ASSETS[i].name}</span>
                  </td>
                  {portfolios.map(p => (
                    <td key={p.label} style={{
                      ...styles.compTd,
                      background: `rgba(122, 27, 27, ${Math.min(p.w[i] * 2, 0.35)})`,
                      fontWeight: p.w[i] > 0.10 ? 600 : 400,
                    }}>
                      {p.w[i] > 0.005 ? fmtPct(p.w[i], 1) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Subtotal de la categoría */}
              <tr style={styles.compCatSubtotal}>
                <td style={styles.compCatSubtotalLabel}>
                  Σ {g.cat}
                </td>
                {portfolios.map(p => {
                  const sum = g.indices.reduce((acc, i) => acc + p.w[i], 0);
                  return (
                    <td key={p.label} style={styles.compCatSubtotalValue}>
                      {sum > 0.005 ? fmtPct(sum, 1) : "—"}
                    </td>
                  );
                })}
              </tr>
            </React.Fragment>
          ))}
          <tr style={{ borderTop: "2px solid var(--ink)" }}>
            <td style={{...styles.compTdAsset, fontWeight: 600, paddingTop: 10}}>Retorno esperado</td>
            {portfolios.map(p => (
              <td key={p.label} style={{...styles.compTd, fontWeight: 600, paddingTop: 10}}>{fmtPct(p.mu)}</td>
            ))}
          </tr>
          <tr>
            <td style={{...styles.compTdAsset, fontWeight: 600}}>Volatilidad</td>
            {portfolios.map(p => (
              <td key={p.label} style={{...styles.compTd, fontWeight: 600}}>{fmtPct(p.sigma)}</td>
            ))}
          </tr>
          <tr>
            <td style={{...styles.compTdAsset, fontWeight: 600}}>Sharpe Ratio</td>
            {portfolios.map(p => (
              <td key={p.label} style={{...styles.compTd, fontWeight: 600, color: "var(--gold)"}}>{p.sharpe.toFixed(3)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  :root {
    --bg: #f1ead9;
    --surface: #fbf8ef;
    --surface-2: #f6efde;
    --ink: #1a1410;
    --ink-muted: #6b5e4d;
    --border: #d9cfb8;
    --border-strong: #b8a98a;
    --accent: #7a1b1b;
    --accent-soft: #c4544a;
    --positive: #2d5e3a;
    --negative: #8b2c2c;
    --gold: #b8923a;
    --band-outer: rgba(122, 27, 27, 0.10);
    --band-mid: rgba(122, 27, 27, 0.22);
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    outline: none;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 1px var(--accent);
  }
  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 1px var(--accent);
  }
  /* === Slider integrado del AssetSlider — thumb prominente sobre la barra === */
  input.threshold-slider {
    background: transparent;
    border: none;
    border-radius: 0;
    height: 22px;
  }
  input.threshold-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 26px;
    border-radius: 3px;
    background: var(--accent);
    cursor: grab;
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 1.5px var(--accent), 0 1px 3px rgba(0,0,0,0.25);
    margin-top: -2px;
  }
  input.threshold-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    box-shadow: 0 0 0 1.5px var(--accent), 0 2px 6px rgba(0,0,0,0.4);
  }
  input.threshold-slider::-moz-range-thumb {
    width: 16px;
    height: 26px;
    border-radius: 3px;
    background: var(--accent);
    cursor: grab;
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 1.5px var(--accent), 0 1px 3px rgba(0,0,0,0.25);
  }
  input.threshold-slider::-moz-range-thumb:active {
    cursor: grabbing;
  }
  input.threshold-slider::-webkit-slider-runnable-track {
    background: transparent;
    height: 22px;
    border: none;
  }
  input.threshold-slider::-moz-range-track {
    background: transparent;
    height: 22px;
    border: none;
  }
`;

const styles = {
  root: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--ink)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    padding: "32px 40px 80px",
    lineHeight: 1.5,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1.5px solid var(--ink)",
    paddingBottom: 18,
    marginBottom: 22,
    gap: 30,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 44,
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.0,
    letterSpacing: "-0.02em",
  },
  titleAmp: {
    fontStyle: "italic",
    color: "var(--accent)",
    fontWeight: 400,
  },
  subtitle: {
    marginTop: 8,
    color: "var(--ink-muted)",
    fontSize: 13,
  },
  // Inputs editables en el header (monto inicial + DCA mensual)
  headerInputsRow: {
    display: "flex",
    gap: 18,
    marginTop: 12,
    flexWrap: "wrap",
  },
  headerInputLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    cursor: "text",
  },
  headerInputLabelText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
  },
  headerInputWrap: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 4,
    padding: "5px 10px",
    border: "1.5px solid var(--border)",
    borderRadius: 3,
    background: "var(--surface)",
    transition: "border-color 160ms",
  },
  headerInputCurrency: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "var(--ink-muted)",
    fontWeight: 600,
  },
  headerInput: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 15,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink)",
    border: "none",
    outline: "none",
    background: "transparent",
    width: 110,
    padding: 0,
  },
  headerInputUnit: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "var(--ink-muted)",
  },
  headerStats: {
    display: "flex",
    gap: 22,
    flexWrap: "wrap",
  },
  stat: {
    textAlign: "right",
    minWidth: 110,
  },
  statLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 2,
  },
  statValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: 24,
    borderBottom: "1px solid var(--border)",
  },
  tab: {
    background: "transparent",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink-muted)",
    padding: "12px 20px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
    letterSpacing: "0.02em",
  },
  tabActive: {
    color: "var(--accent)",
    borderBottom: "2px solid var(--accent)",
    fontWeight: 600,
  },
  section: {},
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.05fr 1fr",
    gap: 36,
    alignItems: "start",
  },
  h2: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 600,
    margin: "0 0 14px",
    letterSpacing: "-0.01em",
  },
  h3: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    margin: "26px 0 10px",
    letterSpacing: "-0.005em",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  presetRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  presetBtn: {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    color: "var(--ink)",
    padding: "4px 10px",
    fontSize: 11,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    borderRadius: 2,
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "var(--ink-muted)",
    marginLeft: 8,
  },
  catBlock: {
    marginBottom: 14,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "10px 14px",
    borderRadius: 2,
  },
  catHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: "1px dashed var(--border)",
  },
  catTotal: {
    color: "var(--accent)",
    fontWeight: 600,
  },
  assetRow: {
    display: "grid",
    gridTemplateColumns: "1fr 110px",
    gap: 14,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px dashed var(--border)",
  },
  assetInfo: {},
  assetName: {
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--ink)",
    marginBottom: 2,
  },
  assetMeta: {
    display: "flex",
    gap: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    color: "var(--ink-muted)",
    alignItems: "center",
  },
  tag: {
    background: "var(--ink)",
    color: "var(--bg)",
    padding: "1px 5px",
    fontSize: 8.5,
    letterSpacing: "0.05em",
    borderRadius: 1,
  },
  range100: {
    color: "var(--accent)",
  },
  rangeSmall: {
    width: "100%",
  },
  weightVal: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    textAlign: "right",
    color: "var(--ink)",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderTop: "1.5px solid var(--ink)",
    marginTop: 8,
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 600,
  },
  totalValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 16,
    fontWeight: 600,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  metric: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "12px 14px",
    borderRadius: 2,
  },
  metricLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 24,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.1,
  },
  metricSub: {
    fontSize: 10.5,
    color: "var(--ink-muted)",
    marginTop: 3,
  },
  catBars: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: 12,
  },
  catBarStrip: {
    display: "flex",
    height: 14,
    width: "100%",
    overflow: "hidden",
    borderRadius: 1,
    marginBottom: 10,
  },
  catLegend: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
  },
  catLegendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
  },
  catLegendName: {
    flex: 1,
    color: "var(--ink-muted)",
  },
  catLegendValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },
  notes: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    paddingLeft: 18,
    margin: 0,
    lineHeight: 1.6,
  },
  controlsRow: {
    display: "flex",
    gap: 24,
    alignItems: "flex-end",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "16px 20px",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  labelTop: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    display: "block",
    marginBottom: 8,
  },
  range: { width: "100%", display: "block" },
  confRow: { display: "flex", gap: 4 },
  confBtn: {
    background: "transparent",
    border: "1px solid var(--border-strong)",
    padding: "6px 14px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    cursor: "pointer",
    color: "var(--ink)",
    borderRadius: 2,
  },
  confBtnActive: {
    background: "var(--accent)",
    color: "var(--bg)",
    borderColor: "var(--accent)",
    fontWeight: 600,
  },
  headline: {
    background: "var(--ink)",
    color: "var(--bg)",
    padding: "20px 24px",
    borderRadius: 2,
    marginBottom: 22,
  },
  headlineLine: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    lineHeight: 1.4,
  },
  headlineNumber: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 600,
    color: "var(--gold)",
    fontSize: 22,
  },
  headlineSub: {
    marginTop: 8,
    fontSize: 13,
    color: "var(--border)",
    opacity: 0.9,
  },
  scenarioGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    marginBottom: 8,
  },
  scenario: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "14px 16px",
    borderRadius: 2,
  },
  scenarioHead: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "var(--ink-muted)",
    marginBottom: 8,
  },
  scenarioLabel: {
    fontWeight: 500,
  },
  scenarioP: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    background: "var(--surface-2)",
    padding: "1px 5px",
    borderRadius: 1,
  },
  scenarioValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    marginBottom: 4,
  },
  scenarioCagr: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    fontFamily: "'JetBrains Mono', monospace",
  },
  chartWrap: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "20px 16px 14px",
    borderRadius: 2,
  },
  legend: {
    display: "flex",
    gap: 24,
    fontSize: 11.5,
    color: "var(--ink-muted)",
    paddingTop: 12,
    paddingLeft: 30,
    alignItems: "center",
  },
  intro: {
    color: "var(--ink-muted)",
    fontSize: 13,
    maxWidth: 800,
    marginBottom: 22,
  },
  pignoControls: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 24,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: 24,
    marginBottom: 24,
    borderRadius: 2,
  },
  sliderControl: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sliderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sliderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  sliderValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 500,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
  },
  sliderHint: {
    fontSize: 10.5,
    color: "var(--ink-muted)",
    marginTop: 2,
  },
  runWrap: {
    gridColumn: "span 3",
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 4,
  },
  runBtn: {
    background: "var(--accent)",
    color: "var(--bg)",
    border: "none",
    padding: "10px 22px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderRadius: 2,
  },
  placeholder: {
    background: "var(--surface)",
    border: "1px dashed var(--border-strong)",
    padding: 40,
    textAlign: "center",
    color: "var(--ink-muted)",
    fontStyle: "italic",
    fontSize: 13,
  },
  footer: {
    marginTop: 50,
    paddingTop: 20,
    borderTop: "1px solid var(--border)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    textAlign: "center",
  },
  markowitzHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 30,
    marginBottom: 22,
    flexWrap: "wrap",
  },
  optimaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 30,
  },
  optCard: {
    background: "var(--surface)",
    border: "1.5px solid var(--border)",
    padding: "20px 22px",
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  optCardHighlight: {
    borderWidth: 2,
    background: "var(--surface-2)",
    boxShadow: "0 6px 24px rgba(122, 27, 27, 0.08)",
  },
  optCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  optCardLabel: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: 1,
  },
  optCardDesc: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginTop: 4,
  },
  optBadge: {
    color: "var(--ink)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 8px",
    letterSpacing: "0.08em",
    borderRadius: 1,
  },
  optMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    padding: "14px 0",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
  },
  optMetricLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  optMetricValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    marginTop: 2,
  },
  optTopAssets: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  optTopAssetsLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 4,
  },
  optAssetRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11.5,
    paddingBottom: 3,
    borderBottom: "1px dashed var(--border)",
  },
  optAssetName: {
    color: "var(--ink)",
    paddingRight: 8,
  },
  optAssetWeight: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    color: "var(--ink)",
  },
  loadBtn: {
    color: "var(--bg)",
    border: "none",
    padding: "10px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    cursor: "pointer",
    borderRadius: 2,
    marginTop: 4,
  },

  // ============ TARGET PICKER (cartera personalizada por objetivo) ============
  targetPickerWrap: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid #5a3fa0",
    padding: "22px 24px",
    margin: "30px 0 26px",
    borderRadius: 2,
  },
  targetPickerHeader: {
    marginBottom: 16,
  },
  targetPickerIntro: {
    color: "var(--ink-muted)",
    fontSize: 13,
    maxWidth: 820,
    margin: 0,
    lineHeight: 1.55,
  },
  targetModeTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 18,
  },
  targetModeTab: {
    background: "var(--surface)",
    border: "1.5px solid var(--border)",
    borderRadius: 2,
    padding: "12px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
    transition: "border-color 0.15s, background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "left",
  },
  targetModeTabActive: {
    borderColor: "#5a3fa0",
    background: "var(--surface-2)",
    boxShadow: "inset 3px 0 0 #5a3fa0",
  },
  targetModeTabKey: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 600,
    color: "#5a3fa0",
    lineHeight: 1,
    width: 28,
    textAlign: "center",
  },
  targetModeTabLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: 600,
    color: "var(--ink)",
  },
  targetModeTabHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    letterSpacing: "0.04em",
  },
  targetSlidersGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 18,
  },
  targetSliderCard: {
    background: "var(--surface-2)",
    border: "1.5px solid var(--border)",
    padding: "14px 16px 12px",
    borderRadius: 2,
    transition: "border-color 0.15s, background 0.15s",
  },
  targetSliderHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  targetSliderIcon: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    width: 24,
    textAlign: "center",
    lineHeight: 1,
  },
  targetSliderLabelGroup: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  targetSliderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  targetSliderActiveBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "1px 6px",
    border: "1px solid",
    borderRadius: 2,
    fontWeight: 600,
  },
  targetSliderValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  targetSliderRailWrap: {
    padding: "4px 0",
  },
  targetSliderRange: {
    width: "100%",
    cursor: "pointer",
  },
  targetSliderFootRow: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    color: "var(--ink-muted)",
    letterSpacing: "0.04em",
    marginTop: 6,
  },
  targetInfeasible: {
    background: "rgba(139, 44, 44, 0.08)",
    border: "1px solid var(--negative)",
    borderLeft: "3px solid var(--negative)",
    padding: "12px 16px",
    fontSize: 12.5,
    color: "var(--ink)",
    lineHeight: 1.5,
    borderRadius: 2,
  },
  targetResultCard: {
    background: "var(--surface)",
    border: "1.5px solid #5a3fa0",
    padding: "18px 20px",
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  targetResultTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    flexWrap: "wrap",
  },
  targetResultLabel: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  targetResultDesc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    letterSpacing: "0.04em",
    color: "var(--ink-muted)",
    marginTop: 4,
  },
  targetResultMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    padding: "12px 0",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
  },
  targetResultMetric: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  targetResultMetricLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  targetResultMetricValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.1,
  },
  targetResultMetricDelta: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    fontWeight: 600,
    marginTop: 2,
  },
  targetResultPositions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  targetResultPositionsLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 4,
  },
  targetResultPositionsList: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    columnGap: 18,
    rowGap: 4,
  },
  targetResultPositionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12,
    paddingBottom: 3,
    borderBottom: "1px dotted var(--border)",
  },
  targetResultPositionName: {
    color: "var(--ink)",
  },
  targetResultPositionWeight: {
    fontFamily: "'JetBrains Mono', monospace",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    color: "var(--ink)",
  },

  comparisonTable: {
    marginBottom: 20,
  },
  compTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
  },
  compTh: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    padding: "8px 10px",
    textAlign: "center",
    borderBottom: "1.5px solid var(--ink)",
  },
  compTdAsset: {
    padding: "6px 10px",
    fontSize: 11.5,
    color: "var(--ink)",
    borderBottom: "1px solid var(--border)",
  },
  compTd: {
    padding: "6px 10px",
    textAlign: "center",
    fontFamily: "'JetBrains Mono', monospace",
    fontVariantNumeric: "tabular-nums",
    borderBottom: "1px solid var(--border)",
    fontSize: 12,
  },
  compCatHeader: {
    padding: "10px 10px 6px 10px",
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "var(--ink)",
    background: "var(--surface-2)",
    borderTop: "1px solid var(--border-strong)",
    borderBottom: "1px solid var(--border)",
  },
  compCatSubtotal: {
    background: "var(--surface-2)",
  },
  compCatSubtotalLabel: {
    padding: "5px 10px",
    fontSize: 10.5,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.04em",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
  },
  compCatSubtotalValue: {
    padding: "5px 10px",
    textAlign: "center",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink-muted)",
    borderBottom: "1px solid var(--border)",
  },
  distribIntro: {
    fontSize: 12.5,
    color: "var(--ink-muted)",
    maxWidth: 850,
    lineHeight: 1.6,
    marginTop: -4,
    marginBottom: 12,
  },
  distribStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  distribStat: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--accent)",
    padding: "12px 14px",
    borderRadius: 2,
  },
  distribStatLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 6,
    lineHeight: 1.4,
  },
  distribStatValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
  },
  distribStatSub: {
    fontSize: 10.5,
    color: "var(--ink-muted)",
    marginTop: 3,
    fontFamily: "'JetBrains Mono', monospace",
  },
  dotSquare: {
    width: 10,
    height: 10,
    display: "inline-block",
    borderRadius: 1,
  },
  // Tax panel
  taxPanel: {
    background: "var(--surface-2)",
    border: "1px solid var(--border-strong)",
    borderRadius: 2,
    padding: "12px 18px",
    marginBottom: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  taxPanelLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  taxPanelIcon: {
    color: "var(--accent)",
    fontSize: 16,
  },
  taxPanelHint: {
    fontWeight: 400,
    color: "var(--ink-muted)",
    fontSize: 11.5,
    fontStyle: "italic",
  },
  taxInputs: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  taxInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 2,
    padding: "5px 10px",
  },
  taxInputLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--ink)",
  },
  taxInput: {
    width: 38,
    border: "none",
    background: "transparent",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "right",
    color: "var(--ink)",
    outline: "none",
  },
  taxInputPct: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "var(--ink-muted)",
  },
  resetRetBtn: {
    background: "transparent",
    border: "1px solid var(--ink-muted)",
    color: "var(--ink-muted)",
    padding: "5px 12px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    cursor: "pointer",
    borderRadius: 2,
  },
  // Asset slider with editable return
  assetTopLine: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  assetEditRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    marginBottom: 2,
    flexWrap: "wrap",
  },
  retLabel: {
    fontWeight: 700,
    color: "var(--ink)",
    fontSize: 11,
  },
  retInput: {
    width: 50,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    fontWeight: 600,
    textAlign: "right",
    padding: "1px 4px",
    outline: "none",
    borderRadius: 1,
  },
  retInputPct: {
    fontSize: 10,
    color: "var(--ink-muted)",
    marginLeft: -2,
  },
  taxIndicator: {
    color: "var(--gold)",
    fontSize: 9.5,
    fontStyle: "italic",
  },
  assetSep: {
    color: "var(--border-strong)",
    margin: "0 2px",
  },
  assetSigma: {
    color: "var(--ink-muted)",
  },
  assetRefRow: {
    fontSize: 9.5,
    color: "var(--ink-muted)",
    fontFamily: "'JetBrains Mono', monospace",
    display: "flex",
    gap: 8,
    alignItems: "center",
    paddingTop: 1,
  },
  refItem: {
    letterSpacing: "0.02em",
  },
  refSep: {
    color: "var(--border-strong)",
    fontWeight: 300,
  },
  // Backtest UI
  btControls: {
    display: "flex",
    gap: 36,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "16px 22px",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  btControlGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  btMetricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    marginBottom: 26,
  },
  btCompCard: {
    background: "var(--surface-2)",
    border: "1.5px solid var(--gold)",
    padding: "20px 22px",
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  btCompMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
  },
  btCompFooter: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    fontStyle: "italic",
    paddingTop: 2,
  },
  btNote: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--gold)",
    padding: "12px 16px",
    fontSize: 11.5,
    color: "var(--ink-muted)",
    lineHeight: 1.6,
    marginTop: 18,
  },
  // Composition hint + portfolio switcher
  compositionHint: {
    fontSize: 12,
    color: "var(--ink-muted)",
    maxWidth: 500,
    lineHeight: 1.5,
  },
  portfolioSwitcher: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-end",
  },
  portfolioSwitcherLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  portfolioSwitcherButtons: {
    display: "flex",
    gap: 4,
  },
  portfolioBtn: {
    background: "transparent",
    border: "1.5px solid var(--border-strong)",
    color: "var(--ink)",
    padding: "5px 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 2,
    transition: "all 0.15s ease",
  },
  portfolioBtnActive: {
    color: "var(--bg)",
    fontWeight: 700,
    boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
  },
  staleBar: {
    color: "var(--bg)",
    padding: "10px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12.5,
    fontWeight: 500,
    marginBottom: 14,
    borderRadius: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  staleBtn: {
    background: "var(--bg)",
    color: "var(--ink)",
    border: "none",
    padding: "6px 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderRadius: 2,
  },
  // Asset slider with return-as-slider design
  assetSigmaTop: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
  },
  pensovSigmaSelect: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    fontWeight: 600,
    color: "var(--accent)",
    background: "var(--surface)",
    border: "1px solid var(--accent)",
    borderRadius: 2,
    padding: "1px 4px",
    cursor: "pointer",
    fontVariantNumeric: "tabular-nums",
    marginLeft: 2,
  },
  capBadgeActive: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "2px 7px",
    border: "1px solid var(--accent)",
    background: "rgba(122, 27, 27, 0.10)",
    color: "var(--accent)",
    borderRadius: 2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  capBadgeInactive: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    fontWeight: 500,
    letterSpacing: "0.04em",
    padding: "2px 7px",
    border: "1px dashed var(--border-strong)",
    background: "transparent",
    color: "var(--ink-muted)",
    borderRadius: 2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    opacity: 0.65,
  },
  histBadgeFull: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "2px 7px",
    border: "1px solid var(--positive)",
    background: "rgba(74, 124, 89, 0.10)",
    color: "var(--positive)",
    borderRadius: 2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  histBadgePartial: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "2px 7px",
    border: "1px solid var(--gold)",
    background: "rgba(184, 146, 58, 0.10)",
    color: "var(--gold)",
    borderRadius: 2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  retSliderRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  retSliderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--ink-muted)",
    minWidth: 70,
  },
  retSliderWrap: {
    position: "relative",
    flex: 1,
    height: 18,
    display: "flex",
    alignItems: "center",
  },
  retSliderTrack: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 4,
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  damodaranBand: {
    position: "absolute",
    top: 0,
    height: 4,
    background: "rgba(184, 146, 58, 0.35)",
    borderRadius: 2,
  },
  refMarkerHist: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 12,
    background: "var(--ink)",
    transform: "translateX(-50%)",
  },
  refMarkerLow: {
    position: "absolute",
    top: -2,
    width: 1.5,
    height: 8,
    background: "var(--gold)",
    transform: "translateX(-50%)",
  },
  refMarkerHigh: {
    position: "absolute",
    top: -2,
    width: 1.5,
    height: 8,
    background: "var(--gold)",
    transform: "translateX(-50%)",
  },
  retSliderInput: {
    width: "100%",
    height: 18,
    background: "transparent",
    position: "relative",
    zIndex: 2,
    cursor: "pointer",
    appearance: "none",
  },
  retSliderValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontWeight: 600,
    minWidth: 56,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  // Weight read-only display box
  weightBox: {
    background: "var(--surface-2)",
    border: "1px solid var(--border-strong)",
    borderRadius: 2,
    padding: "8px 12px",
    minWidth: 88,
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  weightBoxLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  weightBoxValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  weightBar: {
    height: 3,
    background: "var(--border)",
    borderRadius: 1,
    overflow: "hidden",
    marginTop: 2,
  },
  weightBarFill: {
    height: "100%",
    background: "var(--accent)",
  },
  // Data status banner
  dataBanner: {
    background: "var(--surface)",
    border: "1.5px solid var(--gold)",
    borderRadius: 2,
    padding: "12px 18px",
    marginBottom: 22,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  dataBannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  dataBadge: {
    color: "var(--ink)",
    padding: "4px 10px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    borderRadius: 1,
  },
  dataBannerText: {
    fontSize: 12.5,
    color: "var(--ink)",
  },
  dataBtn: {
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    padding: "9px 18px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderRadius: 2,
  },
  dataBtnSecondary: {
    background: "transparent",
    color: "var(--ink)",
    border: "1.5px solid var(--ink)",
    padding: "8px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderRadius: 2,
  },
  dataBannerButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(26, 20, 16, 0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 24,
  },
  modalBox: {
    background: "var(--surface)",
    border: "2px solid var(--ink)",
    borderRadius: 2,
    maxWidth: 700,
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
  },
  modalHeader: {
    background: "var(--ink)",
    color: "var(--bg)",
    padding: "14px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    letterSpacing: "-0.01em",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "var(--bg)",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
  },
  modalBody: {
    padding: "22px 24px",
  },
  modalSection: {
    marginBottom: 22,
  },
  modalSectionTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 10,
    fontWeight: 600,
  },
  tickerList: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
  },
  tickerListItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11.5,
    padding: "4px 0",
  },
  tickerListItemEditable: {
    background: "rgba(184, 146, 58, 0.08)",
    padding: "4px 8px",
    borderLeft: "2px solid var(--gold)",
  },
  tickerListIdx: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    width: 22,
  },
  tickerListSymbol: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: 11,
    background: "var(--ink)",
    color: "var(--bg)",
    padding: "1px 5px",
    borderRadius: 1,
    minWidth: 50,
    textAlign: "center",
  },
  tickerListName: {
    color: "var(--ink-muted)",
    flex: 1,
    fontSize: 11,
  },
  tickerListEditTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "var(--gold)",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  modalList: {
    margin: 0,
    paddingLeft: 22,
    fontSize: 12.5,
    color: "var(--ink)",
    lineHeight: 1.8,
  },
  modalCode: {
    background: "var(--ink)",
    color: "var(--gold)",
    padding: "2px 8px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    borderRadius: 1,
    fontWeight: 600,
  },
  modalNote: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--gold)",
    padding: "10px 14px",
    fontSize: 11.5,
    color: "var(--ink-muted)",
    lineHeight: 1.6,
    fontStyle: "italic",
  },
  modalFooter: {
    background: "var(--surface-2)",
    padding: "14px 22px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  copyCodeBtn: {
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    padding: "10px 18px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderRadius: 2,
    transition: "background 0.2s ease",
  },
  modalConfirm: {
    background: "var(--accent)",
    color: "var(--bg)",
    border: "none",
    padding: "10px 22px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: 2,
  },
  // Editable ticker/range inputs in asset rows
  assetRowEditable: {
    background: "rgba(184, 146, 58, 0.06)",
    borderLeft: "3px solid var(--gold)",
    paddingLeft: 8,
  },
  editableLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  tickerInput: {
    background: "var(--bg)",
    border: "1.5px solid var(--gold)",
    color: "var(--ink)",
    padding: "3px 8px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    width: 80,
    textAlign: "center",
    outline: "none",
    borderRadius: 1,
    letterSpacing: "0.05em",
  },
  refPlaceholder: {
    fontStyle: "italic",
    color: "var(--gold)",
    fontSize: 9.5,
  },
  rangeMiniInput: {
    width: 38,
    border: "1px solid var(--border-strong)",
    background: "var(--bg)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    fontWeight: 600,
    textAlign: "right",
    padding: "0 3px",
    outline: "none",
    borderRadius: 1,
  },
  rangeMiniPct: {
    fontSize: 9,
    color: "var(--ink-muted)",
    marginLeft: 1,
  },
  // Pignoración layout
  pignControlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 22,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "18px 22px",
    marginBottom: 14,
    borderRadius: 2,
  },

  // === V3 HERO + LAYOUT ===
  pignHero: {
    borderBottom: "1px solid var(--border)",
    paddingBottom: 18,
    marginBottom: 22,
  },

  // V4: RECUADRO DESTACADO — MONTO DESEADO
  withdrawalHero: {
    background: "var(--surface)",
    border: "2px solid var(--ink)",
    borderRadius: 2,
    padding: "22px 28px",
    marginBottom: 18,
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 28,
    alignItems: "center",
  },
  withdrawalHeroLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  withdrawalHeroLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 700,
  },
  withdrawalHeroInputRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  withdrawalHeroPrefix: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "var(--ink-muted)",
    fontWeight: 600,
  },
  withdrawalHeroInput: {
    fontFamily: "'Fraunces', serif",
    fontSize: 44,
    fontWeight: 700,
    color: "var(--ink)",
    border: "none",
    background: "transparent",
    borderBottom: "2px solid var(--ink)",
    padding: "2px 4px",
    width: 200,
    outline: "none",
    fontVariantNumeric: "tabular-nums",
  },
  withdrawalHeroSuffix: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    color: "var(--ink-muted)",
    fontWeight: 500,
  },
  withdrawalHeroDesc: {
    fontSize: 12,
    color: "var(--ink-muted)",
    lineHeight: 1.55,
    marginTop: 6,
  },
  withdrawalHeroRight: {
    paddingLeft: 24,
    borderLeft: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  withdrawalHeroRatioLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
  },
  withdrawalHeroRatioValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 32,
    fontWeight: 700,
    color: "var(--accent)",
    lineHeight: 1.05,
    fontVariantNumeric: "tabular-nums",
  },
  withdrawalHeroRatioDesc: {
    fontSize: 11,
    color: "var(--ink-muted)",
    lineHeight: 1.4,
  },
  // V4: CONTROLES SIMPLIFICADOS (5 columnas = 4 sliders + horizon link)
  pignControlsGridSimple: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 22,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "18px 22px",
    marginBottom: 14,
    borderRadius: 2,
  },
  // V4: SUB-LABEL del MC curve card (multiplicador)
  mcCurveSubLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    color: "var(--ink-muted)",
    marginTop: -2,
    marginBottom: 4,
    letterSpacing: "0.04em",
  },

  pignHeroTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 38,
    fontWeight: 600,
    color: "var(--ink)",
    margin: 0,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  pignHeroSub: {
    fontSize: 13.5,
    color: "var(--ink-muted)",
    margin: "8px 0 0",
    maxWidth: 720,
    lineHeight: 1.55,
    fontStyle: "italic",
  },
  // V3 HEADLINE — one big banner row with 4 inline metrics + dividers
  pignHeadlineHero: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr",
    background: "var(--surface)",
    border: "1.5px solid var(--ink)",
    padding: "22px 26px",
    marginTop: 22,
    marginBottom: 26,
    borderRadius: 2,
    alignItems: "center",
  },
  pignHeadlineItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 8px",
  },
  pignHeadlineDivider: {
    width: 1,
    alignSelf: "stretch",
    background: "var(--border)",
    margin: "0 6px",
  },
  pignHeadlineLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
  },
  pignHeadlineValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 32,
    fontWeight: 700,
    color: "var(--ink)",
    lineHeight: 1.05,
    fontVariantNumeric: "tabular-nums",
    marginTop: 2,
  },
  pignHeadlineSub: {
    fontSize: 11,
    color: "var(--ink-muted)",
    marginTop: 2,
    lineHeight: 1.4,
  },
  // V3 CHART SECTIONS
  pignChartSection: {
    marginBottom: 28,
    padding: "20px 22px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 2,
  },
  pignSectionHeader: {
    marginBottom: 14,
  },
  pignSectionTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--ink)",
    margin: 0,
    lineHeight: 1.1,
  },
  pignSectionDesc: {
    fontSize: 12,
    color: "var(--ink-muted)",
    margin: "6px 0 0",
    lineHeight: 1.55,
    maxWidth: 900,
  },
  // V3 MC CURVE CARDS — uno por nivel de retiro debajo del gráfico
  mcCurveCards: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    marginTop: 14,
  },
  mcCurveCard: {
    background: "var(--surface-2)",
    border: "2px solid",
    borderRadius: 2,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    cursor: "pointer",
    transition: "box-shadow 0.15s, background 0.15s",
  },
  mcCurveLabel: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  mcCurveMetric: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontVariantNumeric: "tabular-nums",
  },
  mcCurveMetricLabel: {
    color: "var(--ink-muted)",
  },
  mcCurveStatus: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    letterSpacing: "0.04em",
    marginTop: 4,
    paddingTop: 6,
    borderTop: "1px dotted var(--border)",
    fontWeight: 600,
  },
  // V3 DETAILS (collapsibles)
  pignDetails: {
    marginBottom: 18,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    padding: "14px 20px",
    borderRadius: 2,
  },
  pignSummary: {
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    letterSpacing: "0.04em",
    color: "var(--ink)",
    fontWeight: 600,
    listStyle: "revert",
  },
  // V3 MECHANICS EXPLAINER
  pignMechBox: {
    background: "var(--surface-2)",
    borderLeft: "3px solid var(--gold)",
    padding: "16px 22px",
    marginTop: 14,
    borderRadius: 2,
  },
  pignMechTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink)",
    fontWeight: 700,
    marginBottom: 10,
  },
  pignMechList: {
    margin: 0,
    paddingLeft: 22,
    fontSize: 12,
    color: "var(--ink-muted)",
    lineHeight: 1.7,
  },
  // V2: 7 columnas para los 6 sliders + horizon link
  pignControlsGridV2: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 18,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "18px 22px",
    marginBottom: 14,
    borderRadius: 2,
  },
  // V2: 4 cards headline en una sola fila
  pignHeadline: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginTop: 14,
    marginBottom: 18,
  },
  // V2: fila con run button + hint a la derecha
  runRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  runHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    color: "var(--ink-muted)",
    letterSpacing: "0.02em",
  },
  staleBadge: {
    display: "inline-block",
    marginLeft: 12,
    padding: "3px 10px",
    background: "var(--gold)",
    color: "var(--bg)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderRadius: 2,
  },
  // Mini-card embebido en el grid de controles que muestra el horizonte tomado de la pestaña III
  horizonLink: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    background: "var(--surface-2)",
    border: "1px dashed var(--border-strong)",
    padding: "8px 12px",
    borderRadius: 2,
    justifyContent: "center",
  },
  horizonLinkValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  horizonLinkBtn: {
    background: "transparent",
    border: "none",
    padding: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--accent)",
    cursor: "pointer",
    textAlign: "left",
    textDecoration: "underline",
    letterSpacing: "0.04em",
    marginTop: 2,
  },

  // ============ CONFIDENCE CARDS (99/95/90%) ============
  confidenceSection: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--ink)",
    padding: "20px 22px",
    margin: "24px 0",
    borderRadius: 2,
  },
  confidenceCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    marginTop: 14,
    marginBottom: 18,
  },
  confidenceCard: {
    background: "var(--surface-2)",
    border: "2px solid",
    padding: "16px 18px",
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  confidenceCardSelected: {
    boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
    background: "var(--surface)",
  },
  confidenceCardHeader: { display: "flex", flexDirection: "column", gap: 2 },
  confidenceCardLabel: {
    fontFamily: "'Fraunces', serif",
    fontSize: 19,
    fontWeight: 600,
  },
  confidenceCardDesc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "var(--ink-muted)",
    letterSpacing: "0.04em",
  },
  confidenceCardInfeasible: {
    fontSize: 12,
    color: "var(--negative)",
    fontStyle: "italic",
    lineHeight: 1.5,
    padding: "12px 0",
  },
  confidenceCardMainNumber: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "8px 0",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    fontFamily: "'Fraunces', serif",
    fontSize: 38,
    fontWeight: 700,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  confidenceCardMainSub: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--ink-muted)",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.04em",
  },
  confidenceCardMetrics: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6,
  },
  confidenceCardMetricLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  confidenceCardMetricValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
  },

  // ============ SENSITIVITY TABLE ============
  sensitivityTableWrap: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: 0,
    borderRadius: 2,
    overflowX: "auto",
    marginBottom: 24,
  },
  sensitivityTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
  },
  sensTh: {
    textAlign: "right",
    padding: "10px 12px",
    fontSize: 10,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "2px solid var(--ink)",
    background: "var(--surface-2)",
    whiteSpace: "nowrap",
  },
  sensTd: {
    textAlign: "right",
    padding: "8px 12px",
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink)",
    borderBottom: "1px dotted var(--border)",
  },
  sensCurrentBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--bg)",
    background: "var(--ink)",
    padding: "1px 6px",
    marginLeft: 8,
    borderRadius: 2,
    fontWeight: 600,
  },
  sensApplyBtn: {
    background: "transparent",
    border: "1px solid var(--border-strong)",
    padding: "2px 9px",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "var(--ink)",
    borderRadius: 2,
    fontWeight: 600,
  },

  // ============ MONTHLY IMPACT TABLE ============
  monthlyImpactWrap: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: 0,
    borderRadius: 2,
    overflowX: "auto",
    marginBottom: 18,
  },
  monthlyImpactTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
  },
  miTh: {
    textAlign: "right",
    padding: "10px 14px",
    fontSize: 10,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "2px solid var(--ink)",
    background: "var(--surface-2)",
    whiteSpace: "nowrap",
  },
  miTdYear: {
    textAlign: "left",
    padding: "8px 14px",
    fontWeight: 600,
    color: "var(--ink)",
    fontFamily: "'Fraunces', serif",
    fontSize: 13,
    borderBottom: "1px dotted var(--border)",
  },
  miTd: {
    textAlign: "right",
    padding: "8px 14px",
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink)",
    borderBottom: "1px dotted var(--border)",
  },

  // ============ ADVANCED COLLAPSIBLE ============
  advancedDetails: {
    marginTop: 30,
    padding: "0 18px",
    border: "1px solid var(--border)",
    borderRadius: 2,
    background: "var(--surface-2)",
  },
  advancedSummary: {
    cursor: "pointer",
    padding: "14px 0",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink)",
    fontWeight: 600,
    listStyle: "none",
  },
  pignTaxRow: {
    display: "flex",
    alignItems: "center",
    gap: 22,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    padding: "12px 18px",
    borderRadius: 2,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
    color: "var(--ink)",
  },
  pignTaxInputs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 22,
    flex: 1,
    minWidth: 300,
  },

  // ============ WITHDRAWAL MODE TOGGLE ============
  withdrawModeBox: {
    background: "var(--surface)",
    border: "1.5px solid var(--ink)",
    borderRadius: 2,
    padding: "16px 20px",
    marginBottom: 18,
  },
  withdrawModeHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: 14,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  withdrawModeTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink)",
    fontWeight: 700,
  },
  withdrawModeHint: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    fontStyle: "italic",
  },
  withdrawModeOptions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  withdrawModeOption: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 14px",
    background: "var(--surface-2)",
    border: "1.5px solid var(--border)",
    borderRadius: 2,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
  },
  withdrawModeOptionActive: {
    borderColor: "var(--ink)",
    background: "var(--surface)",
    boxShadow: "inset 3px 0 0 var(--ink)",
  },
  withdrawModeLabel: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: 4,
  },
  withdrawModeDesc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "var(--ink-muted)",
    marginBottom: 6,
  },
  withdrawModeFormula: {
    fontSize: 11.5,
    color: "var(--ink)",
    lineHeight: 1.5,
  },
  // Heatmap
  heatmapWrap: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    marginTop: 24,
  },
  heatmapToggle: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "14px 20px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
    cursor: "pointer",
    textAlign: "left",
    letterSpacing: "0.01em",
  },
  heatmapBody: {
    padding: "0 20px 22px",
    borderTop: "1px solid var(--border)",
    paddingTop: 18,
  },
  heatmapHeader: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    textAlign: "center",
    borderBottom: "1.5px solid var(--ink)",
    paddingBottom: 4,
  },
  heatmapCol: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    fontWeight: 600,
    textAlign: "center",
    paddingBottom: 6,
  },
  heatmapRow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    fontWeight: 600,
    paddingRight: 10,
    textAlign: "right",
    minWidth: 40,
    borderRight: "1.5px solid var(--ink)",
  },
  sweepCrossovers: {
    display: "flex",
    gap: 22,
    paddingTop: 12,
    marginTop: 8,
    borderTop: "1px solid var(--border)",
    fontSize: 11.5,
    color: "var(--ink-muted)",
    alignItems: "center",
    flexWrap: "wrap",
  },
  sweepCrossLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
  },

  // ============ Barra de Objetivos (Horizonte tab) ============
  // ============ Recuadro consolidado de benchmarks (5 filas compactas) ============
  benchmarksBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "10px 16px 14px 16px",
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 2,
  },
  benchmarksHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 1.4fr) minmax(60px, 0.7fr) minmax(160px, 2.2fr) minmax(75px, 0.9fr) minmax(70px, 0.8fr)",
    gap: 14,
    alignItems: "center",
    padding: "8px 6px 6px 6px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
  },
  benchmarkRow: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 1.4fr) minmax(60px, 0.7fr) minmax(160px, 2.2fr) minmax(75px, 0.9fr) minmax(70px, 0.8fr)",
    gap: 14,
    alignItems: "center",
    padding: "8px 6px",
    borderBottom: "1px dotted var(--border)",
    fontSize: 12.5,
    fontFamily: "'DM Sans', sans-serif",
  },
  benchmarksColName: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 600,
    color: "var(--ink)",
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  benchmarkIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  benchmarksColMeta: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink)",
    fontWeight: 500,
  },
  benchmarksColBar: {
    minWidth: 0,
  },
  benchmarksTickLabelsRow: {
    position: "relative",
    height: 14,
  },
  benchmarksTickLabel: {
    position: "absolute",
    transform: "translateX(-50%)",
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: "var(--ink-muted)",
    letterSpacing: "0.06em",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    textTransform: "uppercase",
  },
  // Tabla de milestones (años necesarios por confianza)
  milestonesTableWrap: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "12px 16px",
    marginTop: 8,
    borderRadius: 2,
  },
  milestonesTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
  },
  milestonesThLeft: {
    textAlign: "left",
    padding: "6px 8px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
  },
  milestonesTh: {
    textAlign: "center",
    padding: "6px 8px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
  },
  milestonesTdName: {
    padding: "8px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
    color: "var(--ink)",
  },
  milestonesColorDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    border: "1px solid var(--border)",
    flexShrink: 0,
  },
  milestonesTd: {
    textAlign: "center",
    padding: "8px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontVariantNumeric: "tabular-nums",
  },
  milestonesNote: {
    marginTop: 10,
    fontSize: 11.5,
    color: "var(--ink-muted)",
    lineHeight: 1.5,
    fontStyle: "italic",
  },
  benchmarkBarTrack: {
    position: "relative",
    display: "block",
    height: 14,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    overflow: "hidden",
  },
  benchmarkBarFill: {
    position: "absolute",
    top: 0, left: 0, bottom: 0,
    transition: "width 240ms ease, background 240ms ease",
  },
  benchmarkBarTickFine: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 1,
    background: "rgba(0,0,0,0.25)",
    pointerEvents: "none",
  },
  benchmarksColProb: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  benchmarksColSpread: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    textAlign: "right",
  },

  goalsLadder: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginTop: 14,
    marginBottom: 12,
  },
  goalRow: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--gold)",
    borderRadius: 2,
    padding: "14px 20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  goalRowHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  goalTitle: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    flex: "1 1 240px",
    minWidth: 0,
  },
  goalIcon: {
    fontSize: 22,
    lineHeight: 1.1,
    flexShrink: 0,
    marginTop: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.25,
    marginBottom: 4,
  },
  goalHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "var(--ink-muted)",
    lineHeight: 1.45,
    fontVariantNumeric: "tabular-nums",
  },
  goalHintSep: {
    margin: "0 6px",
    opacity: 0.5,
  },
  goalProbBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    textAlign: "right",
    flexShrink: 0,
  },
  goalProbNum: {
    fontFamily: "'Fraunces', 'DM Sans', serif",
    fontSize: 28,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    letterSpacing: "-0.01em",
  },
  goalProbLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginTop: 6,
  },
  goalBarTrack: {
    position: "relative",
    height: 18,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  goalBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    transition: "width 280ms ease, background 280ms ease",
  },
  goalBarTick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1.5,
    pointerEvents: "none",
  },
  goalBarPointer: {
    position: "absolute",
    top: -1,
    width: 0,
    height: 0,
    borderLeft: "5px solid transparent",
    borderRight: "5px solid transparent",
    borderTop: "6px solid var(--ink)",
    transform: "translateX(-50%)",
    transition: "left 280ms ease, border-top-color 280ms ease",
    pointerEvents: "none",
  },
  goalThresholdLabels: {
    position: "relative",
    height: 26,
    marginTop: 2,
    overflow: "visible",
  },
  goalThresholdLabel: {
    position: "absolute",
    transform: "translateX(-50%)",
    top: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.02em",
    textAlign: "center",
    width: 22,
    fontVariantNumeric: "tabular-nums",
  },
  goalStatusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 2,
    paddingTop: 8,
    borderTop: "1px dashed var(--border)",
  },
  goalStatusBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 2,
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.06em",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  goalStatusSpread: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "var(--ink-muted)",
    fontVariantNumeric: "tabular-nums",
  },
  goalsFootnote: {
    fontSize: 11,
    color: "var(--ink-muted)",
    fontStyle: "italic",
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 1.5,
  },

  // ============ Caja horizontal de métricas (tab Cartera) ============
  // ============ Composition pie chart por clase de activo ============
  compositionPieBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "16px 20px 12px 20px",
    marginBottom: 16,
    borderRadius: 2,
  },
  compositionPieHeader: {
    marginBottom: 8,
  },
  compositionPieTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    letterSpacing: "-0.01em",
    color: "var(--ink)",
  },
  compositionPieSub: {
    fontSize: 11,
    color: "var(--ink-muted)",
    marginTop: 2,
    lineHeight: 1.4,
  },
  compositionPieGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr)",
    gap: 24,
    alignItems: "center",
  },
  compositionPieChart: {
    minWidth: 0,
  },
  compositionPieTable: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  compositionPieRow: {
    display: "grid",
    gridTemplateColumns: "16px 1fr auto",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  compositionPieSwatch: {
    width: 14,
    height: 14,
    borderRadius: 2,
    border: "1px solid var(--border)",
  },
  compositionPieLabel: {
    color: "var(--ink)",
  },
  compositionPieValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    color: "var(--ink)",
  },
  metricsHorizontalBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--accent)",
    borderRadius: 2,
    padding: "16px 20px 18px",
    marginBottom: 24,
  },
  metricsHorizontalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 18,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  metricsHorizontalTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
    margin: 0,
    textTransform: "capitalize",
  },
  metricsHorizontalSub: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    fontFamily: "'JetBrains Mono', monospace",
    flex: "1 1 320px",
    minWidth: 0,
    textAlign: "right",
  },
  metricsHorizontalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
    gap: 14,
  },
  metricCompact: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  metricCompactLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  metricCompactValue: {
    fontFamily: "'Fraunces', 'DM Sans', serif",
    fontSize: 19,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
  },
  metricCompactSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "var(--ink-muted)",
    letterSpacing: "0.02em",
  },

  // ============ Control bar (toggle robust + reset) ============
  cartControlBar: {
    display: "flex",
    alignItems: "stretch",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  toggleBox: {
    flex: "1 1 280px",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "8px 12px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    cursor: "pointer",
  },
  toggleBoxHeader: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
  },
  toggleBoxHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    lineHeight: 1.4,
    marginLeft: 22,
  },
  robustToggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12.5,
    cursor: "pointer",
    flex: "1 1 320px",
    flexWrap: "wrap",
  },
  robustToggleHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "var(--ink-muted)",
    marginLeft: 8,
    lineHeight: 1.45,
  },

  // ============ Asset slider: nuevos elementos ============
  assetSpacer: { flex: 1 },
  assetMetricsGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3,
    minWidth: 0,
  },
  assetMetricsTopRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  assetCurrentMu: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "var(--ink-muted)",
    whiteSpace: "nowrap",
  },
  assetDesc: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    marginTop: 2,
    marginBottom: 2,
    lineHeight: 1.4,
    fontStyle: "italic",
  },
  assetMetaBlock: {
    marginTop: 4,
    marginBottom: 4,
  },
  assetLongName: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: 2,
    fontFamily: "'Fraunces', serif",
    letterSpacing: "-0.005em",
  },
  assetSectorRow: {
    display: "flex",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  assetSectorTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "1px 6px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--ink)",
    fontWeight: 600,
    borderRadius: 2,
  },
  assetIndustryTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    letterSpacing: "0.04em",
    padding: "1px 6px",
    background: "transparent",
    border: "1px dashed var(--border-strong)",
    color: "var(--ink-muted)",
    borderRadius: 2,
  },
  assetSourceRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 11,
    color: "var(--ink-muted)",
    marginTop: 6,
    marginBottom: 6,
  },
  sourceLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
  },
  sourceCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    background: "var(--surface-2)",
    padding: "1px 6px",
    borderRadius: 2,
    border: "1px solid var(--border)",
    color: "var(--ink)",
  },

  // ============ Threshold bar (estructura split: labels arriba/abajo + slider integrado) ============
  thresholdBarWrap: {
    position: "relative",
    marginTop: 10,
    marginBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
  },
  // Fila de labels ARRIBA (Damodaran + Histórica)
  thresholdLabelsTop: {
    position: "relative",
    height: 28,
    marginBottom: 4,
  },
  thresholdBtnTop: {
    position: "absolute",
    bottom: 0,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'JetBrains Mono', monospace",
    minWidth: 0,
    whiteSpace: "nowrap",
    transform: "translateX(-50%)",
  },
  // Track interactivo: contenedor que aloja fondo + tick lines + slider
  thresholdTrackInteractive: {
    position: "relative",
    height: 22,
  },
  // Fondo gris visible de la barra
  thresholdTrackBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 22,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    zIndex: 0,
  },
  // Tick line vertical en cada umbral
  thresholdTickLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  },
  // Input range con track transparente, thumb prominente sobre el fondo+ticks
  thresholdRangeInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 22,
    appearance: "none",
    WebkitAppearance: "none",
    background: "transparent",
    margin: 0,
    padding: 0,
    cursor: "pointer",
    zIndex: 2,
  },
  // Fila de labels ABAJO (Mín 1y + 3 escenarios consenso)
  thresholdLabelsBottom: {
    position: "relative",
    height: 28,
    marginTop: 4,
  },
  thresholdBtnBottom: {
    position: "absolute",
    top: 0,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'JetBrains Mono', monospace",
    minWidth: 0,
    whiteSpace: "nowrap",
    transform: "translateX(-50%)",
  },
  thresholdBtnLabel: {
    fontSize: 9.5,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontWeight: 700,
    lineHeight: 1,
  },
  thresholdBtnValue: {
    fontSize: 10,
    fontWeight: 500,
    marginTop: 2,
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink-muted)",
    lineHeight: 1,
  },
  thresholdHidden: {
    marginTop: 4,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    color: "var(--ink-muted)",
    fontStyle: "italic",
    letterSpacing: "0.02em",
    opacity: 0.7,
  },
  // Eje X con ticks de rentabilidad debajo del bar
  thresholdXAxis: {
    position: "relative",
    height: 20,
    marginTop: 2,
  },
  thresholdXTickWrap: {
    position: "absolute",
    top: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transform: "translateX(-50%)",
    pointerEvents: "none",
  },
  thresholdXTickMark: {
    width: 1,
    height: 4,
    background: "var(--ink-muted)",
    opacity: 0.5,
  },
  thresholdXTickLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "var(--ink-muted)",
    fontVariantNumeric: "tabular-nums",
    marginTop: 1,
    letterSpacing: "0.02em",
    opacity: 0.7,
  },

  // ============ Panel de impuestos compacto (al final del tab) ============
  taxPanelCompact: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "10px 14px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    marginTop: 24,
    flexWrap: "wrap",
  },
  taxPanelCompactLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11.5,
    color: "var(--ink)",
    fontWeight: 500,
  },
  taxInputsCompact: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
  },
  // ============ Panel de escenarios endowment ============
  endowmentPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--gold)",
    borderRadius: 2,
    padding: "16px 18px",
    marginTop: 24,
    marginBottom: 24,
  },
  endowmentHeader: {
    marginBottom: 14,
  },
  endowmentSub: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    marginTop: 4,
    fontFamily: "'JetBrains Mono', monospace",
  },
  endowmentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  scenarioCard: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderTop: "3px solid var(--ink)",
    borderRadius: 2,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  scenarioName: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
  },
  scenarioMult: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.1,
  },
  scenarioCondition: {
    fontSize: 10.5,
    color: "var(--ink-muted)",
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.4,
    minHeight: 28,
  },
  scenarioFreqBar: {
    height: 4,
    background: "var(--border)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  scenarioFreqFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  scenarioFreqLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-muted)",
    letterSpacing: "0.02em",
  },

  // ============ Tabla proyección patrimonio ============
  projectionPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--positive)",
    borderRadius: 2,
    padding: "16px 18px",
    marginTop: 6,
    marginBottom: 24,
  },
  projectionSub: {
    fontSize: 11.5,
    color: "var(--ink-muted)",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  projectionTableWrap: {
    overflowX: "auto",
  },
  projectionTable: {
    width: "100%",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    borderCollapse: "collapse",
  },
  projTh: {
    textAlign: "right",
    padding: "8px 10px",
    fontSize: 10.5,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
  },
  projTdYear: {
    textAlign: "left",
    padding: "8px 10px",
    fontWeight: 600,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
    borderBottom: "1px solid var(--surface-2)",
  },
  projTd: {
    textAlign: "right",
    padding: "8px 10px",
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink)",
    borderBottom: "1px solid var(--surface-2)",
  },
};

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
  ComposedChart, Bar, ScatterChart, Scatter, ZAxis, Cell,
} from "recharts";

// ============================================================
// ASSET UNIVERSE - 16 assets across USD and PEN
// Expected returns from the user-provided table (midpoints)
// Volatilities are realistic dummy values; will be replaced by
// historical std once data download phase is implemented.
// ============================================================
const ASSETS = [
  // USD - Renta Variable
  { id: "cspx",  name: "ETF S&P 500 (CSPX/VUAA)",     cur: "USD", cat: "Renta Variable USD",   ret: 0.090, vol: 0.1803, minW: 0.10, maxW: 0.25, defW: 0.15, retLow: 0.08, retHigh: 0.10, histRet: 0.1662, isCash: false },
  { id: "cndx",  name: "ETF Nasdaq 100 (CNDX)",       cur: "USD", cat: "Renta Variable USD",   ret: 0.110, vol: 0.2207, minW: 0.05, maxW: 0.15, defW: 0.08, retLow: 0.10, retHigh: 0.12, histRet: 0.2258, isCash: false },
  { id: "iwda",  name: "MSCI World 3000 (IWDA)",      cur: "USD", cat: "Renta Variable USD",   ret: 0.0775, vol: 0.1649, minW: 0.05, maxW: 0.20, defW: 0.10, retLow: 0.07, retHigh: 0.085, histRet: 0.1406, isCash: false },
  { id: "msft",  name: "MSFT (Growth)",               cur: "USD", cat: "Renta Variable USD",   ret: 0.125, vol: 0.2930, minW: 0.01, maxW: 0.05, defW: 0.03, retLow: 0.11, retHigh: 0.14, histRet: 0.2020, isCash: false },
  { id: "uber",  name: "UBER (Value)",                cur: "USD", cat: "Renta Variable USD",   ret: 0.105, vol: 0.5086, minW: 0.01, maxW: 0.05, defW: 0.02, retLow: 0.09, retHigh: 0.12, histRet: 0.0872, isCash: false },
  // USD - Refugio
  { id: "igln",  name: "Oro (IGLN)",                  cur: "USD", cat: "Refugio / Commodities", ret: 0.050, vol: 0.1729, minW: 0.03, maxW: 0.10, defW: 0.05, retLow: 0.04, retHigh: 0.06, histRet: 0.1994, isCash: false },
  // USD - Renta Fija
  { id: "vtc",   name: "Bonos Corporativos (VTC/LQD)",cur: "USD", cat: "Renta Fija USD",       ret: 0.050, vol: 0.0842, minW: 0.03, maxW: 0.15, defW: 0.06, retLow: 0.045, retHigh: 0.055, histRet: 0.0238, isCash: false },
  { id: "bil",   name: "Treasury 0-3M (BIL)",         cur: "USD", cat: "Renta Fija USD",       ret: 0.0475, vol: 0.00, minW: 0.02, maxW: 0.10, defW: 0.04, retLow: 0.045, retHigh: 0.050, histRet: 0.0270, isCash: true },
  { id: "ief",   name: "Treasury 10Y (IEF)",          cur: "USD", cat: "Renta Fija USD",       ret: 0.0425, vol: 0.0743, minW: 0.03, maxW: 0.12, defW: 0.06, retLow: 0.040, retHigh: 0.045, histRet: 0.0063, isCash: false },
  // USD - Especulativo
  { id: "btc",   name: "Bitcoin",                     cur: "USD", cat: "Especulativo",         ret: 0.200, vol: 0.6439, minW: 0.05, maxW: 0.05, defW: 0.05, retLow: 0.15, retHigh: 0.25, histRet: 0.4416, isCash: false },
  // USD - Cash
  { id: "ibsav", name: "Cuenta Ahorros IB (USD)",     cur: "USD", cat: "Cash / Equivalentes",  ret: 0.0314, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.04, retLow: 0.03, retHigh: 0.0314, histRet: 0.015, isCash: true },
  { id: "cdusd", name: "Plazo Fijo CD (USD)",         cur: "USD", cat: "Cash / Equivalentes",  ret: 0.0325, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.03, retLow: 0.020, retHigh: 0.045, histRet: 0.020, isCash: true },
  // PEN - Renta Variable
  { id: "epu",   name: "EPU - proxy El Dorado RV",    cur: "PEN", cat: "Perú - Renta Variable", ret: 0.080, vol: 0.2636, minW: 0.02, maxW: 0.08, defW: 0.04, retLow: 0.07, retHigh: 0.09, histRet: 0.1717, isCash: false },
  // PEN - Renta Fija (synthetic — no public ticker)
  { id: "pensov",name: "Bonos Soberanos PEN (sint.)", cur: "PEN", cat: "Perú - Renta Fija",    ret: 0.060, vol: 0.07, minW: 0.02, maxW: 0.08, defW: 0.04, retLow: 0.055, retHigh: 0.065, histRet: 0.045, isCash: false },
  // PEN - Cash
  { id: "pfpen", name: "Plazo Fijo PEN",              cur: "PEN", cat: "Cash / Equivalentes",  ret: 0.0475, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.02, retLow: 0.040, retHigh: 0.055, histRet: 0.045, isCash: true },
  { id: "savpen",name: "Cuenta Ahorros PEN",          cur: "PEN", cat: "Cash / Equivalentes",  ret: 0.045, vol: 0.00, minW: 0, maxW: 0.10, defW: 0.02, retLow: 0.040, retHigh: 0.050, histRet: 0.035, isCash: true },
];

// Metadata of the real-data download (from yfinance)
const DATA_META = {
  source: "yfinance",
  dateFrom: "2019-05-10",
  dateTo: "2026-05-21",
  years: 7.03,
  days: 1722,
  tickersUsed: {
    cspx: "CSPX.L", cndx: "CNDX.L", iwda: "IWDA.AS", msft: "MSFT", uber: "UBER",
    igln: "IGLN.L", vtc: "VTC", bil: "BIL", ief: "IEF", btc: "BTC-USD", epu: "EPU"
  },
  // BIL has real σ of 0.26% but kept at 0 per user's modeling decision (cash = zero risk)
  // pensov correlations are synthetic (no public Peru sovereign bond ticker that aligned)
  realSigmaBil: 0.00258,
};

const N = ASSETS.length;
const RISK_FREE = 0.045; // for Sharpe

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

// Pignoración: given initial LTV, draw loan, withdraw W per year, accrue interest
// Returns probability of margin call within T years
function pledgeAnalysis({ paths, ltv0, withdrawal, intRate, marginCallLTV, T, V0 = 10000 }) {
  const nSims = paths.length;
  let mcCount = 0;
  let mcTimesAccum = 0;
  let endLoans = [];
  let endValues = [];

  for (let s = 0; s < nSims; s++) {
    let loan = ltv0 * V0;
    let mc = false;
    let mcTime = T;
    const path = paths[s];
    for (let t = 1; t <= T; t++) {
      // Interest accrual + new withdrawal each year
      loan = loan * (1 + intRate) + withdrawal;
      const V = path[t];
      const ltv = loan / V;
      if (ltv > marginCallLTV) {
        mc = true; mcTime = t; break;
      }
    }
    if (mc) { mcCount++; mcTimesAccum += mcTime; }
    endLoans.push(loan);
    endValues.push(path[T]);
  }
  return {
    mcProb: mcCount / nSims,
    avgMCTime: mcCount > 0 ? mcTimesAccum / mcCount : null,
  };
}

// Bisection: find max sustainable withdrawal that keeps P(MC) <= tolProb
function maxSustainableWithdrawal({ paths, ltv0, intRate, marginCallLTV, T, tolProb, V0 = 10000 }) {
  let lo = 0, hi = V0 * 0.5; // upper guess: 50% of portfolio per year
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const { mcProb } = pledgeAnalysis({ paths, ltv0, withdrawal: mid, intRate, marginCallLTV, T, V0 });
    if (mcProb > tolProb) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

// ============================================================
// FULL PLEDGE SIMULATION with per-year percentile tracking
// Returns yearly statistics (V_p10/p50/p90, LTV_p10/p50/p90, loan)
// plus headline metrics (P(MC), total interest, net patrimony).
// ============================================================
function runFullPledgeSim({ mu, sigma, T, V0 = 10000, ltv0, intRate, marginCallLTV, withdrawalPct, N = 3000 }) {
  const W = V0 * withdrawalPct;
  const Loan0 = V0 * ltv0;
  // Generate portfolio paths
  const paths = simulatePaths({ mu, sigma, T, N, V0 });
  // Loan path is deterministic (independent of portfolio path)
  const loanPath = [Loan0];
  for (let t = 1; t <= T; t++) {
    loanPath.push(loanPath[t - 1] * (1 + intRate) + W);
  }
  // Per-year percentile aggregation
  const yearStats = [];
  for (let t = 0; t <= T; t++) {
    const vValues = new Array(N);
    for (let s = 0; s < N; s++) vValues[s] = paths[s][t];
    vValues.sort((a, b) => a - b);
    const p10v = vValues[Math.floor(N * 0.10)];
    const p50v = vValues[Math.floor(N * 0.50)];
    const p90v = vValues[Math.floor(N * 0.90)];
    const ltvs = vValues.map(v => loanPath[t] / v);
    ltvs.sort((a, b) => a - b);
    const p10ltv = ltvs[Math.floor(N * 0.10)];
    const p50ltv = ltvs[Math.floor(N * 0.50)];
    const p90ltv = ltvs[Math.floor(N * 0.90)];
    yearStats.push({
      year: t,
      v_p10: p10v, v_p50: p50v, v_p90: p90v,
      v_band_base: p10v,
      v_band_width: p90v - p10v,
      loan: loanPath[t],
      ltv_p10: p10ltv * 100, ltv_p50: p50ltv * 100, ltv_p90: p90ltv * 100,
      ltv_band_base: p10ltv * 100,
      ltv_band_width: (p90ltv - p10ltv) * 100,
      marginCallLine: marginCallLTV * 100,
    });
  }
  // P(margin call): path-level simulation
  let mcCount = 0;
  const mcTimes = [];
  for (let s = 0; s < N; s++) {
    let loan = Loan0;
    for (let t = 1; t <= T; t++) {
      loan = loan * (1 + intRate) + W;
      if (loan / paths[s][t] > marginCallLTV) {
        mcCount++;
        mcTimes.push(t);
        break;
      }
    }
  }
  const mcProb = mcCount / N;
  const avgMCTime = mcTimes.length > 0 ? mcTimes.reduce((a, b) => a + b, 0) / mcTimes.length : null;

  const finalLoan = loanPath[T];
  const totalCashWithdrawn = W * T;
  const totalInterest = finalLoan - Loan0 - totalCashWithdrawn;
  const final = yearStats[T];

  // Patrimonio neto final por path (necesario para comparar contra benchmarks)
  const netPatrimoniesFinal = new Array(N);
  for (let s = 0; s < N; s++) {
    netPatrimoniesFinal[s] = paths[s][T] - finalLoan;
  }

  return {
    yearStats,
    W, Loan0,
    mcProb, avgMCTime,
    totalCashWithdrawn,
    totalInterest,
    finalLoan,
    netPatrimony_p10: final.v_p10 - finalLoan,
    netPatrimony_p50: final.v_p50 - finalLoan,
    netPatrimony_p90: final.v_p90 - finalLoan,
    netPatrimoniesFinal,
  };
}

// ============================================================
// Resuelve numéricamente la tasa anual "equivalente" tal que la
// anualidad (V0 invertido al ratio r, retirando W/año durante T años)
// termina con un patrimonio final = finalWealth.
// Útil para anualizar el resultado de la pignoración en términos
// comparables con un PF de tasa fija.
// ============================================================
function solveEquivRate(V0, W, T, finalWealth) {
  let lo = -0.99, hi = 2.0;
  for (let iter = 0; iter < 60; iter++) {
    const r = (lo + hi) / 2;
    const growth = Math.pow(1 + r, T);
    const annFactor = Math.abs(r) > 1e-9 ? (growth - 1) / r : T;
    const wealth = V0 * growth - W * annFactor;
    if (wealth < finalWealth) lo = r;
    else hi = r;
  }
  return (lo + hi) / 2;
}

// ============================================================
// Horizon sweep: para cada T en [5..30], corre una simulación de
// pignoración y calcula vs PF PEN: excess CAGR, P(beat PF), Sharpe
// del esfuerzo. Encuentra el horizonte óptimo (mejor Sharpe).
// ============================================================
function runHorizonSweep({ mu, sigma, ltv0, intRate, marginCallLTV, withdrawalPct, pfRateNet, V0 = 10000, N = 1500 }) {
  const horizons = [5, 7, 10, 12, 15, 18, 20, 22, 25, 28, 30];
  const W_per_year_pct = withdrawalPct;
  const curve = [];
  for (const T of horizons) {
    const W = V0 * W_per_year_pct;
    // PF benchmark para este T
    const growth = Math.pow(1 + pfRateNet, T);
    const annFactor = Math.abs(pfRateNet) > 1e-9 ? (growth - 1) / pfRateNet : T;
    const pfFinal = V0 * growth - W * annFactor;
    // Pignoración: usar runFullPledgeSim con N reducido
    const sim = runFullPledgeSim({ mu, sigma, T, V0, ltv0, intRate, marginCallLTV, withdrawalPct, N });
    const arr = sim.netPatrimoniesFinal;
    const sorted = arr.slice().sort((a, b) => a - b);
    const medianNet = sorted[Math.floor(sorted.length / 2)];
    let wins = 0;
    for (let i = 0; i < arr.length; i++) if (arr[i] > pfFinal) wins++;
    const probBeatPF = wins / arr.length;
    // Excess CAGR vs PF (anualizado vía equivalent rate)
    const equivRate = solveEquivRate(V0, W, T, medianNet);
    const excessCAGR = equivRate - pfRateNet;
    // Sharpe del esfuerzo: vol asignada = sigma cartera (porque PF es 0-vol)
    const sharpeEsfuerzo = sigma > 0 ? excessCAGR / sigma : 0;
    curve.push({
      T, pfFinal, medianNet, probBeatPF,
      equivRate, excessCAGR, sharpeEsfuerzo,
      mcProb: sim.mcProb,
    });
  }
  // Horizonte óptimo: máximo Sharpe del esfuerzo
  let bestIdx = 0;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].sharpeEsfuerzo > curve[bestIdx].sharpeEsfuerzo) bestIdx = i;
  }
  return { curve, optimalHorizon: curve[bestIdx] };
}

// ============================================================
// Compute tax cost IF user sold instead of pledging.
// Uses median portfolio growth to estimate gain fraction per year.
// gain_fraction(t) = max(0, 1 - 1/median_multiplier_at_t)
// total_tax = Σ W * gain_fraction(t) * weighted_tax_rate
// ============================================================
function computeSellAlternative({ mu, sigma, T, V0, withdrawalPct, wUSD, wPEN, taxUSDGains, taxPENGains }) {
  const W = V0 * withdrawalPct;
  const totalW = wUSD + wPEN;
  const weightedTax = totalW > 0 ? (wUSD * taxUSDGains + wPEN * taxPENGains) / totalW : 0;
  let totalTax = 0;
  for (let t = 1; t <= T; t++) {
    const medianMult = Math.exp((mu - 0.5 * sigma * sigma) * t);
    const gainFraction = Math.max(0, 1 - 1 / medianMult);
    totalTax += W * gainFraction * weightedTax;
  }
  return { totalTax, weightedTax, totalCashEquiv: W * T };
}

// ============================================================
// Withdrawal sweep: P(margin call) as function of withdrawal % 
// Holds LTV initial, rate, threshold, horizon CONSTANT.
// Returns curve for plotting + crossover points where curve crosses
// specific probability thresholds (5%, 10%, 20%).
// ============================================================
function runWithdrawalSweep({ mu, sigma, T, V0 = 10000, ltv0, intRate, marginCallLTV, N = 1500, nPoints = 35 }) {
  // Pre-generate paths once and reuse for all withdrawal values
  const paths = simulatePaths({ mu, sigma, T, N, V0 });
  const Loan0 = V0 * ltv0;
  const curve = [];
  const maxWPct = 0.10;  // sweep 0% to 10%
  for (let p = 0; p < nPoints; p++) {
    const wPct = (p / (nPoints - 1)) * maxWPct;
    const W = V0 * wPct;
    let mcCount = 0;
    for (let s = 0; s < N; s++) {
      let loan = Loan0;
      for (let t = 1; t <= T; t++) {
        loan = loan * (1 + intRate) + W;
        if (loan / paths[s][t] > marginCallLTV) {
          mcCount++;
          break;
        }
      }
    }
    curve.push({ wPct, wPctDisplay: wPct * 100, mcProb: mcCount / N, mcProbPct: (mcCount / N) * 100 });
  }
  // Find crossover points: where curve first crosses 5%, 10%, 20%
  const findCrossover = (threshold) => {
    for (let i = 1; i < curve.length; i++) {
      if (curve[i - 1].mcProb < threshold && curve[i].mcProb >= threshold) {
        // Linear interpolate
        const x1 = curve[i - 1].wPct, x2 = curve[i].wPct;
        const y1 = curve[i - 1].mcProb, y2 = curve[i].mcProb;
        return x1 + (x2 - x1) * (threshold - y1) / (y2 - y1);
      }
    }
    return null;
  };
  return {
    curve,
    cross5: findCrossover(0.05),
    cross10: findCrossover(0.10),
    cross20: findCrossover(0.20),
  };
}

// ============================================================
// Heat map: P(margin call) over (LTV initial × withdrawal %) grid
// Uses pre-generated paths for speed (same paths re-used per cell)
// ============================================================
function runHeatmap({ mu, sigma, T, V0 = 10000, intRate, marginCallLTV, N = 800 }) {
  const ltvValues = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50];
  const withdrawalValues = [0.000, 0.010, 0.020, 0.030, 0.040, 0.050, 0.060, 0.070, 0.080];
  const paths = simulatePaths({ mu, sigma, T, N, V0 });
  const grid = [];
  for (const ltv0 of ltvValues) {
    const row = [];
    for (const wPct of withdrawalValues) {
      const W = V0 * wPct;
      const Loan0 = V0 * ltv0;
      let mcCount = 0;
      for (let s = 0; s < N; s++) {
        let loan = Loan0;
        for (let t = 1; t <= T; t++) {
          loan = loan * (1 + intRate) + W;
          if (loan / paths[s][t] > marginCallLTV) {
            mcCount++;
            break;
          }
        }
      }
      row.push({ ltv0, wPct, mcProb: mcCount / N });
    }
    grid.push(row);
  }
  return { grid, ltvValues, withdrawalValues };
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
  const agresiva = refine(samples[maxRetIdx], w => portfolioMoments(w, effRet, assets, corr).mu, true);
  // Subsample for chart (3,000 points is plenty)
  const chartSamples = [];
  const stride = Math.max(1, Math.floor(samples.length / 3000));
  for (let i = 0; i < samples.length; i += stride) {
    chartSamples.push({ x: samples[i].sigma, y: samples[i].mu, sh: samples[i].sharpe });
  }
  return { samples: chartSamples, conservadora, neutra, agresiva };
}

// ============================================================
// UI HELPERS
// ============================================================
const fmtPct = (x, digits = 2) => (x * 100).toFixed(digits) + "%";
const fmtUsd = (x) => "$" + Math.round(x).toLocaleString("en-US");
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
download_data.py — descarga la data de yfinance del portafolio completo.

Descarga los 11 tickers reales (10 ETFs/commodities + 2 stocks editables Growth/Value),
calcula sigma, CAGR, beta vs S&P, beta vs EPU, VaR/ES historicos al 95% y 99%, y la
matriz de correlaciones 16x16 (con los 5 cash/sinteticos hardcodeados con sigma=0 y
sus respectivos histRet fijos).

Salidas generadas en el mismo folder:
  - yfinance_results.json       (para cargar en la calculadora web)
  - yfinance_summary.csv        (1 fila por activo, abrir en Excel)
  - yfinance_correlation.csv    (matriz 16x16 con labels)
  - yfinance_prices.csv         (precios diarios crudos)

Uso:
  pip install yfinance pandas numpy
  python download_data.py
"""
import json
import sys
from datetime import datetime, timedelta
import warnings

import numpy as np
import pandas as pd
import yfinance as yf

warnings.filterwarnings('ignore')

# ============================================================
# EDITA AQUI los tickers Value y Growth (como aparecen en Yahoo Finance)
# ============================================================
GROWTH_TICKER = "{GROWTH}"
VALUE_TICKER  = "{VALUE}"
# ============================================================

# Orden CANONICO de los 16 activos (debe coincidir con la calculadora React)
ASSET_KEYS = [
    "cspx", "cndx", "iwda", "msft", "uber", "igln", "vtc", "bil", "ief", "btc",
    "ibsav", "cdusd", "epu", "pensov", "pfpen", "savpen",
]

# Nombres descriptivos para el CSV (mas legibles que los keys)
ASSET_NAMES = {
    "cspx":   "ETF S&P 500",
    "cndx":   "ETF Nasdaq 100",
    "iwda":   "ETF MSCI World",
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

# Tickers reales (con fallback). msft/uber son slots editables.
REAL_TICKERS = [
    ("cspx", "CSPX.L",  "IVV"),
    ("cndx", "CNDX.L",  "QQQ"),
    ("iwda", "IWDA.AS", "URTH"),
    ("msft", GROWTH_TICKER, None),
    ("uber", VALUE_TICKER,  None),
    ("igln", "IGLN.L",  "GLD"),
    ("vtc",  "VTC",     "LQD"),
    ("bil",  "BIL",     None),
    ("ief",  "IEF",     None),
    ("btc",  "BTC-USD", None),
    ("epu",  "EPU",     None),
]
REAL_KEYS = [t[0] for t in REAL_TICKERS]

# histRet hardcoded de los 5 cash/sinteticos (no se descargan, sigma=0)
STATIC_HISTRET = {
    "ibsav":  0.015,
    "cdusd":  0.020,
    "pensov": 0.045,
    "pfpen":  0.045,
    "savpen": 0.035,
}

OUTPUT_JSON         = "yfinance_results.json"
OUTPUT_SUMMARY_CSV  = "yfinance_summary.csv"
OUTPUT_CORR_CSV     = "yfinance_correlation.csv"
OUTPUT_PRICES_CSV   = "yfinance_prices.csv"


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


def _write_summary_csv(out, used, path):
    """Genera CSV con 1 fila por activo: key, name, ticker, sigma, histRet, betas, var, es."""
    rows = []
    for k in ASSET_KEYS:
        rows.append({
            "key":          k,
            "name":         ASSET_NAMES.get(k, k),
            "ticker_used":  used.get(k, "(estatico)"),
            "sigma":        out["sigma"][k],
            "histRet":      out["histRet"][k],
            "beta_sp":      out["beta_sp"][k],
            "beta_epu":     out["beta_epu"][k],
            "var_95":       out["var_95"][k],
            "var_99":       out["var_99"][k],
            "es_95":        out["es_95"][k],
            "es_99":        out["es_99"][k],
        })
    df = pd.DataFrame(rows)
    # Formatear a 6 decimales para que Excel muestre numeros bonitos
    for col in ["sigma", "histRet", "beta_sp", "beta_epu", "var_95", "var_99", "es_95", "es_99"]:
        df[col] = df[col].round(6)
    df.to_csv(path, index=False)


def _write_correlation_csv(corr_matrix, path):
    """Matriz 16x16 con headers fila y columna usando los asset_keys."""
    df = pd.DataFrame(corr_matrix, index=ASSET_KEYS, columns=ASSET_KEYS)
    df = df.round(4)
    df.to_csv(path, index_label="asset")


def _write_prices_csv(prices_df, path):
    """Precios diarios crudos: 1 columna por activo descargado, indice = fecha."""
    out = prices_df.copy()
    out.index.name = "date"
    out = out.round(4)
    out.to_csv(path)


def main():
    print("=" * 62)
    print(f"Descargando {len(REAL_TICKERS)} tickers reales desde yfinance")
    print(f"  Growth (msft slot) = {GROWTH_TICKER}")
    print(f"  Value  (uber slot) = {VALUE_TICKER}")
    print("=" * 62)

    data, used = {}, {}
    for key, primary, fallback in REAL_TICKERS:
        ser, tk = _download_one(key, primary, fallback)
        if ser is not None:
            data[key] = ser
            used[key] = tk

    df = pd.DataFrame(data).dropna()
    if df.empty:
        print("ERROR: no se pudo alinear ningun ticker.")
        sys.exit(1)
    print(f"\\nAlineados: {len(df)} dias, {df.index.min().date()} -> {df.index.max().date()}")

    log_rets = np.log(df / df.shift(1)).dropna()
    sp_r = log_rets["cspx"]
    ep_r = log_rets["epu"]

    stats = {k: _compute_stats(log_rets, k, sp_r, ep_r) for k in df.columns}

    def metric(name):
        out = {k: stats[k][name] for k in df.columns}
        for k in STATIC_HISTRET:
            out[k] = 0.0
        return {k: float(out.get(k, 0.0)) for k in ASSET_KEYS}

    sigma_all   = metric("sigma")
    histRet_all = metric("histRet")
    for k, v in STATIC_HISTRET.items():
        histRet_all[k] = v

    present = [k for k in REAL_KEYS if k in df.columns]
    corr_full = _build_full_correlation(log_rets[present].corr(), present)

    years = (df.index.max() - df.index.min()).days / 365.25
    out = {
        "meta": {
            "years": round(years, 2),
            "days": int(len(log_rets)),
            "date_from": str(df.index.min().date()),
            "date_to": str(df.index.max().date()),
            "tickers_used": used,
        },
        "sigma":    sigma_all,
        "histRet":  histRet_all,
        "beta_sp":  metric("beta_sp"),
        "beta_epu": metric("beta_epu"),
        "var_95":   metric("var_95"),
        "var_99":   metric("var_99"),
        "es_95":    metric("es_95"),
        "es_99":    metric("es_99"),
        "correlation": corr_full,
        "asset_keys": ASSET_KEYS,
    }

    # === Escribir los 4 archivos ===
    with open(OUTPUT_JSON, "w") as f:
        json.dump(out, f, indent=2)
    _write_summary_csv(out, used, OUTPUT_SUMMARY_CSV)
    _write_correlation_csv(corr_full, OUTPUT_CORR_CSV)
    _write_prices_csv(df, OUTPUT_PRICES_CSV)

    # === Resumen en consola ===
    print(f"\\n{'KEY':<8}{'TICKER':<12}{'CAGR':>9}{'SIGMA':>9}{'BETA_SP':>10}")
    for k in present:
        print(f"{k:<8}{used.get(k,'-'):<12}{histRet_all[k]*100:>8.2f}%{sigma_all[k]*100:>8.2f}%{stats[k]['beta_sp']:>9.3f}")

    print(f"\\n{'='*62}")
    print("ARCHIVOS GENERADOS:")
    print(f"  {OUTPUT_JSON:35s}  <- carga este en la calculadora web")
    print(f"  {OUTPUT_SUMMARY_CSV:35s}  <- abre en Excel: metricas por activo")
    print(f"  {OUTPUT_CORR_CSV:35s}  <- abre en Excel: matriz 16x16")
    print(f"  {OUTPUT_PRICES_CSV:35s}  <- abre en Excel: precios diarios crudos")
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
  const [taxUSD, setTaxUSD] = useState(0.25);
  const [taxPEN, setTaxPEN] = useState(0.05);

  // Editable Value & Growth tickers — user provides ticker and Damodaran range
  // σ, correlations, and histRet come from the data download (yfinance).
  // Index 3 = Growth (MSFT default), Index 4 = Value (UBER default)
  const [growthAsset, setGrowthAsset] = useState({ ticker: "MSFT", retLow: 0.11, retHigh: 0.14 });
  const [valueAsset, setValueAsset] = useState({ ticker: "UBER", retLow: 0.09, retHigh: 0.12 });

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
  // and applies vol/histRet from marketData (if loaded) to ALL assets.
  // Key insight: the asset id (cspx, cndx, ...) is used to look up values in marketData.
  const effectiveAssets = useMemo(() => {
    return ASSETS.map((a, i) => {
      const baseKey = a.id; // 'cspx', 'cndx', 'msft', etc. — keys originales canonicos
      let asset = { ...a };
      // Apply marketData (real yfinance values) to vol and histRet
      if (marketData) {
        if (typeof marketData.sigma?.[baseKey] === "number") asset.vol = marketData.sigma[baseKey];
        if (typeof marketData.histRet?.[baseKey] === "number") asset.histRet = marketData.histRet[baseKey];
      }
      // Override growth/value editable slots
      if (i === 3) return {
        ...asset,
        id: growthAsset.ticker.toLowerCase(),
        name: `Acción Growth: ${growthAsset.ticker || "—"}`,
        retLow: growthAsset.retLow,
        retHigh: growthAsset.retHigh,
        editable: true,
        kind: "growth",
      };
      if (i === 4) return {
        ...asset,
        id: valueAsset.ticker.toLowerCase(),
        name: `Acción Value: ${valueAsset.ticker || "—"}`,
        retLow: valueAsset.retLow,
        retHigh: valueAsset.retHigh,
        editable: true,
        kind: "value",
      };
      return asset;
    });
  }, [growthAsset, valueAsset, marketData]);

  // Effective correlation matrix: from marketData if loaded, else from the hardcoded C.
  const effectiveC = useMemo(() => marketData?.correlation || C, [marketData]);

  // Data fetch state — symbolic for now, real fetch happens via the chat workflow
  const [dataPanelOpen, setDataPanelOpen] = useState(false);

  // Pignoración state
  const [ltv0, setLtv0] = useState(0.30);
  const [intRate, setIntRate] = useState(0.045);
  const [marginCallLTV, setMarginCallLTV] = useState(0.65);
  const [pledgeHorizon, setPledgeHorizon] = useState(20);
  const [withdrawalPct, setWithdrawalPct] = useState(0.04); // 4% (regla del 4%)
  const [compareVsSell, setCompareVsSell] = useState(true);
  const [taxUSDGains, setTaxUSDGains] = useState(0.30);  // 30% withholding ETFs USA
  const [taxPENGains, setTaxPENGains] = useState(0.05);  // 5% PEN gains
  const [mcTolerance, setMcTolerance] = useState(0.05);  // tolerancia P(margin call) para retiro maximo sostenible
  const [heatmapResult, setHeatmapResult] = useState(null);
  const [heatmapRunning, setHeatmapRunning] = useState(false);
  const [heatmapOpen, setHeatmapOpen] = useState(false);

  // Markowitz state — drives the weights
  const [markowitz, setMarkowitz] = useState(null);
  const [markowitzRunning, setMarkowitzRunning] = useState(false);
  const [activePortfolio, setActivePortfolio] = useState("neutra");  // 'conservadora' | 'neutra' | 'agresiva'
  const [returnsAtLastOpt, setReturnsAtLastOpt] = useState(null);    // for stale detection

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

  // WEIGHTS are derived from the selected Markowitz portfolio
  // Fallback to balanced defaults before first optimization
  const weights = useMemo(() => {
    if (markowitz && markowitz[activePortfolio]) {
      return markowitz[activePortfolio].w;
    }
    const defaults = ASSETS.map(a => a.defW);
    const sum = defaults.reduce((a, b) => a + b, 0);
    return defaults.map(w => w / sum);
  }, [markowitz, activePortfolio]);

  // Stale flag: returns changed since last optimization run
  const optStale = useMemo(() => {
    if (!markowitz || !returnsAtLastOpt) return false;
    return customReturns.some((r, i) => Math.abs(r - returnsAtLastOpt[i]) > 1e-6);
  }, [customReturns, returnsAtLastOpt, markowitz]);

  const runOptimizer = useCallback(() => {
    setMarkowitzRunning(true);
    const snapshot = customReturns.slice();
    setTimeout(() => {
      const result = runMarkowitz(effectiveReturns, 30000, effectiveAssets, effectiveC);
      setMarkowitz(result);
      setReturnsAtLastOpt(snapshot);
      setMarkowitzRunning(false);
    }, 50);
  }, [effectiveReturns, customReturns, effectiveAssets, effectiveC]);

  // Auto-run optimizer on first mount so the user has weights immediately
  useEffect(() => {
    if (!markowitz && !markowitzRunning) {
      runOptimizer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runBacktestSim = useCallback(() => {
    setBacktestRunning(true);
    setTimeout(() => {
      const months = backtestYears * 12;
      const series = generateMonthlyHistory(effectiveReturns, months, effectiveAssets, effectiveC);
      const portfolio = runBacktest({ weights, monthlyReturns: series, rebalanceFreqMonths: rebalanceFreq });
      // Compute USD/PEN split for the benchmark
      let usdW = 0, penW = 0;
      for (let i = 0; i < N; i++) {
        if (ASSETS[i].cur === "USD") usdW += weights[i]; else penW += weights[i];
      }
      const benchmark = runBenchmark({ usdWeight: usdW, penWeight: penW, monthlyReturns: series });
      const compare = compareToBenchmark(portfolio.monthlyReturns, benchmark.monthlyReturns);
      setBacktestResult({ portfolio, benchmark, compare, years: backtestYears, rebFreq: rebalanceFreq });
      setBacktestRunning(false);
    }, 50);
  }, [effectiveReturns, weights, rebalanceFreq, backtestYears, effectiveAssets, effectiveC]);

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
  const horizonScenarios = useMemo(() => {
    const V0 = 10000;
    const percentiles = { muyPesimista: 0.01, pesimista: 0.10, neutro: 0.50, optimista: 0.90, muyOptimista: 0.99 };
    const out = {};
    for (const [k, p] of Object.entries(percentiles)) {
      const mult = lognormalPercentile(mu, sigma, horizon, p);
      const value = V0 * mult;
      const cagr = cagrFromMultiple(mult, horizon);
      out[k] = { mult, value, cagr };
    }
    // Confidence floors (lower-tail)
    const floors = {};
    for (const c of [0.90, 0.95, 0.99]) {
      const p = 1 - c;
      const mult = lognormalPercentile(mu, sigma, horizon, p);
      floors[c] = { mult, value: V0 * mult, cagr: cagrFromMultiple(mult, horizon) };
    }
    return { scenarios: out, floors };
  }, [mu, sigma, horizon]);

  // ----- CAGR probability density distribution (log-normal) -----
  // X = log(1+CAGR) is normal with mean (μ - σ²/2) and std σ/√T
  // Density of CAGR uses Jacobian: f_CAGR(c) = f_X(log(1+c)) / (1+c)
  const distributionData = useMemo(() => {
    const T = horizon;
    const V0 = 10000;
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
      // Full simulation with per-year percentiles
      const sim = runFullPledgeSim({
        mu, sigma, T: pledgeHorizon, V0: 10000,
        ltv0, intRate, marginCallLTV, withdrawalPct, N: 3000,
      });
      // Sell alternative (tax cost if selling instead of pledging)
      const sellAlt = computeSellAlternative({
        mu, sigma, T: pledgeHorizon, V0: 10000,
        withdrawalPct, wUSD: usdW, wPEN: penW,
        taxUSDGains, taxPENGains,
      });
      // Withdrawal sweep: P(MC) vs withdrawal % keeping LTV constant
      const sweep = runWithdrawalSweep({
        mu, sigma, T: pledgeHorizon, V0: 10000,
        ltv0, intRate, marginCallLTV, N: 1500,
      });
      // Horizon sweep: Sharpe del esfuerzo vs T (busca el horizonte optimo)
      const pfPreTax = customReturns[PFPEN_IDX] || 0.045;
      const pfNet = pfPreTax * (1 - taxPEN);
      const horizonSweep = runHorizonSweep({
        mu, sigma, ltv0, intRate, marginCallLTV, withdrawalPct,
        pfRateNet: pfNet, V0: 10000, N: 1500,
      });
      setPledgeResult({ ...sim, sellAlt, sweep, horizonSweep });
      setPledgeRunning(false);
    }, 50);
  }, [mu, sigma, pledgeHorizon, ltv0, intRate, marginCallLTV, withdrawalPct, taxUSDGains, taxPENGains, usdW, penW, customReturns, taxPEN, PFPEN_IDX]);

  // ===========================================================
  // Benchmark: PF PEN (Plazo Fijo Peruano sin riesgo) como
  // umbral de comparacion. Usa la rentabilidad que el usuario
  // asigno en pestana 1 (customReturns[14] = pfpen) netada de
  // impuestos PEN, simula la misma anualidad y compara contra
  // los 3000 paths del netPatrimony de la pignoracion.
  //
  // Calcula tambien las metricas del "esfuerzo":
  //   - excessCAGR: rentabilidad anual extra vs PF (via equiv rate)
  //   - volEsfuerzo: sigma cartera (toda la vol va al exceso)
  //   - sharpeEsfuerzo: excessCAGR / sigma (el indicador de oro)
  // ===========================================================
  const PFPEN_IDX = ASSETS.findIndex(a => a.id === "pfpen");
  const pfBenchmark = useMemo(() => {
    if (!pledgeResult || !pledgeResult.netPatrimoniesFinal) return null;
    const pfRatePreTax = customReturns[PFPEN_IDX] || 0;
    const pfRateNet    = pfRatePreTax * (1 - taxPEN);
    const T = pledgeHorizon;
    const V0 = 10000;
    const W = V0 * withdrawalPct;
    const growth = Math.pow(1 + pfRateNet, T);
    const annuityFactor = Math.abs(pfRateNet) > 1e-9 ? (growth - 1) / pfRateNet : T;
    const pfFinal = V0 * growth - W * annuityFactor;

    const arr = pledgeResult.netPatrimoniesFinal;
    let wins = 0;
    for (let i = 0; i < arr.length; i++) if (arr[i] > pfFinal) wins++;
    const probBeatPF = wins / arr.length;
    const sorted = arr.slice().sort((a, b) => a - b);
    const medianNet = sorted[Math.floor(sorted.length / 2)];
    const medianSpread = medianNet - pfFinal;

    // Anualizar el resultado de la pignoracion via tasa equivalente
    const equivRate = solveEquivRate(V0, W, T, medianNet);
    const excessCAGR = equivRate - pfRateNet;
    const volEsfuerzo = sigma;
    const sharpeEsfuerzo = sigma > 0 ? excessCAGR / sigma : 0;

    return {
      pfRatePreTax, pfRateNet, pfFinal,
      probBeatPF, medianSpread, medianNet,
      equivRate, excessCAGR, volEsfuerzo, sharpeEsfuerzo,
    };
  }, [pledgeResult, customReturns, taxPEN, pledgeHorizon, withdrawalPct, PFPEN_IDX, sigma]);

  // ===========================================================
  // Escenario "Retiro maximo sostenible": dado un threshold de
  // tolerancia P(margin call), encuentra el W maximo del sweep
  // que cumple, y re-simula la pignoracion con ese retiro para
  // generar curvas de evolucion (net patrimony, LTV) + metricas
  // de CAGR comparativas y de salud del apalancamiento.
  // ===========================================================
  const sustainableScenario = useMemo(() => {
    if (!pledgeResult?.sweep?.curve) return null;
    // Encontrar el W maximo donde mcProbPct <= mcTolerance%
    const targetPct = mcTolerance * 100;
    const curve = pledgeResult.sweep.curve;
    let wMaxPct = 0;
    for (const pt of curve) {
      if (pt.mcProbPct <= targetPct) wMaxPct = pt.wPctDisplay;
      else break;  // curva monotonicamente creciente
    }
    // Si curva nunca cruza, todo el rango es sostenible — usar el maximo del sweep
    if (wMaxPct === 0 && curve[0].mcProbPct <= targetPct) {
      wMaxPct = curve[curve.length - 1].wPctDisplay;
    }
    // Si curva ya empieza por encima del threshold incluso a 0%, no hay W sostenible
    if (wMaxPct === 0) {
      return { wMaxPct: 0, infeasible: true };
    }
    const wMax = wMaxPct / 100;
    const T = pledgeHorizon;
    const V0 = 10000;
    const W_year = V0 * wMax;
    // Re-simular con wMax
    const sim = runFullPledgeSim({
      mu, sigma, T, V0, ltv0, intRate, marginCallLTV,
      withdrawalPct: wMax, N: 1500,
    });
    // Metricas de CAGR
    const finalNet = sim.netPatrimony_p50;
    const cagrNet = finalNet > 0 ? Math.pow(finalNet / V0, 1 / T) - 1 : -1;
    const totalWealth = finalNet + W_year * T;
    const cagrTotalWealth = totalWealth > 0 ? Math.pow(totalWealth / V0, 1 / T) - 1 : -1;
    // PF PEN y Gross portfolio CAGRs ya disponibles en pfBenchmark / mu
    const pfRateNet = pfBenchmark ? pfBenchmark.pfRateNet : 0;
    // Apalancamiento final = finalLoan / V_final_p50 (LTV mediano final)
    const vFinalP50 = sim.yearStats[T].v_p50;
    const leverageFinal = vFinalP50 > 0 ? sim.finalLoan / vFinalP50 : 0;
    // Recovery margin: promedio de (marginCallLTV - ltv_p50/100) en cada año
    let recoverySum = 0;
    for (let t = 1; t <= T; t++) {
      recoverySum += marginCallLTV - sim.yearStats[t].ltv_p50 / 100;
    }
    const recoveryMargin = recoverySum / T;
    // Cash flow yield = W/V0 (es lo mismo que wMax, pero util en cards)
    const cashFlowYield = wMax;
    // Datos para el grafico: net patrimony y LTV por año
    const chartData = sim.yearStats.map(s => ({
      year: s.year,
      net_p10: s.v_p10 - s.loan,
      net_p50: s.v_p50 - s.loan,
      net_p90: s.v_p90 - s.loan,
      net_band_base: s.v_p10 - s.loan,
      net_band_width: (s.v_p90 - s.loan) - (s.v_p10 - s.loan),
      ltv_p10: s.ltv_p10,
      ltv_p50: s.ltv_p50,
      ltv_p90: s.ltv_p90,
      ltv_band_base: s.ltv_p10,
      ltv_band_width: s.ltv_p90 - s.ltv_p10,
      mcLine: marginCallLTV * 100,
    }));
    return {
      wMaxPct, wMax, W_year, T,
      finalNet, totalWealth,
      cagrNet, cagrTotalWealth, cagrPF: pfRateNet, cagrGross: mu,
      leverageFinal, recoveryMargin, cashFlowYield,
      mcProbActual: sim.mcProb,
      chartData,
      infeasible: false,
    };
  }, [pledgeResult, mcTolerance, pledgeHorizon, mu, sigma, ltv0, intRate, marginCallLTV, pfBenchmark]);


  const runHeatmapSim = useCallback(() => {
    setHeatmapRunning(true);
    setTimeout(() => {
      const result = runHeatmap({
        mu, sigma, T: pledgeHorizon, V0: 10000,
        intRate, marginCallLTV, N: 800,
      });
      setHeatmapResult(result);
      setHeatmapRunning(false);
    }, 50);
  }, [mu, sigma, pledgeHorizon, intRate, marginCallLTV]);

  // Update one weight, optionally rebalancing
  // (Removed: weights are now derived from Markowitz, not user-edited)

  // Group assets by category
  const grouped = effectiveAssets.reduce((acc, a, i) => {
    if (!acc[a.cat]) acc[a.cat] = [];
    acc[a.cat].push({ ...a, idx: i });
    return acc;
  }, {});

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.root}>
      <style>{globalCSS}</style>

      {/* ============== HEADER ============== */}
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Calculadora de Cartera · v0.1 (datos dummy)</div>
          <h1 style={styles.title}>Frontera Eficiente <span style={styles.titleAmp}>&</span> Pignoración</h1>
          <div style={styles.subtitle}>
            Inversión base $10,000 · Markowitz + Monte Carlo · 16 activos USD/PEN
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
                  </>
                )}
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
          <div style={styles.taxPanel}>
            <div style={styles.taxPanelLabel}>
              <span style={styles.taxPanelIcon}>⚙</span>
              Impuestos sobre rendimientos realizados <span style={styles.taxPanelHint}>(solo cash & equivalentes, plazos fijos)</span>
            </div>
            <div style={styles.taxInputs}>
              <div style={styles.taxInputGroup}>
                <span style={styles.taxInputLabel}>USD</span>
                <input
                  type="number" step="1" min="0" max="50"
                  value={(taxUSD * 100).toFixed(0)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) / 100;
                    if (!isNaN(v) && v >= 0 && v <= 0.5) setTaxUSD(v);
                  }}
                  style={styles.taxInput}
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
                  style={styles.taxInput}
                />
                <span style={styles.taxInputPct}>%</span>
              </div>
              <button
                onClick={() => setCustomReturns(ASSETS.map(a => a.ret))}
                style={styles.resetRetBtn}
                title="Restaurar rentabilidades a los puntos medios de tu tabla"
              >
                ↻ Reset rentabilidades
              </button>
            </div>
          </div>
          <div style={styles.twoCol}>
            <div>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={{ ...styles.h2, marginBottom: 4 }}>Sensibilizar Rentabilidades Esperadas</h2>
                  <div style={styles.compositionHint}>
                    Los <strong>pesos</strong> vienen del optimizador Markowitz (no editables aquí).
                    Edita las rentabilidades esperadas (slider en cada activo) y re-corre la optimización para ver los nuevos pesos.
                  </div>
                </div>
                <div style={styles.portfolioSwitcher}>
                  <div style={styles.portfolioSwitcherLabel}>Cartera Markowitz activa</div>
                  <div style={styles.portfolioSwitcherButtons}>
                    {[
                      ["conservadora", "Conservadora", "var(--positive)"],
                      ["neutra", "Neutra", "var(--gold)"],
                      ["agresiva", "Agresiva", "var(--accent)"],
                    ].map(([k, label, color]) => (
                      <button
                        key={k}
                        onClick={() => setActivePortfolio(k)}
                        disabled={!markowitz}
                        style={{
                          ...styles.portfolioBtn,
                          ...(activePortfolio === k ? { ...styles.portfolioBtnActive, background: color, borderColor: color } : {}),
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
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
                      }}
                      taxRate={it.cur === "USD" ? taxUSD : taxPEN}
                      onTickerChange={it.kind === "growth" ? (t) => setGrowthAsset({ ...growthAsset, ticker: t }) :
                                      it.kind === "value"  ? (t) => setValueAsset({ ...valueAsset, ticker: t }) : undefined}
                      onRangeChange={it.kind === "growth" ? (r) => setGrowthAsset({ ...growthAsset, ...r }) :
                                     it.kind === "value"  ? (r) => setValueAsset({ ...valueAsset, ...r }) : undefined}
                      hasMarketData={!!marketData}
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
            </div>

            <div>
              <h2 style={styles.h2}>Métricas de Riesgo</h2>
              <div style={styles.metricsGrid}>
                <MetricCard label="Retorno Esperado" value={fmtPct(mu)} sub="ponderado por tabla" />
                <MetricCard label="Volatilidad Anual" value={fmtPct(sigma)} sub="σ de la cartera" />
                <MetricCard label="Sharpe Ratio" value={sharpe.toFixed(2)} sub={`Rf = ${fmtPct(RISK_FREE, 1)}`} />
                <MetricCard label="Beta Efectivo" value={beta.toFixed(2)} sub="vs benchmark mixto" />
                <MetricCard label="VaR 95% (1 año)" value={fmtPct(var95.VaR)} sub="pérdida paramétrica" accent="negative" />
                <MetricCard label="VaR 99% (1 año)" value={fmtPct(var99.VaR)} sub="pérdida paramétrica" accent="negative" />
                <MetricCard label="Expected Shortfall 95%" value={fmtPct(var95.ES)} sub="pérdida promedio en cola" accent="negative" />
                <MetricCard label="Expected Shortfall 99%" value={fmtPct(var99.ES)} sub="pérdida promedio en cola" accent="negative" />
              </div>

              <h3 style={styles.h3}>Composición por categoría</h3>
              <CategoryBars weights={weights} />

              <h3 style={styles.h3}>Notas y supuestos</h3>
              <ul style={styles.notes}>
                <li><strong>Cash y plazos fijos tratados como activos sin riesgo (σ = 0):</strong> BIL, IB Savings USD, CD USD, Plazo Fijo PEN y Cuenta Ahorros PEN. No contribuyen a la varianza del portafolio. Implica que la Conservadora va a concentrar en ellos hasta sus topes (≈40% del capital).</li>
                <li><strong>Activos PEN sin riesgo cambiario:</strong> se asume cobertura USD/PEN activa por parte del inversor. Los retornos PEN se computan en términos locales sin overlay de FX.</li>
                <li><strong>Volatilidades de activos riesgosos son dummies realistas</strong>, se reemplazarán por σ histórica diaria (10 años) en la fase de descarga con yfinance.</li>
                <li><strong>VaR / ES paramétricos asumen normalidad</strong> — sub-estiman cola izquierda en activos con fat tails (BTC, UBER, EPU). Monte Carlo con t-Student lo corregirá en fase 3.</li>
                <li><strong>Beta "efectivo"</strong> = promedio ponderado de β vs S&P (parte USD) y β vs EPU/BVL (parte PEN). Métrica de lectura, no CAPM puro.</li>
                <li><strong>Riesgos NO modelados</strong>: crédito de cajas/bancos en Perú, default corporativo (VTC en estrés sistémico), inflación real vs nominal, riesgo país en bonos soberanos PEN.</li>
              </ul>
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
                Genero <strong>15,000 carteras aleatorias</strong> respetando tus límites min/max por activo,
                las posiciono en el plano (σ, μ), y refino localmente los tres puntos clave:
                <strong> Mínima Varianza</strong>, <strong>Max Sharpe</strong> (la tangencial) y <strong>Máxima Rentabilidad</strong>.
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
                  desc="Máxima Rentabilidad"
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
                      name="Agresiva (Max Ret)"
                      data={[{ x: markowitz.agresiva.sigma, y: markowitz.agresiva.mu }]}
                      fill="var(--accent)"
                      shape={(props) => <OptimumMarker {...props} color="var(--accent)" label="AGRESIVA" />}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={styles.legend}>
                  <span><span style={{...styles.dot, background: "var(--accent)", opacity: 0.3}}/> Nube de portafolios factibles</span>
                  <span><span style={{...styles.dot, background: "var(--positive)"}}/> Mínima Varianza</span>
                  <span><span style={{...styles.dot, background: "var(--gold)"}}/> Max Sharpe</span>
                  <span><span style={{...styles.dot, background: "var(--accent)"}}/> Máxima Rentabilidad</span>
                </div>
              </div>

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
          <CorrelationMatrix />
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
              tu inversión de <strong>$10,000</strong> valdrá al menos
              <span style={styles.headlineNumber}> {fmtUsd(horizonScenarios.floors[confidence].value)}</span>
            </div>
            <div style={styles.headlineSub}>
              equivalente a un CAGR mínimo de <strong>{fmtPct(horizonScenarios.floors[confidence].cagr, 2)}</strong>
              {" · "}escenario neutro (mediana): <strong>{fmtUsd(horizonScenarios.scenarios.neutro.value)}</strong> ({fmtPct(horizonScenarios.scenarios.neutro.cagr, 2)} CAGR)
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

          <h3 style={styles.h3}>Trayectorias probables · bandas de percentiles</h3>
          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={fanData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="year" stroke="var(--ink-muted)" tick={{ fontSize: 11 }}>
                  <text>Años</text>
                </XAxis>
                <YAxis tickFormatter={(v) => fmtUsdK(v)} stroke="var(--ink-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => fmtUsd(v)}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                />
                {/* Stacked bands using Area with stackId, base = p01 floor */}
                <Area type="monotone" dataKey="floor" stackId="1" stroke="none" fill="transparent" />
                <Area type="monotone" dataKey="band_low_to_p10" stackId="1" stroke="none" fill="var(--band-outer)" name="P1-P10" />
                <Area type="monotone" dataKey="band_p10_to_p50" stackId="1" stroke="none" fill="var(--band-mid)" name="P10-P50" />
                <Area type="monotone" dataKey="band_p50_to_p90" stackId="1" stroke="none" fill="var(--band-mid)" name="P50-P90" />
                <Area type="monotone" dataKey="band_p90_to_p99" stackId="1" stroke="none" fill="var(--band-outer)" name="P90-P99" />
                <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={2.2} dot={false} name="Mediana" />
                <ReferenceLine x={horizon} stroke="var(--ink)" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={styles.legend}>
              <span><span style={{...styles.dot, background: "var(--accent)"}}/> Mediana (P50)</span>
              <span><span style={{...styles.dot, background: "var(--band-mid)"}}/> P10 – P90 (80% probable)</span>
              <span><span style={{...styles.dot, background: "var(--band-outer)"}}/> P1 – P99 (98% probable)</span>
            </div>
          </div>
        </section>
      )}

      {/* ============== TAB: PIGNORACIÓN ============== */}
      {tab === "pignoracion" && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Pignoración · Renta Vitalicia Tax-Free</h2>
          <p style={styles.intro}>
            Pones tu cartera como colateral, tomas un préstamo a tasa fija, y vives del crédito.
            Como no vendes acciones, no realizas ganancias y por tanto <strong>no pagas impuestos sobre ellas</strong>.
            El préstamo crece con interés + retiros nuevos. Si LTV (Préstamo / Valor cartera) cruza el umbral del banco → <em>margin call</em> y se liquida.
          </p>

          {/* Controles compactos */}
          <div style={styles.pignControlsGrid}>
            <SliderControl label="LTV inicial" value={ltv0}
              min={0.05} max={0.50} step={0.01} onChange={setLtv0}
              fmt={v => fmtPct(v, 0)} hint="% prestado al inicio" />
            <SliderControl label="Tasa préstamo" value={intRate}
              min={0.03} max={0.06} step={0.0025} onChange={setIntRate}
              fmt={v => fmtPct(v, 2)} hint="anual fija" />
            <SliderControl label="Umbral margin call" value={marginCallLTV}
              min={0.50} max={0.80} step={0.05} onChange={setMarginCallLTV}
              fmt={v => fmtPct(v, 0)} hint="LTV máximo del banco" />
            <SliderControl label="Horizonte" value={pledgeHorizon}
              min={5} max={30} step={1} onChange={setPledgeHorizon}
              fmt={v => `${v} años`} hint="duración estrategia" />
            <SliderControl label="Retiro anual (% capital)" value={withdrawalPct}
              min={0} max={0.08} step={0.0025} onChange={setWithdrawalPct}
              fmt={v => fmtPct(v, 2)} hint={`${fmtUsd(10000 * withdrawalPct)} sobre $10k · regla del 4%`} />
          </div>

          <div style={styles.pignTaxRow}>
            <label style={styles.toggleLabel}>
              <input type="checkbox" checked={compareVsSell}
                     onChange={e => setCompareVsSell(e.target.checked)} />
              <span>Comparar vs vender acciones (mostrar ahorro fiscal)</span>
            </label>
            {compareVsSell && (
              <div style={styles.pignTaxInputs}>
                <SliderControl label="Tax ganancias USD" value={taxUSDGains}
                  min={0} max={0.45} step={0.01} onChange={setTaxUSDGains}
                  fmt={v => fmtPct(v, 0)} hint="withholding ETFs USA" />
                <SliderControl label="Tax ganancias PEN" value={taxPENGains}
                  min={0} max={0.30} step={0.01} onChange={setTaxPENGains}
                  fmt={v => fmtPct(v, 0)} hint="rentas de capital Perú" />
              </div>
            )}
            <button onClick={runPledge} style={styles.runBtn} disabled={pledgeRunning}>
              {pledgeRunning ? "Simulando..." : pledgeResult ? "Recalcular" : "Correr Monte Carlo"}
            </button>
          </div>

          {!pledgeResult && !pledgeRunning && (
            <div style={styles.placeholder}>
              Ajusta los parámetros y corre la simulación.
            </div>
          )}

          {pledgeResult && (
            <>
              {/* Headline cards */}
              <div style={{
                ...styles.btMetricsGrid,
                gridTemplateColumns: compareVsSell ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
                marginTop: 22,
              }}>
                <PignCard
                  title="Probabilidad margin call"
                  value={fmtPct(pledgeResult.mcProb, 1)}
                  color={pledgeResult.mcProb < 0.05 ? "var(--positive)" : pledgeResult.mcProb < 0.15 ? "var(--gold)" : "var(--negative)"}
                  caption={
                    pledgeResult.mcProb < 0.02 ? "Estrategia sostenible · dormís tranquilo" :
                    pledgeResult.mcProb < 0.05 ? "Riesgo bajo · aceptable" :
                    pledgeResult.mcProb < 0.15 ? "Riesgo moderado · revisar" :
                    pledgeResult.mcProb < 0.30 ? "Riesgo alto · ajustar" :
                    "No es viable"
                  }
                  sub={pledgeResult.avgMCTime !== null ? `Si ocurre, en promedio año ${pledgeResult.avgMCTime.toFixed(1)}` : ""}
                />
                <PignCard
                  title={`Total retirado en ${pledgeHorizon} años`}
                  value={fmtUsd(pledgeResult.totalCashWithdrawn)}
                  subValue={`+ ${fmtUsd(pledgeResult.totalInterest)} intereses`}
                  caption={`Retiraste ${fmtUsd(pledgeResult.W)}/año · el préstamo acumuló ${fmtUsd(pledgeResult.totalInterest)} en intereses`}
                  sub={`Costo financiero: ${fmtPct(pledgeResult.totalInterest / pledgeResult.totalCashWithdrawn, 1)} sobre cada dólar retirado`}
                />
                <PignCard
                  title="Patrimonio neto final (mediana)"
                  value={fmtUsd(pledgeResult.netPatrimony_p50)}
                  color={pledgeResult.netPatrimony_p50 > 10000 ? "var(--positive)" : "var(--negative)"}
                  caption={`Rango 80%: ${fmtUsd(pledgeResult.netPatrimony_p10)} — ${fmtUsd(pledgeResult.netPatrimony_p90)}`}
                  sub={`Capital cartera − préstamo pendiente`}
                />
                {compareVsSell && (
                  <PignCard
                    title="Ahorro fiscal vs vender"
                    value={fmtUsd(pledgeResult.sellAlt.totalTax - pledgeResult.totalInterest)}
                    color={pledgeResult.sellAlt.totalTax - pledgeResult.totalInterest > 0 ? "var(--gold)" : "var(--negative)"}
                    caption={`tax si vendieras: ${fmtUsd(pledgeResult.sellAlt.totalTax)} vs intereses: ${fmtUsd(pledgeResult.totalInterest)}`}
                    sub={`tax efectivo ponderado: ${fmtPct(pledgeResult.sellAlt.weightedTax, 0)} (${fmtPct(usdW, 0)} USD / ${fmtPct(penW, 0)} PEN)`}
                  />
                )}
              </div>

              {/* ============ Benchmark: Plazo Fijo PEN sin riesgo ============ */}
              {pfBenchmark && (
                <>
                  <h3 style={styles.h3}>Umbral: ¿vale la pena el riesgo vs Plazo Fijo PEN?</h3>
                  <p style={styles.distribIntro}>
                    Si en lugar de pignorar dejaras los <strong>{fmtUsd(10000)}</strong> en Plazo Fijo PEN
                    al <strong>{fmtPct(pfBenchmark.pfRatePreTax, 2)}</strong> bruto
                    ({fmtPct(pfBenchmark.pfRateNet, 2)} neto post-tax {fmtPct(taxPEN, 0)})
                    y retiraras los mismos <strong>{fmtUsd(pledgeResult.W)}/año</strong> durante {pledgeHorizon} años,
                    el resultado sería determinístico (sin riesgo de margin call ni de mercado). Este es tu <strong>piso de cero riesgo</strong>.
                  </p>
                  <div style={{
                    ...styles.btMetricsGrid,
                    gridTemplateColumns: "repeat(3, 1fr)",
                    marginTop: 14,
                  }}>
                    <PignCard
                      title="Patrimonio PF PEN final"
                      value={fmtUsd(pfBenchmark.pfFinal)}
                      caption={`Determinístico: $10k crece al ${fmtPct(pfBenchmark.pfRateNet, 2)}, menos $${pledgeResult.W.toFixed(0)}/año de retiros`}
                      sub={`Este es el umbral a superar`}
                    />
                    <PignCard
                      title="P(pignoración > PF PEN)"
                      value={fmtPct(pfBenchmark.probBeatPF, 1)}
                      color={
                        pfBenchmark.probBeatPF > 0.75 ? "var(--positive)" :
                        pfBenchmark.probBeatPF > 0.55 ? "var(--gold)" :
                        "var(--negative)"
                      }
                      caption={
                        pfBenchmark.probBeatPF > 0.85 ? "Pignoración gana en >85% de escenarios" :
                        pfBenchmark.probBeatPF > 0.65 ? "Pignoración gana en la mayoría" :
                        pfBenchmark.probBeatPF > 0.45 ? "Mixto · no compensa claramente" :
                        "El PF PEN supera a la pignoración"
                      }
                      sub={`${Math.round(pfBenchmark.probBeatPF * 3000)}/3000 paths superan el umbral`}
                    />
                    <PignCard
                      title="Exceso mediano (USD)"
                      value={(pfBenchmark.medianSpread >= 0 ? "+" : "") + fmtUsd(pfBenchmark.medianSpread)}
                      color={pfBenchmark.medianSpread > 0 ? "var(--positive)" : "var(--negative)"}
                      caption={
                        pfBenchmark.medianSpread > 0
                          ? `Pignoración termina ${fmtUsd(pfBenchmark.medianSpread)} arriba del PF en el escenario mediano`
                          : `Pignoración termina ${fmtUsd(-pfBenchmark.medianSpread)} debajo del PF en el escenario mediano`
                      }
                      sub={`Cash absoluto retirado fue el mismo en ambas estrategias`}
                    />
                  </div>

                  {/* ============ El esfuerzo: anualizar + Sharpe ============ */}
                  <h3 style={{ ...styles.h3, marginTop: 28 }}>El esfuerzo: ¿cuánto extra ganas por unidad de riesgo?</h3>
                  <p style={styles.distribIntro}>
                    Anualizamos el resultado de la pignoración resolviendo numéricamente la tasa equivalente
                    de un PF que daría el mismo patrimonio. La <strong>volatilidad de la cartera ({fmtPct(sigma, 2)})</strong> se
                    asigna íntegramente al exceso porque el PF tiene σ = 0. El cociente es el <strong>Sharpe del esfuerzo</strong>:
                    cuánto retorno extra anual obtienes por cada punto de volatilidad asumida.
                  </p>
                  <div style={{
                    ...styles.btMetricsGrid,
                    gridTemplateColumns: "repeat(3, 1fr)",
                    marginTop: 14,
                  }}>
                    <PignCard
                      title="Rentabilidad extra anual"
                      value={(pfBenchmark.excessCAGR >= 0 ? "+" : "") + fmtPct(pfBenchmark.excessCAGR, 2)}
                      color={pfBenchmark.excessCAGR > 0 ? "var(--positive)" : "var(--negative)"}
                      caption={`CAGR equivalente pignoración: ${fmtPct(pfBenchmark.equivRate, 2)} · PF: ${fmtPct(pfBenchmark.pfRateNet, 2)}`}
                      sub={`Lo que ganas extra por año, anualizado al horizonte ${pledgeHorizon}a`}
                    />
                    <PignCard
                      title="Volatilidad asignada"
                      value={fmtPct(pfBenchmark.volEsfuerzo, 1)}
                      caption={`σ de la cartera completa (toda la incertidumbre va al exceso)`}
                      sub={`El PF tiene σ = 0, así que el riesgo total es el de tu portfolio`}
                    />
                    <PignCard
                      title="Sharpe del esfuerzo"
                      value={pfBenchmark.sharpeEsfuerzo.toFixed(2)}
                      color={
                        pfBenchmark.sharpeEsfuerzo > 0.5 ? "var(--positive)" :
                        pfBenchmark.sharpeEsfuerzo > 0.2 ? "var(--gold)" :
                        "var(--negative)"
                      }
                      caption={
                        pfBenchmark.sharpeEsfuerzo > 0.7 ? "Excelente · ratio top de la industria" :
                        pfBenchmark.sharpeEsfuerzo > 0.4 ? "Bueno · el riesgo paga decentemente" :
                        pfBenchmark.sharpeEsfuerzo > 0.2 ? "Aceptable · ratio modesto" :
                        pfBenchmark.sharpeEsfuerzo > 0   ? "Pobre · poco retorno por mucho riesgo" :
                        "Negativo · el PF gana en mediana"
                      }
                      sub={`El indicador de oro: excessCAGR / σ`}
                    />
                  </div>

                  {/* ============ Sweep por horizonte ============ */}
                  {pledgeResult.horizonSweep && (
                    <>
                      <h3 style={{ ...styles.h3, marginTop: 28 }}>¿Con qué horizonte temporal vale más la pena?</h3>
                      <p style={styles.distribIntro}>
                        Repetimos el análisis para horizontes de 5 a 30 años. Cada punto del gráfico es una simulación
                        completa con 1.500 paths. Buscamos el <strong>horizonte que maximiza el Sharpe del esfuerzo</strong> —
                        ahí está el sweet spot. La línea roja vertical marca el horizonte actual ({pledgeHorizon} años).
                      </p>
                      <div style={{ marginTop: 4, marginBottom: 14, padding: "12px 18px", background: "var(--surface-2)", border: "1px solid var(--gold)", borderRadius: 2 }}>
                        <strong style={{ color: "var(--gold)" }}>★ Horizonte óptimo: {pledgeResult.horizonSweep.optimalHorizon.T} años</strong>
                        {" — "}Sharpe del esfuerzo = <strong>{pledgeResult.horizonSweep.optimalHorizon.sharpeEsfuerzo.toFixed(2)}</strong>,
                        rentabilidad extra <strong>{fmtPct(pledgeResult.horizonSweep.optimalHorizon.excessCAGR, 2)}</strong>,
                        P(beat PF) = <strong>{fmtPct(pledgeResult.horizonSweep.optimalHorizon.probBeatPF, 0)}</strong>
                      </div>
                      <div style={styles.chartWrap}>
                        <ResponsiveContainer width="100%" height={340}>
                          <ComposedChart data={pledgeResult.horizonSweep.curve} margin={{ top: 20, right: 60, left: 20, bottom: 40 }}>
                            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                            <XAxis
                              dataKey="T" type="number" domain={[5, 30]}
                              tickFormatter={v => v + "a"}
                              stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                              label={{ value: "Horizonte temporal (años)", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }}
                            />
                            <YAxis
                              yAxisId="sharpe"
                              orientation="left"
                              tickFormatter={v => v.toFixed(2)}
                              stroke="var(--gold)" tick={{ fontSize: 11 }}
                              label={{ value: "Sharpe del esfuerzo", angle: -90, position: "insideLeft", fill: "var(--gold)", fontSize: 12 }}
                            />
                            <YAxis
                              yAxisId="prob"
                              orientation="right"
                              domain={[0, 100]}
                              tickFormatter={v => v.toFixed(0) + "%"}
                              stroke="var(--accent)" tick={{ fontSize: 11 }}
                              label={{ value: "P(beat PF)", angle: 90, position: "insideRight", fill: "var(--accent)", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11 }}
                              labelFormatter={v => `Horizonte ${v} años`}
                              formatter={(v, name) => {
                                if (name === "Sharpe esfuerzo") return [v.toFixed(2), name];
                                if (name === "P(beat PF)") return [v.toFixed(1) + "%", name];
                                if (name === "Excess CAGR") return [(v*100).toFixed(2) + "%", name];
                                return [v, name];
                              }}
                            />
                            <Line
                              yAxisId="sharpe"
                              type="monotone"
                              dataKey="sharpeEsfuerzo"
                              stroke="var(--gold)"
                              strokeWidth={3}
                              dot={{ r: 4, fill: "var(--gold)" }}
                              name="Sharpe esfuerzo"
                              isAnimationActive={false}
                            />
                            <Line
                              yAxisId="prob"
                              type="monotone"
                              dataKey={(d) => d.probBeatPF * 100}
                              stroke="var(--accent)"
                              strokeWidth={2}
                              strokeDasharray="6 3"
                              dot={{ r: 3, fill: "var(--accent)" }}
                              name="P(beat PF)"
                              isAnimationActive={false}
                            />
                            <ReferenceLine
                              x={pledgeHorizon}
                              stroke="var(--negative)"
                              strokeDasharray="3 3"
                              label={{ value: `actual (${pledgeHorizon}a)`, position: "top", fontSize: 10, fill: "var(--negative)" }}
                              yAxisId="sharpe"
                            />
                            <ReferenceLine
                              x={pledgeResult.horizonSweep.optimalHorizon.T}
                              stroke="var(--positive)"
                              strokeWidth={2}
                              label={{ value: `★ óptimo`, position: "top", fontSize: 10, fill: "var(--positive)", fontWeight: 600 }}
                              yAxisId="sharpe"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      <h4 style={{ ...styles.h3, fontSize: 14, marginTop: 18 }}>Rentabilidad extra anual por horizonte</h4>
                      <div style={styles.chartWrap}>
                        <ResponsiveContainer width="100%" height={240}>
                          <ComposedChart data={pledgeResult.horizonSweep.curve} margin={{ top: 16, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                            <XAxis
                              dataKey="T" type="number" domain={[5, 30]}
                              tickFormatter={v => v + "a"}
                              stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                              label={{ value: "Horizonte temporal (años)", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }}
                            />
                            <YAxis
                              tickFormatter={v => (v*100).toFixed(1) + "%"}
                              stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                              label={{ value: "Excess CAGR", angle: -90, position: "insideLeft", fill: "var(--ink-muted)", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11 }}
                              labelFormatter={v => `Horizonte ${v} años`}
                              formatter={(v) => [(v*100).toFixed(2) + "%", "Excess CAGR"]}
                            />
                            <ReferenceLine y={0} stroke="var(--ink-muted)" strokeDasharray="2 2" />
                            <Area
                              type="monotone"
                              dataKey="excessCAGR"
                              stroke="var(--positive)"
                              strokeWidth={2.5}
                              fill="var(--positive)"
                              fillOpacity={0.12}
                              isAnimationActive={false}
                            />
                            <ReferenceLine
                              x={pledgeHorizon}
                              stroke="var(--negative)"
                              strokeDasharray="3 3"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Withdrawal sweep chart: P(margin call) vs retiro % */}
              <h3 style={styles.h3}>Sensibilidad: ¿cuánto puedo retirar al año?</h3>
              <p style={styles.distribIntro}>
                Manteniendo todo lo demás constante (LTV inicial <strong>{fmtPct(ltv0, 0)}</strong>, tasa <strong>{fmtPct(intRate, 2)}</strong>,
                umbral <strong>{fmtPct(marginCallLTV, 0)}</strong>, horizonte <strong>{pledgeHorizon} años</strong>), esta curva muestra
                cómo crece la probabilidad de margin call a medida que aumentas el retiro anual.
              </p>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={pledgeResult.sweep.curve} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="wPctDisplay" type="number" domain={[0, 10]}
                      tickFormatter={v => v.toFixed(1) + "%"}
                      stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                      label={{ value: "Retiro anual (% del capital inicial)", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]} tickFormatter={v => v.toFixed(0) + "%"}
                      stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                      label={{ value: "P(margin call)", angle: -90, position: "insideLeft", fill: "var(--ink-muted)", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11 }}
                      formatter={(v, name) => name === "P(margin call)" ? [v.toFixed(1) + "%", name] : v}
                      labelFormatter={v => `Retiro ${v.toFixed(2)}% (${fmtUsd(v * 100)}/año)`}
                    />

                    {/* Filled area under curve */}
                    <Area type="monotone" dataKey="mcProbPct" stroke="var(--accent)" strokeWidth={2.5}
                          fill="var(--accent)" fillOpacity={0.15} isAnimationActive={false}
                          name="P(margin call)" />

                    {/* Horizontal reference lines at common thresholds */}
                    <ReferenceLine y={5} stroke="var(--positive)" strokeDasharray="3 3"
                                   label={{ value: "5% (conservador)", position: "right", fontSize: 10, fill: "var(--positive)" }} />
                    <ReferenceLine y={10} stroke="var(--gold)" strokeDasharray="3 3"
                                   label={{ value: "10% (moderado)", position: "right", fontSize: 10, fill: "var(--gold)" }} />
                    <ReferenceLine y={20} stroke="var(--negative)" strokeDasharray="3 3"
                                   label={{ value: "20% (agresivo)", position: "right", fontSize: 10, fill: "var(--negative)" }} />

                    {/* Vertical line at current withdrawal */}
                    <ReferenceLine x={withdrawalPct * 100} stroke="var(--ink)" strokeWidth={2}
                                   label={{ value: `Tu retiro: ${fmtPct(withdrawalPct, 2)}`, position: "insideTopLeft", fontSize: 11, fill: "var(--ink)", fontWeight: 700 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={styles.sweepCrossovers}>
                  <span style={styles.sweepCrossLabel}>Retiro máximo recomendado:</span>
                  <span><span style={{...styles.dot, background: "var(--positive)"}}/>
                    <strong>{pledgeResult.sweep.cross5 !== null ? fmtPct(pledgeResult.sweep.cross5, 2) : ">10%"}</strong> para mantener P(MC) ≤ 5%
                  </span>
                  <span><span style={{...styles.dot, background: "var(--gold)"}}/>
                    <strong>{pledgeResult.sweep.cross10 !== null ? fmtPct(pledgeResult.sweep.cross10, 2) : ">10%"}</strong> para P(MC) ≤ 10%
                  </span>
                  <span><span style={{...styles.dot, background: "var(--negative)"}}/>
                    <strong>{pledgeResult.sweep.cross20 !== null ? fmtPct(pledgeResult.sweep.cross20, 2) : ">10%"}</strong> para P(MC) ≤ 20%
                  </span>
                </div>
              </div>

              {/* ============ Retiro máximo sostenible: análisis completo ============ */}
              {sustainableScenario && (
                <>
                  <h3 style={{ ...styles.h3, marginTop: 28 }}>Retiro máximo sostenible · análisis completo</h3>
                  <p style={styles.distribIntro}>
                    Asume que <strong>todos los retiros se hacen 100% vía préstamo pignorado</strong> a la
                    tasa de <strong>{fmtPct(intRate, 2)}</strong> (slider arriba). La cartera nunca se vende —
                    sigue generando retorno μ = <strong>{fmtPct(mu, 2)}</strong>. El retiro máximo es el más
                    alto que mantiene la probabilidad de margin call debajo de tu tolerancia.
                  </p>

                  {/* Selector de tolerancia */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-muted)" }}>
                      Tolerancia P(margin call):
                    </span>
                    {[0.01, 0.05, 0.10, 0.20].map(tol => (
                      <button
                        key={tol}
                        onClick={() => setMcTolerance(tol)}
                        style={{
                          padding: "6px 14px",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          fontWeight: 600,
                          background: Math.abs(mcTolerance - tol) < 0.001 ? "var(--ink)" : "var(--surface)",
                          color: Math.abs(mcTolerance - tol) < 0.001 ? "var(--bg)" : "var(--ink)",
                          border: "1px solid var(--border-strong)",
                          borderRadius: 2,
                          cursor: "pointer",
                        }}
                      >
                        {tol === 0.01 ? "1% (muy conservador)" :
                         tol === 0.05 ? "5% (conservador)" :
                         tol === 0.10 ? "10% (moderado)" :
                         "20% (agresivo)"}
                      </button>
                    ))}
                  </div>

                  {sustainableScenario.infeasible ? (
                    <div style={{ ...styles.placeholder, color: "var(--negative)" }}>
                      Con los parámetros actuales (LTV {fmtPct(ltv0, 0)}, tasa {fmtPct(intRate, 2)}, umbral {fmtPct(marginCallLTV, 0)})
                      ningún retiro mantiene P(margin call) ≤ {fmtPct(mcTolerance, 0)}. Reduce LTV inicial,
                      aumenta el umbral de margin call, o sube tu tolerancia.
                    </div>
                  ) : (
                    <>
                      {/* Headline + botón aplicar */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 18,
                        padding: "16px 22px",
                        background: "var(--surface-2)",
                        border: "2px solid var(--positive)",
                        borderRadius: 2,
                        marginBottom: 22,
                      }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            Retiro máximo a tolerancia {fmtPct(mcTolerance, 0)}
                          </div>
                          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--positive)", marginTop: 4 }}>
                            {fmtPct(sustainableScenario.wMax, 2)} anual
                            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-muted)", marginLeft: 10 }}>
                              = {fmtUsd(sustainableScenario.W_year)}/año sobre $10k
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 4 }}>
                            P(margin call) realizada en la re-simulación: {fmtPct(sustainableScenario.mcProbActual, 1)}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setWithdrawalPct(sustainableScenario.wMax);
                            setTimeout(() => runPledge(), 60);
                          }}
                          style={{ ...styles.runBtn, whiteSpace: "nowrap" }}
                          disabled={pledgeRunning}
                          title="Aplica este retiro al slider 'Retiro anual' y re-corre el Monte Carlo completo"
                        >
                          Aplicar este retiro →
                        </button>
                      </div>

                      {/* Gráfico: net patrimony + LTV */}
                      <h4 style={{ ...styles.h3, fontSize: 14 }}>Evolución bajo el escenario sostenible</h4>
                      <div style={styles.chartWrap}>
                        <ResponsiveContainer width="100%" height={380}>
                          <ComposedChart data={sustainableScenario.chartData} margin={{ top: 20, right: 70, left: 20, bottom: 30 }}>
                            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="year" stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                                   label={{ value: "Años", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }} />
                            <YAxis yAxisId="left" tickFormatter={fmtUsdK} stroke="var(--positive)" tick={{ fontSize: 11, fill: "var(--positive)" }}
                                   label={{ value: "Patrimonio neto (USD)", angle: -90, position: "insideLeft", fill: "var(--positive)", fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]}
                                   tickFormatter={v => v + "%"} stroke="var(--gold)" tick={{ fontSize: 11, fill: "var(--gold)" }}
                                   label={{ value: "LTV %", angle: 90, position: "insideRight", fill: "var(--gold)", fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11 }}
                              formatter={(v, name) => {
                                if (name === "LTV (mediana)" || name === "Umbral margin call") return [v.toFixed(1) + "%", name];
                                if (name === "Banda LTV P10–P90") return [v.toFixed(1) + "%", "ancho"];
                                if (name === "Banda neto P10–P90") return [fmtUsd(v), "ancho"];
                                return [fmtUsd(v), name];
                              }}
                              labelFormatter={(v) => `Año ${v}`}
                            />
                            {/* Banda neto p10-p90 */}
                            <Area yAxisId="left" type="monotone" dataKey="net_band_base" stackId="netband"
                                  stroke="none" fill="transparent" name=" " />
                            <Area yAxisId="left" type="monotone" dataKey="net_band_width" stackId="netband"
                                  stroke="none" fill="rgba(45, 122, 79, 0.18)" name="Banda neto P10–P90" isAnimationActive={false} />
                            {/* Mediana neto */}
                            <Line yAxisId="left" type="monotone" dataKey="net_p50"
                                  stroke="var(--positive)" strokeWidth={2.5} dot={false}
                                  name="Patrimonio neto (mediana)" isAnimationActive={false} />
                            {/* Referencia V0 */}
                            <ReferenceLine yAxisId="left" y={10000} stroke="var(--ink-muted)" strokeDasharray="3 3"
                                          label={{ value: "Capital inicial", position: "right", fontSize: 10, fill: "var(--ink-muted)" }} />
                            {/* LTV mediana */}
                            <Line yAxisId="right" type="monotone" dataKey="ltv_p50"
                                  stroke="var(--gold)" strokeWidth={2.5} strokeDasharray="6 3" dot={false}
                                  name="LTV (mediana)" isAnimationActive={false} />
                            {/* Umbral margin call */}
                            <ReferenceLine yAxisId="right" y={marginCallLTV * 100}
                                          stroke="var(--negative)" strokeWidth={2}
                                          label={{ value: `Margin call ${fmtPct(marginCallLTV, 0)}`, position: "right", fontSize: 10, fill: "var(--negative)", fontWeight: 600 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Cards: CAGR comparativas */}
                      <h4 style={{ ...styles.h3, fontSize: 14, marginTop: 18 }}>CAGR comparativas · ¿qué tasa anual equivalente entregaste?</h4>
                      <div style={{
                        ...styles.btMetricsGrid,
                        gridTemplateColumns: "repeat(4, 1fr)",
                        marginTop: 10,
                      }}>
                        <PignCard
                          title="CAGR Net only"
                          value={fmtPct(sustainableScenario.cagrNet, 2)}
                          color={sustainableScenario.cagrNet > 0 ? "var(--ink)" : "var(--negative)"}
                          caption={`Patrimonio neto final $${sustainableScenario.finalNet.toFixed(0)} sobre $10k inicial`}
                          sub={`Lo que sigue invertido al final del horizonte`}
                        />
                        <PignCard
                          title="CAGR Total Wealth"
                          value={fmtPct(sustainableScenario.cagrTotalWealth, 2)}
                          color="var(--positive)"
                          caption={`Incluye cash ya consumido: $${sustainableScenario.finalNet.toFixed(0)} + $${(sustainableScenario.W_year * sustainableScenario.T).toFixed(0)} retirados`}
                          sub={`Lo que generó la estrategia en términos absolutos`}
                        />
                        <PignCard
                          title="CAGR PF PEN"
                          value={fmtPct(sustainableScenario.cagrPF, 2)}
                          color="var(--ink-muted)"
                          caption={`Benchmark cero riesgo · post-tax`}
                          sub={`Tu piso de comparación`}
                        />
                        <PignCard
                          title="CAGR Portfolio Gross"
                          value={fmtPct(sustainableScenario.cagrGross, 2)}
                          color="var(--gold)"
                          caption={`μ del portfolio sin pignoración ni retiros`}
                          sub={`Lo que tendrías si no tocaras nada`}
                        />
                      </div>

                      {/* Cards: detalle del escenario */}
                      <h4 style={{ ...styles.h3, fontSize: 14, marginTop: 18 }}>Detalle del escenario</h4>
                      <div style={{
                        ...styles.btMetricsGrid,
                        gridTemplateColumns: "repeat(3, 1fr)",
                        marginTop: 10,
                      }}>
                        <PignCard
                          title="Apalancamiento final"
                          value={fmtPct(sustainableScenario.leverageFinal, 1)}
                          color={
                            sustainableScenario.leverageFinal < 0.5 ? "var(--positive)" :
                            sustainableScenario.leverageFinal < 0.65 ? "var(--gold)" : "var(--negative)"
                          }
                          caption={`LTV mediano al cierre del horizonte (préstamo / valor cartera)`}
                          sub={
                            sustainableScenario.leverageFinal < 0.4 ? "Sano · margen amplio" :
                            sustainableScenario.leverageFinal < 0.55 ? "Aceptable · vigilar" :
                            "Cerca del umbral · ojo"
                          }
                        />
                        <PignCard
                          title="Cash flow yield"
                          value={fmtPct(sustainableScenario.cashFlowYield, 2)}
                          caption={`$${sustainableScenario.W_year.toFixed(0)}/año sobre $10k inicial`}
                          sub={`Lo que retiras como % del capital de partida`}
                        />
                        <PignCard
                          title="Recovery margin"
                          value={fmtPct(sustainableScenario.recoveryMargin, 1)}
                          color={
                            sustainableScenario.recoveryMargin > 0.30 ? "var(--positive)" :
                            sustainableScenario.recoveryMargin > 0.15 ? "var(--gold)" : "var(--negative)"
                          }
                          caption={`Distancia promedio entre LTV mediano y umbral margin call`}
                          sub={`Más colchón = más tranquilo`}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Main chart: portfolio band + loan + LTV */}
              <h3 style={styles.h3}>Dinámica completa · cartera, préstamo y LTV</h3>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={440}>
                  <ComposedChart data={pledgeResult.yearStats} margin={{ top: 20, right: 70, left: 20, bottom: 30 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="year" stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                           label={{ value: "Años", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }} />
                    <YAxis yAxisId="left" tickFormatter={fmtUsdK} stroke="var(--ink-muted)" tick={{ fontSize: 11 }}
                           label={{ value: "USD", angle: -90, position: "insideLeft", fill: "var(--ink-muted)", fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]}
                           tickFormatter={v => v + "%"} stroke="var(--gold)" tick={{ fontSize: 11, fill: "var(--gold)" }}
                           label={{ value: "LTV %", angle: 90, position: "insideRight", fill: "var(--gold)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11 }}
                      formatter={(v, name) => {
                        if (name === "LTV (mediana)" || name === "Umbral margin call") return [v.toFixed(1) + "%", name];
                        if (name === "Préstamo") return [fmtUsd(v), name];
                        if (name === "Cartera (mediana)") return [fmtUsd(v), name];
                        if (name === "Banda cartera P10–P90") return [fmtUsd(v), "ancho"];
                        return [fmtUsd(v), name];
                      }}
                      labelFormatter={(v) => `Año ${v}`}
                    />

                    {/* Portfolio band P10-P90 stacked */}
                    <Area yAxisId="left" type="monotone" dataKey="v_band_base" stackId="vband"
                          stroke="none" fill="transparent" name=" " />
                    <Area yAxisId="left" type="monotone" dataKey="v_band_width" stackId="vband"
                          stroke="none" fill="rgba(45, 94, 58, 0.18)" name="Banda cartera P10–P90" isAnimationActive={false} />

                    {/* Portfolio median */}
                    <Line yAxisId="left" type="monotone" dataKey="v_p50"
                          stroke="var(--positive)" strokeWidth={2.5} dot={false}
                          name="Cartera (mediana)" isAnimationActive={false} />

                    {/* Loan deterministic */}
                    <Line yAxisId="left" type="monotone" dataKey="loan"
                          stroke="var(--accent)" strokeWidth={2.5} dot={false}
                          name="Préstamo" isAnimationActive={false} />

                    {/* LTV band P10-P90 on right axis */}
                    <Area yAxisId="right" type="monotone" dataKey="ltv_band_base" stackId="ltvband"
                          stroke="none" fill="transparent" name=" " />
                    <Area yAxisId="right" type="monotone" dataKey="ltv_band_width" stackId="ltvband"
                          stroke="none" fill="rgba(184, 146, 58, 0.20)" name="Banda LTV P10–P90" isAnimationActive={false} />

                    {/* LTV median on right axis */}
                    <Line yAxisId="right" type="monotone" dataKey="ltv_p50"
                          stroke="var(--gold)" strokeWidth={2} strokeDasharray="4 2" dot={false}
                          name="LTV (mediana)" isAnimationActive={false} />

                    {/* Margin call threshold */}
                    <ReferenceLine yAxisId="right" y={marginCallLTV * 100}
                                   stroke="var(--negative)" strokeWidth={1.5} strokeDasharray="6 3"
                                   label={{ value: `Umbral ${fmtPct(marginCallLTV, 0)}`, position: "insideTopRight", fill: "var(--negative)", fontSize: 10, fontWeight: 700 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={styles.legend}>
                  <span><span style={{...styles.dotSquare, background: "rgba(45, 94, 58, 0.30)"}}/> Cartera banda P10–P90</span>
                  <span><span style={{...styles.dot, background: "var(--positive)"}}/> Cartera mediana</span>
                  <span><span style={{...styles.dot, background: "var(--accent)"}}/> Préstamo</span>
                  <span><span style={{...styles.dotSquare, background: "rgba(184, 146, 58, 0.30)"}}/> LTV banda</span>
                  <span><span style={{...styles.dot, background: "var(--gold)"}}/> LTV mediana</span>
                  <span><span style={{...styles.dot, background: "var(--negative)"}}/> Umbral margin call</span>
                </div>
              </div>

              {/* Heatmap (collapsible) */}
              <div style={styles.heatmapWrap}>
                <button
                  onClick={() => {
                    setHeatmapOpen(!heatmapOpen);
                    if (!heatmapOpen && !heatmapResult) runHeatmapSim();
                  }}
                  style={styles.heatmapToggle}
                >
                  {heatmapOpen ? "▼" : "▶"} Mapa de viabilidad · LTV inicial × Retiro anual → P(margin call)
                </button>
                {heatmapOpen && (
                  <div style={styles.heatmapBody}>
                    {!heatmapResult && heatmapRunning && (
                      <div style={styles.placeholder}>Generando mapa (800 paths × 90 cells)...</div>
                    )}
                    {!heatmapResult && !heatmapRunning && (
                      <button onClick={runHeatmapSim} style={styles.runBtn}>Generar mapa</button>
                    )}
                    {heatmapResult && (
                      <>
                        <p style={styles.distribIntro}>
                          Cada celda muestra P(margin call) a {pledgeHorizon} años para esa combinación de LTV inicial (filas) y retiro anual (columnas),
                          con tasa <strong>{fmtPct(intRate, 2)}</strong> y umbral <strong>{fmtPct(marginCallLTV, 0)}</strong>.
                          Verde es zona segura, dorado advertencia, rojo no viable.
                        </p>
                        <HeatmapDisplay data={heatmapResult} />
                        <button onClick={runHeatmapSim} style={{...styles.runBtn, marginTop: 14}} disabled={heatmapRunning}>
                          {heatmapRunning ? "Actualizando..." : "Re-generar mapa con parámetros actuales"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.btNote}>
                <strong>Nota metodológica.</strong> El préstamo se modela como crédito rotativo: cada año
                el saldo acumula la tasa y se le suman los retiros nuevos. La cartera evoluciona estocásticamente
                vía Monte Carlo (3,000 trayectorias) con μ y σ derivados de tu cartera Markowitz activa.
                La línea de LTV mediana muestra el camino "típico"; la banda muestra dispersión 80%.
                {compareVsSell && <> El cálculo de ahorro fiscal asume que cada retiro al vender contiene una fracción de ganancia = 1 − 1/(crecimiento mediano acumulado al año t), aplicando tax ponderado por tu split USD/PEN. Es una estimación conservadora — en la realidad los gains varían con tu base de costo específica.</>}
              </div>
            </>
          )}
        </section>
      )}

      {/* ============== TAB: BACKTESTING ============== */}
      {tab === "backtest" && (
        <section style={styles.section}>
          <div style={styles.markowitzHeader}>
            <div>
              <h2 style={styles.h2}>Backtesting con Rebalanceo</h2>
              <p style={styles.intro}>
                Simulación de la cartera actual sobre <strong>{backtestYears} años</strong> de historia
                sintética generada con tus rentabilidades esperadas (post-impuestos), las volatilidades
                históricas dummy y la matriz de correlaciones. Compara contra un benchmark mixto
                <strong> S&P 500 + EPU/BVLIM</strong> ponderado por tu split USD/PEN.
              </p>
            </div>
            <button onClick={runBacktestSim} style={styles.runBtn} disabled={backtestRunning}>
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
              <span style={styles.labelTop}>Período del backtest</span>
              <div style={styles.confRow}>
                {[5, 10, 15, 20].map(y => (
                  <button
                    key={y}
                    onClick={() => setBacktestYears(y)}
                    style={{ ...styles.confBtn, ...(backtestYears === y ? styles.confBtnActive : {}) }}
                  >
                    {y} años
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!backtestResult && !backtestRunning && (
            <div style={styles.placeholder}>
              Selecciona frecuencia de rebalanceo y período, luego corre el backtest.
              <br/><span style={{fontSize: 11, opacity: 0.7}}>
                Tip: prueba mismo período/cartera con distintos rebalanceos para ver el impacto.
              </span>
            </div>
          )}

          {backtestResult && (
            <>
              {/* Comparison cards */}
              <div style={styles.btMetricsGrid}>
                <BacktestCard
                  title="Tu Cartera"
                  subtitle={`Rebalanceo cada ${rebalanceFreq === 1 ? "mes" : rebalanceFreq === 12 ? "año" : `${rebalanceFreq} meses`}`}
                  data={backtestResult.portfolio}
                  accent="accent"
                />
                <BacktestCard
                  title="Benchmark"
                  subtitle={`${(backtestResult.benchmark.wSP*100).toFixed(0)}% S&P + ${(backtestResult.benchmark.wBVL*100).toFixed(0)}% EPU/BVLIM`}
                  data={backtestResult.benchmark}
                  accent="ink"
                />
                <div style={styles.btCompCard}>
                  <div style={styles.optCardLabel}>vs Benchmark</div>
                  <div style={styles.btCompMetrics}>
                    <div>
                      <div style={styles.optMetricLabel}>Alpha anualizado</div>
                      <div style={{
                        ...styles.optMetricValue,
                        color: backtestResult.compare.annualizedAlpha >= 0 ? "var(--positive)" : "var(--negative)"
                      }}>
                        {backtestResult.compare.annualizedAlpha >= 0 ? "+" : ""}{fmtPct(backtestResult.compare.annualizedAlpha, 2)}
                      </div>
                    </div>
                    <div>
                      <div style={styles.optMetricLabel}>Tracking Error</div>
                      <div style={styles.optMetricValue}>{fmtPct(backtestResult.compare.TE, 2)}</div>
                    </div>
                    <div>
                      <div style={styles.optMetricLabel}>Information Ratio</div>
                      <div style={{
                        ...styles.optMetricValue,
                        color: backtestResult.compare.IR >= 0.5 ? "var(--positive)" : backtestResult.compare.IR >= 0 ? "var(--ink)" : "var(--negative)"
                      }}>
                        {backtestResult.compare.IR.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div style={styles.btCompFooter}>
                    {backtestResult.compare.IR >= 1 ? "Excelente alpha ajustado por riesgo activo" :
                     backtestResult.compare.IR >= 0.5 ? "Buen alpha ajustado" :
                     backtestResult.compare.IR >= 0 ? "Alpha positivo pero marginal" :
                     "Underperformance vs benchmark"}
                  </div>
                </div>
              </div>

              {/* Equity curve */}
              <h3 style={styles.h3}>Curvas de capital · {backtestYears} años</h3>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart
                    data={backtestResult.portfolio.equity.map((v, i) => ({
                      month: i,
                      year: (i / 12).toFixed(2),
                      portfolio: v,
                      benchmark: backtestResult.benchmark.equity[i],
                    }))}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => (v / 12).toFixed(0) + "y"}
                      stroke="var(--ink-muted)"
                      tick={{ fontSize: 11 }}
                      label={{ value: "Años", position: "bottom", offset: 5, fill: "var(--ink-muted)", fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(v) => fmtUsdK(v)} stroke="var(--ink-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => fmtUsd(v)}
                      labelFormatter={(v) => `Mes ${v} · año ${(v/12).toFixed(1)}`}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="portfolio" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Tu Cartera" isAnimationActive={false} />
                    <Line type="monotone" dataKey="benchmark" stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Benchmark" isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={styles.legend}>
                  <span><span style={{...styles.dot, background: "var(--accent)"}}/> Tu Cartera</span>
                  <span><span style={{...styles.dot, background: "var(--ink)"}}/> Benchmark (S&P + EPU)</span>
                </div>
              </div>

              {/* Drawdown chart */}
              <h3 style={styles.h3}>Drawdown comparativo</h3>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={backtestResult.portfolio.drawdowns.map((d, i) => ({
                      month: i,
                      portfolio: d * 100,
                      benchmark: backtestResult.benchmark.drawdowns[i] * 100,
                    }))}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => (v / 12).toFixed(0) + "y"}
                      stroke="var(--ink-muted)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickFormatter={(v) => v.toFixed(0) + "%"} stroke="var(--ink-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => v.toFixed(2) + "%"}
                      labelFormatter={(v) => `Mes ${v}`}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="portfolio" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} name="Tu Cartera" isAnimationActive={false} />
                    <Area type="monotone" dataKey="benchmark" stroke="var(--ink)" fill="var(--ink)" fillOpacity={0.10} strokeWidth={1.5} strokeDasharray="5 3" name="Benchmark" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.btNote}>
                <strong>Nota técnica.</strong> Backtest sobre serie sintética generada por Cholesky con tus rentabilidades esperadas
                netas de impuestos y la matriz de correlaciones actual. Los activos con σ=0 (cash) compoundeen deterministamente.
                Cuando integremos data real de yfinance, esta misma lógica usará los retornos diarios reales de los últimos 10 años
                en lugar de la simulación. El número que cambia entre runs es por el componente aleatorio — para resultados estables
                con datos reales no habrá esa varianza.
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

function AssetSlider({ asset, weight, customRet, onRetChange, taxRate, onTickerChange, onRangeChange, hasMarketData }) {
  const effRet = asset.isCash ? customRet * (1 - taxRate) : customRet;
  const retOutOfRange = customRet < asset.retLow || customRet > asset.retHigh;
  // Cuando hay marketData y la historica es positiva, el slider se centra en
  // ella. Rango: -100%/+100% sobre histRet para growth/value (mas latitud porque
  // son acciones individuales mas volatiles), -50%/+100% para el resto.
  // Sino, mantiene el comportamiento legacy: rango fijo [0, max(retHigh*1.5, histRet*1.3, 6%)].
  const useHistAnchor = hasMarketData && typeof asset.histRet === "number" && asset.histRet > 0.005;
  const minMultiplier = asset.editable ? 0.0 : 0.5;
  const minRet = useHistAnchor ? asset.histRet * minMultiplier : 0;
  const maxRet = useHistAnchor
    ? asset.histRet * 2.0
    : Math.max(asset.retHigh * 1.5, asset.histRet * 1.3, 0.06);
  const step = 0.001;
  // Position % of reference markers on the slider track
  const pctOf = (v) => Math.max(0, Math.min(100, ((v - minRet) / (maxRet - minRet)) * 100));
  const pctLow = pctOf(asset.retLow);
  const pctHigh = pctOf(asset.retHigh);
  const pctHist = pctOf(asset.histRet);
  // Mostrar Hist 10y siempre que exista y sea > 0; el placeholder "—" sólo
  // aparece para growth/value sin marketData cargado (no tenemos histórica del ticker custom).
  const showHist = (typeof asset.histRet === "number" && asset.histRet > 0) && (!asset.editable || hasMarketData);
  return (
    <div style={{
      ...styles.assetRow,
      ...(asset.editable ? styles.assetRowEditable : {}),
    }}>
      <div style={styles.assetInfo}>
        <div style={styles.assetTopLine}>
          {asset.editable ? (
            <>
              <span style={styles.editableLabel}>
                {asset.kind === "growth" ? "Acción Growth:" : "Acción Value:"}
              </span>
              <input
                type="text"
                value={asset.id.toUpperCase()}
                onChange={(e) => onTickerChange(e.target.value.toUpperCase().trim())}
                placeholder={asset.kind === "growth" ? "ej: MSFT, NVDA, AAPL" : "ej: UBER, BRK-B, JNJ"}
                style={styles.tickerInput}
                maxLength="8"
              />
              <span style={styles.tag}>{asset.cur}</span>
              <span style={styles.assetSigmaTop}>σ {fmtPct(asset.vol, 1)}</span>
            </>
          ) : (
            <>
              <span style={styles.assetName}>{asset.name}</span>
              <span style={styles.tag}>{asset.cur}</span>
              <span style={styles.assetSigmaTop}>σ {fmtPct(asset.vol, 1)}</span>
            </>
          )}
        </div>
        <div style={styles.assetRefRow}>
          <span style={styles.refItem}>
            Hist 10y: <strong>{showHist ? fmtPct(asset.histRet, 1) : "—"}</strong>
            {!showHist && asset.editable && <span style={styles.refPlaceholder}> (se calcula con datos reales)</span>}
          </span>
          <span style={styles.refSep}>|</span>
          {asset.editable ? (
            <span style={styles.refItem}>
              Rango esperado:{" "}
              <input
                type="number"
                step="0.5"
                value={(asset.retLow * 100).toFixed(1)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) / 100;
                  if (!isNaN(v)) onRangeChange({ retLow: v, retHigh: asset.retHigh });
                }}
                style={styles.rangeMiniInput}
              />
              <span style={styles.rangeMiniPct}>%</span>
              <span style={{ margin: "0 4px" }}>–</span>
              <input
                type="number"
                step="0.5"
                value={(asset.retHigh * 100).toFixed(1)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) / 100;
                  if (!isNaN(v)) onRangeChange({ retLow: asset.retLow, retHigh: v });
                }}
                style={styles.rangeMiniInput}
              />
              <span style={styles.rangeMiniPct}>%</span>
            </span>
          ) : (
            <span style={styles.refItem}>
              Damodaran: <strong>{fmtPct(asset.retLow, 1)} – {fmtPct(asset.retHigh, 1)}</strong>
            </span>
          )}
          {asset.isCash && (
            <>
              <span style={styles.refSep}>|</span>
              <span style={styles.taxIndicator}>
                Neto post-tax {fmtPct(taxRate, 0)}: <strong>{fmtPct(effRet, 2)}</strong>
              </span>
            </>
          )}
        </div>

        {/* Return slider with reference markers */}
        <div style={styles.retSliderRow}>
          <span style={styles.retSliderLabel}>μ esperado</span>
          <div style={styles.retSliderWrap}>
            {/* Reference markers behind the slider */}
            <div style={styles.retSliderTrack}>
              {showHist && (
                <div style={{ ...styles.refMarkerHist, left: `${pctHist}%` }} title={`Hist 10y: ${fmtPct(asset.histRet, 2)}`} />
              )}
              <div style={{ ...styles.refMarkerLow, left: `${pctLow}%` }} title={`Range low: ${fmtPct(asset.retLow, 2)}`} />
              <div style={{ ...styles.refMarkerHigh, left: `${pctHigh}%` }} title={`Range high: ${fmtPct(asset.retHigh, 2)}`} />
              <div style={{
                ...styles.damodaranBand,
                left: `${pctLow}%`,
                width: `${Math.max(pctHigh - pctLow, 0.5)}%`,
              }} />
            </div>
            <input
              type="range"
              min={minRet}
              max={maxRet}
              step={step}
              value={customRet}
              onChange={(e) => onRetChange(parseFloat(e.target.value))}
              style={styles.retSliderInput}
            />
          </div>
          <span style={{
            ...styles.retSliderValue,
            color: retOutOfRange ? "var(--accent)" : "var(--ink)",
          }}>
            {fmtPct(customRet, 2)}
          </span>
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
              width: `${Math.min(weight / asset.maxW * 100, 100)}%`,
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

function CategoryBars({ weights }) {
  const cats = {};
  ASSETS.forEach((a, i) => { cats[a.cat] = (cats[a.cat] || 0) + weights[i]; });
  const total = Object.values(cats).reduce((a, b) => a + b, 0);
  const colors = ["#7a1b1b", "#1d3b2e", "#b8923a", "#3a5a7c", "#5c4a7c", "#7c5a3a", "#3a7c5a"];
  return (
    <div style={styles.catBars}>
      <div style={styles.catBarStrip}>
        {Object.entries(cats).map(([cat, w], i) => (
          <div key={cat} style={{
            width: `${(w/total)*100}%`,
            background: colors[i % colors.length],
            height: "100%",
          }} title={`${cat}: ${fmtPct(w, 1)}`}/>
        ))}
      </div>
      <div style={styles.catLegend}>
        {Object.entries(cats).map(([cat, w], i) => (
          <div key={cat} style={styles.catLegendItem}>
            <span style={{ ...styles.dot, background: colors[i % colors.length] }} />
            <span style={styles.catLegendName}>{cat}</span>
            <span style={styles.catLegendValue}>{fmtPct(w, 1)}</span>
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

function OptimalPortfolioCard({ label, desc, portfolio, accent, highlight, onLoad }) {
  const accentColor = accent === "positive" ? "var(--positive)" : accent === "gold" ? "var(--gold)" : "var(--accent)";
  // Top 5 assets by weight
  const ranked = portfolio.w.map((w, i) => ({ w, asset: ASSETS[i] }))
    .filter(x => x.w > 0.005)
    .sort((a, b) => b.w - a.w);
  const top5 = ranked.slice(0, 5);
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

function CorrelationMatrix() {
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
  const cellSize = 38;
  return (
    <div style={{ overflowX: "auto", background: "var(--surface)", border: "1px solid var(--border)", padding: 14 }}>
      <table style={{ borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ width: cellSize, height: cellSize }}></th>
            {ASSETS.map((a, i) => (
              <th
                key={i}
                style={{
                  width: cellSize, minWidth: cellSize, height: cellSize,
                  writingMode: "vertical-rl", transform: "rotate(180deg)",
                  fontSize: 9, padding: 2, fontWeight: 600,
                  color: "var(--ink-muted)",
                  borderBottom: "1.5px solid var(--ink)",
                }}
              >
                {a.id.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ASSETS.map((aRow, i) => (
            <tr key={i}>
              <th style={{
                width: cellSize * 2.5, height: cellSize, textAlign: "right",
                fontSize: 9, padding: "0 8px", fontWeight: 600,
                color: "var(--ink-muted)",
                borderRight: "1.5px solid var(--ink)",
              }}>
                {aRow.id.toUpperCase()}
              </th>
              {ASSETS.map((aCol, j) => {
                const v = C[i][j];
                const greyOut = aRow.vol === 0 || aCol.vol === 0;
                return (
                  <td
                    key={j}
                    style={{
                      width: cellSize, height: cellSize,
                      background: greyOut ? "rgba(0,0,0,0.04)" : colorFor(v),
                      color: greyOut ? "var(--ink-muted)" : textColor(v),
                      textAlign: "center",
                      fontWeight: i === j ? 700 : 500,
                      border: "1px solid var(--bg)",
                      fontSize: 10,
                      opacity: greyOut ? 0.5 : 1,
                    }}
                    title={`Corr(${aRow.id}, ${aCol.id}) = ${v.toFixed(2)}`}
                  >
                    {v.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 11, color: "var(--ink-muted)", alignItems: "center" }}>
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

function PignCard({ title, value, subValue, color, caption, sub }) {
  return (
    <div style={{ ...styles.optCard, borderColor: color || "var(--border)" }}>
      <div>
        <div style={styles.optCardDesc}>{title}</div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 28, fontWeight: 600,
          color: color || "var(--ink)",
          lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </div>
        {subValue && (
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 14, fontWeight: 500,
            color: "var(--ink-muted)",
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
          }}>
            {subValue}
          </div>
        )}
      </div>
      <div>
        {caption && <div style={{ fontSize: 11.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>{caption}</div>}
        {sub && <div style={{ fontSize: 10.5, color: "var(--ink-muted)", marginTop: 4, fontStyle: "italic" }}>{sub}</div>}
      </div>
    </div>
  );
}

function HeatmapDisplay({ data }) {
  const { grid, ltvValues, withdrawalValues } = data;
  // Color scale: green → gold → red based on margin call probability
  const colorFor = (p) => {
    if (p < 0.01) return "rgba(45, 94, 58, 0.85)";    // deep green
    if (p < 0.03) return "rgba(45, 94, 58, 0.55)";    // green
    if (p < 0.05) return "rgba(45, 94, 58, 0.30)";    // light green
    if (p < 0.10) return "rgba(184, 146, 58, 0.40)";  // light gold
    if (p < 0.20) return "rgba(184, 146, 58, 0.70)";  // gold
    if (p < 0.40) return "rgba(139, 44, 44, 0.55)";   // light red
    if (p < 0.70) return "rgba(139, 44, 44, 0.80)";   // red
    return "rgba(80, 20, 20, 0.95)";                  // deep red
  };
  const textColor = (p) => p > 0.20 || p < 0.03 ? "var(--bg)" : "var(--ink)";
  const cellSize = 60;
  return (
    <div style={{ overflowX: "auto", padding: "8px 0" }}>
      <table style={{ borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace" }}>
        <thead>
          <tr>
            <th rowSpan="2" style={{ ...styles.heatmapHeader, verticalAlign: "bottom", paddingBottom: 8 }}>
              <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9 }}>LTV inicial ↓</span>
            </th>
            <th colSpan={withdrawalValues.length} style={{ ...styles.heatmapHeader, paddingBottom: 6 }}>
              Retiro anual (% del capital) →
            </th>
          </tr>
          <tr>
            {withdrawalValues.map(w => (
              <th key={w} style={{ ...styles.heatmapCol, width: cellSize }}>
                {fmtPct(w, 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, i) => (
            <tr key={i}>
              <th style={styles.heatmapRow}>{fmtPct(ltvValues[i], 0)}</th>
              {row.map((cell, j) => (
                <td key={j}
                    style={{
                      width: cellSize, height: 36,
                      background: colorFor(cell.mcProb),
                      color: textColor(cell.mcProb),
                      textAlign: "center",
                      border: "1px solid var(--bg)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    title={`LTV ${fmtPct(cell.ltv0, 0)} × Retiro ${fmtPct(cell.wPct, 2)} → P(MC) = ${fmtPct(cell.mcProb, 1)}`}>
                  {cell.mcProb < 0.005 ? "—" : fmtPct(cell.mcProb, 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 11, color: "var(--ink-muted)", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600 }}>Escala P(margin call):</span>
        <span><span style={{...styles.dotSquare, background: "rgba(45, 94, 58, 0.85)"}}/> &lt; 1% seguro</span>
        <span><span style={{...styles.dotSquare, background: "rgba(45, 94, 58, 0.30)"}}/> 1–5% aceptable</span>
        <span><span style={{...styles.dotSquare, background: "rgba(184, 146, 58, 0.70)"}}/> 10–20% advertencia</span>
        <span><span style={{...styles.dotSquare, background: "rgba(139, 44, 44, 0.80)"}}/> &gt; 40% no viable</span>
      </div>
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

function ComparisonTable({ portfolios }) {
  // Get all assets that appear with weight > 0 in any portfolio
  const allIdx = new Set();
  portfolios.forEach(p => p.w.forEach((w, i) => { if (w > 0.005) allIdx.add(i); }));
  const idxList = Array.from(allIdx).sort((a, b) => {
    const sumB = portfolios.reduce((acc, p) => acc + p.w[b], 0);
    const sumA = portfolios.reduce((acc, p) => acc + p.w[a], 0);
    return sumB - sumA;
  });
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
          {idxList.map(i => (
            <tr key={i}>
              <td style={styles.compTdAsset}>
                <span style={styles.tag}>{ASSETS[i].cur}</span> {ASSETS[i].name}
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
    marginLeft: "auto",
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
};

/**
 * Axiom QuantFinance - Institutional Paper Trading & Simulated Wallet Engine
 * Real-time order execution, position tracking, P&L calculations & localStorage persistence
 * @author أ. طارق ابوعشي
 */

export class PaperTradingWallet {
  constructor(initialCapital = 100000) {
    this.initialCapital = initialCapital;
    this.cash = initialCapital;
    this.positions = {}; // { [symbol]: { shares, avgPrice, totalCost, shortCode, nameAr, nameEn } }
    this.history = [];   // Array of { id, timestamp, symbol, shortCode, type: 'BUY'|'SELL', shares, price, totalSAR, realizedPnL }
    this.storageKey = 'axiom_paper_trading_wallet';
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.cash = Number(data.cash) || this.initialCapital;
        this.positions = data.positions || {};
        this.history = data.history || [];
      }
    } catch {
      // Fallback in test or non-browser environment
    }
  }

  saveToStorage() {
    try {
      const data = {
        cash: this.cash,
        positions: this.positions,
        history: this.history
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Fallback
    }
  }

  reset(capital = 100000) {
    this.initialCapital = capital;
    this.cash = capital;
    this.positions = {};
    this.history = [];
    this.saveToStorage();
    return this.getSummary({});
  }

  /**
   * Executes a simulated market order (BUY / SELL)
   */
  executeOrder({ symbol, shortCode, nameAr, nameEn, type, shares, price }) {
    shares = Number(shares);
    price = Number(price);

    if (!symbol || !shares || shares <= 0 || !price || price <= 0) {
      return { success: false, error: 'بيانات الأمر غير صالحة' };
    }

    const totalCost = shares * price;

    if (type === 'BUY') {
      if (this.cash < totalCost) {
        return { success: false, error: `الرصيد النقدي غير كافٍ. المطلوب: ${totalCost.toFixed(2)} ر.س، المتاح: ${this.cash.toFixed(2)} ر.س` };
      }

      this.cash -= totalCost;

      if (!this.positions[symbol]) {
        this.positions[symbol] = {
          symbol,
          shortCode: shortCode || symbol.replace('.SR', ''),
          nameAr: nameAr || symbol,
          nameEn: nameEn || symbol,
          shares,
          avgPrice: price,
          totalCost
        };
      } else {
        const existing = this.positions[symbol];
        const newShares = existing.shares + shares;
        const newTotalCost = existing.totalCost + totalCost;
        existing.shares = newShares;
        existing.totalCost = newTotalCost;
        existing.avgPrice = newTotalCost / newShares;
      }

      const tx = {
        id: 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        symbol,
        shortCode: shortCode || symbol.replace('.SR', ''),
        type: 'BUY',
        shares,
        price,
        totalSAR: totalCost,
        realizedPnL: 0
      };

      this.history.unshift(tx);
      this.saveToStorage();

      return { success: true, transaction: tx };

    } else if (type === 'SELL') {
      const existing = this.positions[symbol];
      if (!existing || existing.shares < shares) {
        const available = existing ? existing.shares : 0;
        return { success: false, error: `الكمية المتوفرة للبيع غير كافية. لديك: ${available} سهم` };
      }

      const avgBuyPrice = existing.avgPrice;
      const proceeds = shares * price;
      const costOfSold = shares * avgBuyPrice;
      const realizedPnL = proceeds - costOfSold;

      this.cash += proceeds;
      existing.shares -= shares;
      existing.totalCost -= costOfSold;

      if (existing.shares <= 0) {
        delete this.positions[symbol];
      } else {
        existing.avgPrice = existing.totalCost / existing.shares;
      }

      const tx = {
        id: 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        symbol,
        shortCode: shortCode || symbol.replace('.SR', ''),
        type: 'SELL',
        shares,
        price,
        totalSAR: proceeds,
        realizedPnL
      };

      this.history.unshift(tx);
      this.saveToStorage();

      return { success: true, transaction: tx };
    }

    return { success: false, error: 'نوع الأمر غير معروف' };
  }

  /**
   * Generates a complete portfolio valuation summary given a map of current prices
   * @param {Object} currentPricesMap e.g. { '2222.SR': 25.74, ... }
   */
  getSummary(currentPricesMap = {}) {
    let marketValue = 0;
    let totalCost = 0;
    const activePositions = [];

    for (const [sym, pos] of Object.entries(this.positions)) {
      const currentPrice = currentPricesMap[sym] || pos.avgPrice;
      const currentVal = pos.shares * currentPrice;
      const posCost = pos.totalCost;
      const unrealizedPnL = currentVal - posCost;
      const returnPct = posCost > 0 ? (unrealizedPnL / posCost) * 100 : 0;

      marketValue += currentVal;
      totalCost += posCost;

      activePositions.push({
        ...pos,
        currentPrice,
        marketValue: Number(currentVal.toFixed(2)),
        unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2))
      });
    }

    const totalEquity = this.cash + marketValue;
    const totalUnrealizedPnL = marketValue - totalCost;
    const totalRealizedPnL = this.history.reduce((sum, h) => sum + (h.realizedPnL || 0), 0);
    const netOverallPnL = totalEquity - this.initialCapital;
    const netOverallReturnPct = this.initialCapital > 0 ? (netOverallPnL / this.initialCapital) * 100 : 0;

    return {
      initialCapital: this.initialCapital,
      cash: Number(this.cash.toFixed(2)),
      marketValue: Number(marketValue.toFixed(2)),
      totalEquity: Number(totalEquity.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalUnrealizedPnL: Number(totalUnrealizedPnL.toFixed(2)),
      totalRealizedPnL: Number(totalRealizedPnL.toFixed(2)),
      netOverallPnL: Number(netOverallPnL.toFixed(2)),
      netOverallReturnPct: Number(netOverallReturnPct.toFixed(2)),
      positions: activePositions,
      history: this.history
    };
  }
}

// Global singleton instance for easy cross-component interaction
let globalWalletInstance = null;

export function getPaperTradingWallet() {
  if (!globalWalletInstance) {
    globalWalletInstance = new PaperTradingWallet(100000);
  }
  return globalWalletInstance;
}

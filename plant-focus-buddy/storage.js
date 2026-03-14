const Storage = {
  async get(keys) {
    return chrome.storage.local.get(keys);
  },
  async set(data) {
    return chrome.storage.local.set(data);
  },
  async getAll() {
    return chrome.storage.local.get(null);
  },
  async updateHealth(newHealth) {
    return chrome.storage.local.set({ plantHealth: Math.max(0, Math.min(100, newHealth)) });
  },
  async addGoodSite(domain) {
    const { goodSites = [] } = await this.get('goodSites');
    if (!goodSites.includes(domain)) {
      return this.set({ goodSites: [...goodSites, domain] });
    }
  },
  async addBadSite(domain) {
    const { badSites = [] } = await this.get('badSites');
    if (!badSites.includes(domain)) {
      return this.set({ badSites: [...badSites, domain] });
    }
  },
  async removeGoodSite(domain) {
    const { goodSites = [] } = await this.get('goodSites');
    return this.set({ goodSites: goodSites.filter(d => d !== domain) });
  },
  async removeBadSite(domain) {
    const { badSites = [] } = await this.get('badSites');
    return this.set({ badSites: badSites.filter(d => d !== domain) });
  }
};

// Mock puppeteer-extra-plugin-stealth
const mockStealthPlugin = jest.fn(() => ({
  pluginName: 'stealth',
  requirements: new Set(),
}));

export default mockStealthPlugin;
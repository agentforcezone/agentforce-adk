// Mock puppeteer-extra
const mockPuppeteer = {
  use: jest.fn(),
  launch: jest.fn(() => Promise.resolve({
    newPage: jest.fn(() => Promise.resolve({
      goto: jest.fn(),
      content: jest.fn(() => Promise.resolve('<html><body>Mock content</body></html>')),
      close: jest.fn(),
      setViewport: jest.fn(),
      waitForTimeout: jest.fn(),
    })),
    close: jest.fn(),
  })),
};

export default mockPuppeteer;
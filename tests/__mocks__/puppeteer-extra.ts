// Mock for puppeteer-extra
import { jest } from "@jest/globals";

// Mock page object
const mockPage = {
  goto: jest.fn().mockResolvedValue({
    status: () => 200,
    statusText: () => "OK",
  }),
  setViewport: jest.fn().mockResolvedValue(undefined),
  setUserAgent: jest.fn().mockResolvedValue(undefined),
  setCookie: jest.fn().mockResolvedValue(undefined),
  setJavaScriptEnabled: jest.fn().mockResolvedValue(undefined),
  setRequestInterception: jest.fn().mockResolvedValue(undefined),
  on: jest.fn().mockReturnValue(undefined),
  waitForSelector: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockImplementation((fn: Function) => {
    // Simulate different evaluate scenarios based on function content
    const fnString = fn.toString();
    if (fnString.includes("innerText") || fnString.includes("textContent")) {
      return Promise.resolve("Mocked page content");
    }
    if (fnString.includes("querySelectorAll(\"a[href]")")) {
      return Promise.resolve(["https://example.com/link1", "https://example.com/link2"]);
    }
    if (fnString.includes("querySelectorAll(\"img[src]")")) {
      return Promise.resolve(["https://example.com/image1.jpg", "https://example.com/image2.png"]);
    }
    return Promise.resolve("");
  }),
  content: jest.fn().mockResolvedValue("<html><body>Mocked HTML content</body></html>"),
  screenshot: jest.fn().mockResolvedValue(Buffer.from("fake-screenshot-data")),
  title: jest.fn().mockResolvedValue("Mocked Page Title"),
  url: jest.fn().mockReturnValue("https://httpbin.org/html"),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock browser object
const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock puppeteer-extra
const mockPuppeteer = {
  use: jest.fn(),
  launch: jest.fn().mockResolvedValue(mockBrowser),
};

// Export the mock
export default mockPuppeteer;

// Also provide named export for compatibility
export { mockPuppeteer as puppeteer, mockBrowser, mockPage };
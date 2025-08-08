// Mock for puppeteer-extra-plugin-stealth
import { jest } from "@jest/globals";

const mockStealthPlugin = jest.fn().mockReturnValue({
  name: "StealthPlugin",
  requirements: new Set(["headful"]),
});

export default mockStealthPlugin;
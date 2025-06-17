import { describe, expect, test, beforeEach } from "bun:test";
import { OllamaProvider } from "../lib/provider/ollama";

describe('OllamaProvider Tests', () => {
    let provider: OllamaProvider;

    beforeEach(() => {
        provider = new OllamaProvider("gemma3:4b");
    });

    test("should initialize with correct model", () => {
        expect(provider.getModel()).toBe("gemma3:4b");
    });

    test("should allow setting new model", () => {
        provider.setModel("llama3.1");
        expect(provider.getModel()).toBe("llama3.1");
    });

    test("should be instantiable", () => {
        expect(provider).toBeInstanceOf(OllamaProvider);
    });

    // Note: We don't test the actual chat method here as it requires Ollama to be running
    // and would make external API calls. In a real-world scenario, you'd mock the ollama module.
});

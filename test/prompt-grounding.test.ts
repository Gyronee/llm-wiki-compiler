import { describe, expect, it } from "vitest";
import { buildExtractionPrompt, buildPagePrompt } from "../src/compiler/prompts.js";

describe("grounded wiki generation prompts", () => {
  it("forbids placeholder wikilinks and requires citations on list items", () => {
    const prompt = buildPagePrompt("Concept", "1 | source", "", "");

    expect(prompt).toContain("Do not create placeholder [[wikilinks]]");
    expect(prompt).toContain("Only use [[wikilinks]] for pages that appear in the related wiki pages");
    expect(prompt).toContain("Every factual bullet or numbered list item must end with a citation");
    expect(prompt).toContain("Do not leave material claims uncited");
  });

  it("tells extraction to skip concepts that are merely mentioned or promised later", () => {
    const prompt = buildExtractionPrompt("source", "");

    expect(prompt).toContain("Do not extract a concept that is only named, teased, promised for later");
  });
});

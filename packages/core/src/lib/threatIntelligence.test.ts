import { describe, it, expect } from "vitest";
import { generateCpeString } from "./threatIntelligence";
// extractKeywordsFromAsset is not exported as type Asset required; import via require to bypass TS types
import * as TI from "./threatIntelligence";

describe("threatIntelligence helpers", () => {
  it("generateCpeString formats vendor/product/version correctly", () => {
    const cpe = generateCpeString("Apache", "Tomcat Server", "9.0.86");
    expect(cpe).toBe("cpe:2.3:a:apache:tomcat_server:9.0.86:*:*:*:*:*:*:*");
  });

  it("extractKeywordsFromAsset derives keywords from vendor/product", () => {
    const asset: any = {
      name: "Web Server",
      type: "Software",
      vendor: "Apache",
      productName: "Tomcat",
      version: "9.0.86",
      description: "Production Java application server",
      technologies: ["Java", "Servlet"]
    };
    const keywords = TI.extractKeywordsFromAsset(asset as any);
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.join(" ").toLowerCase()).toContain("apache");
    expect(keywords.join(" ").toLowerCase()).toContain("tomcat");
  });
})

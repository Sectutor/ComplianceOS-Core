# Contributing Compliance Framework Plugins

ComplianceOS supports a plugin system that allows the community to add new compliance frameworks easily. This guide explains how to create, validate, and submit a new framework plugin.

## Plugin Structure

A plugin is a single JSON file that contains both metadata (manifest) and the framework content (requirements, phases).

### File Format
Name your file using the framework slug, e.g., `iso-27001.json` or `soc2-type-2.json`.

### Schema
Your JSON file must adhere to the [JSON Schema](/data/schemas/framework-plugin.schema.json).

### Example Structure
```json
{
  "$schema": "../../schemas/framework-plugin.schema.json",
  "manifest": {
    "slug": "sample-framework",
    "name": "Sample Framework v1.0",
    "version": "1.0.0",
    "description": "A sample compliance framework.",
    "publisher": {
      "name": "ComplianceOS",
      "url": "https://complianceos.com"
    },
    "license": "CC-BY-4.0",
    "type": "standard",
    "tags": ["security", "privacy"]
  },
  "content": {
    "phases": [
      {
        "name": "Phase 1",
        "description": "Initial Setup",
        "order": 1
      }
    ],
    "requirements": [
      {
        "identifier": "REQ-01",
        "title": "Requirement 1",
        "description": "Description of requirement 1.",
        "phaseName": "Phase 1"
      }
    ]
  }
}
```

## Creating a Plugin

1.  **Start with the Template**: Copy the structure above or use an existing plugin from `data/registry/plugins/` as a base.
2.  **Define Phases**: ComplianceOS uses "Implementation Phases" to guide users. Group your requirements logically (e.g., "Policy Development", "Technical Controls", "Audit Prep").
3.  **Add Requirements**: Populate `content.requirements` with the controls or requirements of the framework.
    *   `identifier`: The unique code (e.g., "A.5.1.1").
    *   `phaseName`: Must match one of the names in `content.phases`.
    *   `guidance`: (Optional) Helpful text for implementing the requirement.

## Validation

Before submitting, validate your plugin against the schema. You can use any JSON Schema validator or the built-in test tools.

## Submission

1.  Place your JSON file in `data/registry/plugins/`.
2.  Add an entry to `data/registry/index.json` referencing your new plugin.
3.  Submit a Pull Request.

## Best Practices

*   **Granularity**: Keep requirements atomic.
*   **Clarity**: Use clear titles and descriptions.
*   **Phasing**: logical phrasing helps users prioritize work.

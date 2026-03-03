/**
 * ComplianceOS Integrations
 * 
 * Main entry point for the integration marketplace system.
 * Exports all integration types and utilities.
 */

// Types
export * from './types';

// Registry
export { integrationRegistry, getIntegrations, getIntegration, getBuiltInIntegrations, executeIntegration } from './registry';

// Marketplace
export { githubMarketplace, GitHubMarketplaceClient, createMarketplaceClient } from './github-marketplace';

// Built-in integrations
export { githubManifest, GitHubClient, executeGitHubAction } from './github';
export { slackManifest, SlackClient, executeSlackAction } from './slack';
export { googleDriveManifest, GoogleDriveClient, executeGoogleDriveAction } from './google-drive';
export { vulnerabilityScannerManifest, executeVulnerabilityScannerAction } from './vulnerability-scanner';
export { siemManifest, executeSIEMAction } from './siem';
export { soarManifest, executeSOARAction } from './soar';
export { threatIntelManifest, executeThreatIntelAction } from './threat-intel';

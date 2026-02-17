# PASTA Threat Modeling Implementation

## Overview
The PASTA (Process for Attack Simulation and Threat Analysis) methodology has been fully integrated into the ComplianceOS Threat Modeling tool. PASTA is a risk-centric threat modeling approach that focuses on business impact and provides a structured 7-stage process.

## Implementation Details

### Files Created
1. **`PASTAStages.tsx`** - Complete implementation of all 7 PASTA stages with interactive UI

### Files Modified
1. **`ThreatModelWizard.tsx`** - Integrated PASTA workflow into the main threat modeling wizard

## PASTA 7 Stages

### Stage I: Definition of Objectives
- **Business Objectives**: Define what the organization aims to achieve
- **Security Objectives**: Identify security goals aligned with business objectives
- **Compliance Requirements**: List regulatory and compliance requirements (GDPR, PCI-DSS, HIPAA, etc.)

**UI Features**:
- Add/remove business objectives
- Add/remove security objectives
- Add/remove compliance requirements
- Color-coded display (blue for business, green for security, purple for compliance)

### Stage II: Definition of Technical Scope
- **Applications**: List all applications within the threat model scope
- **Infrastructure Components**: Define infrastructure (servers, databases, cloud services)
- **Data Assets**: Identify critical data that needs protection
- **External Dependencies**: Map third-party services and APIs

**UI Features**:
- Quick-add inputs with Enter key support
- Badge-based display with remove functionality
- Color coding for different asset types

### Stage III: Application Decomposition and Analysis
- **Data Flows**: Automatically captured from architecture diagram
- **Trust Boundaries**: Define security boundaries between network zones
- **Entry/Exit Points**: Identify all system entry and exit points

**UI Features**:
- Auto-populated from threat model components
- Manual entry for boundaries and entry points
- Integration with existing DFD canvas

### Stage IV: Threat Analysis
- **Threat Actors**: Identify potential attackers
  - External Hackers
  - Insider Threats
  - Nation States
  - Competitors
  - Script Kiddies
- **Threat Scenarios**: Define realistic attack scenarios

**UI Features**:
- Pre-built threat actor templates with:
  - Name
  - Motivation
  - Capability level
- Custom threat scenario builder
- Color-coded actor cards

### Stage V: Vulnerability and Weakness Analysis
- Identify system vulnerabilities
- Map to CWE (Common Weakness Enumeration)
- CVSS scoring support

**Status**: Integrated with existing threat analysis workflow

### Stage VI: Attack Enumeration and Modeling
- Attack tree development
- Attack path modeling
- Prerequisite identification

**Status**: Integrated with existing threat analysis workflow

### Stage VII: Risk and Impact Analysis
- Risk scoring (Likelihood × Impact)
- Business impact assessment
- Mitigation strategy development

**Status**: Integrated with existing risk generation and scoring

## User Workflow

### For PASTA Methodology:

1. **Create Threat Model**
   - Select "PASTA (Risk-Centric)" as methodology
   - Name the threat model
   - Click "Next"

2. **Complete PASTA Stages** (New!)
   - Work through 7 interactive stages
   - Each stage validates completion before proceeding
   - Progress bar shows overall completion
   - Expandable/collapsible interface

3. **Architecture Decomposition**
   - Build visual architecture diagram (same as STRIDE)
   - Drag-and-drop components
   - Define data flows

4. **Threat Analysis**
   - AI-powered risk generation
   - Risk scoring based on PASTA analysis
   - Mitigation selection

5. **Verification & Commitment**
   - Review identified risks
   - Commit to Global Risk Register

## Key Features

### Progress Tracking
- Visual progress bar showing completion of 7 stages
- Stage completion indicators (checkmarks)
- Color-coded stages (green = complete, blue = in progress)

### Smart Validation
- Each stage validates completion before allowing progression
- Minimum requirements per stage:
  - Stage I: At least 1 business + 1 security objective
  - Stage II: At least 1 application identified
  - Stage III: At least 1 trust boundary or entry point
  - Stage IV: At least 1 threat actor
  - Stages V-VII: Integrated with analysis workflow

### Data Persistence
- All PASTA data saved to state
- Can return to stages to update information
- Data flows into risk generation process

### Integration
- Seamless integration with existing threat modeling workflow
- PASTA data enriches risk analysis
- Compatible with Global Risk Register

## Technical Architecture

```typescript
interface PASTAData {
    businessObjectives: string[];
    securityObjectives: string[];
    complianceRequirements: string[];
    technicalScope: {
        applications: string[];
        infrastructureComponents: string[];
        dataAssets: string[];
        externalDependencies: string[];
    };
    decomposition: {
        dataFlows: any[];
        trustBoundaries: string[];
        entryExitPoints: string[];
    };
    threatAnalysis: {
        threatActors: Array<{
            name: string;
            motivation: string;
            capability: string;
        }>;
        threatScenarios: string[];
    };
    vulnerabilities: Array<{
        id: string;
        description: string;
        cwe?: string;
        cvss?: number;
    }>;
    attackTrees: Array<{
        goal: string;
        attackPaths: string[];
        prerequisites: string[];
    }>;
    riskAnalysis: Array<{
        threat: string;
        likelihood: number;
        impact: number;
        businessImpact: string;
        mitigation: string;
    }>;
}
```

## Benefits of PASTA vs STRIDE

### PASTA Advantages:
1. **Risk-Centric**: Focuses on business risk, not just technical threats
2. **Business Alignment**: Explicitly links security to business objectives
3. **Comprehensive**: 7 stages cover entire threat landscape
4. **Attacker-Focused**: Deep analysis of threat actors and motivations
5. **Compliance-Aware**: Built-in compliance requirement tracking

### STRIDE Advantages:
1. **Simpler**: Fewer steps, faster execution
2. **Technical Focus**: Great for developers and architects
3. **Microsoft Best Practice**: Industry-standard for Windows/Azure

## Future Enhancements

### Potential Additions:
1. **Attack Tree Visualization** - Interactive attack tree builder in Stage VI
2. **CVSS Calculator** - Built-in vulnerability scoring in Stage V
3. **Risk Heat Mapping** - Visual risk matrix based on PASTA analysis
4. **Compliance Mapping** - Auto-map requirements to controls
5. **Export to PASTA Report** - Generate standardized PASTA documentation
6. **Threat Intelligence Integration** - Import known threats for Stage IV
7. **Business Impact Analysis** - Quantitative risk assessment tools

## Usage Statistics Tracking

The following could be tracked for analytics:
- PASTA vs STRIDE methodology adoption rate
- Average time per PASTA stage
- Common threat actors selected
- Compliance frameworks most referenced
- Risk distribution by business objective

## Documentation

For end users, create a help guide covering:
- When to use PASTA vs STRIDE
- How to define meaningful business objectives
- Best practices for identifying threat actors
- Compliance requirement examples
- Integration with existing risk management processes

---

**Status**: ✅ Fully Implemented and Ready for Use

**Version**: 1.0
**Last Updated**: 2026-01-30

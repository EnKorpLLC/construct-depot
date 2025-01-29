# AI LOGGING STANDARDS

Last Updated: 2025-01-21 20:34

# AI Development Logging Standards
Last Updated: 2024-01-20

## Overview

This document outlines the required logging standards for AI developers working with this template. AI developers MUST maintain logs of their operations while preserving the template structure unchanged unless explicitly instructed otherwise.

## Core Principles

1. **Template Preservation**
   - Template files are READ-ONLY by default
   - Modifications only allowed with explicit user permission
   - Use logs to track your process instead
   - Document why template changes were requested

2. **Required Logging**
   ```markdown
   - Development actions taken
   - Verification script results
   - Process adherence checks
   - Template usage notes
   - Requested modifications
   ```typescript

## Logging Structure

1. **Operation Log Format**
   ```json
   {
     "timestamp": "ISO-8601",
     "operation": "OPERATION_TYPE",
     "files_affected": ["file/paths"],
     "verification_results": {},
     "process_followed": ["steps"],
     "notes": "Additional context"
   }
   ```typescript

2. **Development Log Format**
   ```json
   {
     "session_id": "uuid",
     "start_time": "ISO-8601",
     "template_version": "version",
     "operations": [],
     "template_deviations": [],
     "verification_summary": {}
   }
   ```typescript

## Required Log Categories

1. **Process Logs**
   - Template usage steps
   - Verification results
   - Standard adherence
   - Process completion
   - Issues encountered

2. **Development Logs**
   - Code changes
   - Documentation updates
   - Test results
   - Security checks
   - Performance metrics

3. **Verification Logs**
   - Script execution
   - Check results
   - Issue detection
   - Resolution steps
   - Final status

4. **Template Usage Logs**
   - Files referenced
   - Standards followed
   - Process adherence
   - Customizations made
   - User requests

## Log Storage

1. **Location**
   ```typescript
   project_root/
   ├── .ai-logs/
   │   ├── development/
   │   ├── verification/
   │   ├── process/
   │   └── template/
   ```typescript

2. **File Naming**
   ```typescript
   YYYY-MM-DD_SESSION-ID_CATEGORY.json
   ```typescript

## Template Modification Requests

1. **Request Format**
   ```json
   {
     "timestamp": "ISO-8601",
     "template_file": "file/path",
     "modification_type": "MODIFY/ADD/DELETE",
     "reason": "Detailed explanation",
     "user_approval": false,
     "approval_timestamp": null
   }
   ```typescript

2. **Tracking Changes**
   ```json
   {
     "original_state": "hash/content",
     "modified_state": "hash/content",
     "approval_reference": "user message/id",
     "reversion_plan": "how to revert"
   }
   ```typescript

## Verification Logging

1. **Script Results**
   ```json
   {
     "script": "script_name",
     "execution_time": "ISO-8601",
     "status": "SUCCESS/FAILURE",
     "issues_found": [],
     "resolution_steps": []
   }
   ```typescript

2. **Process Verification**
   ```json
   {
     "process": "process_name",
     "steps_completed": [],
     "standards_met": [],
     "deviations": [],
     "justification": "explanation"
   }
   ```typescript

## Development Progress

1. **Status Updates**
   ```json
   {
     "milestone": "milestone_name",
     "completion": "percentage",
     "blockers": [],
     "next_steps": [],
     "template_usage": []
   }
   ```typescript

2. **Issue Tracking**
   ```json
   {
     "issue_type": "PROCESS/TEMPLATE/VERIFICATION",
     "description": "issue details",
     "impact": "impact assessment",
     "resolution": "steps taken",
     "template_relation": "how it relates"
   }
   ```typescript

## Security Logging

1. **Access Logs**
   ```json
   {
     "template_file": "file/path",
     "access_type": "READ/REQUESTED_WRITE",
     "purpose": "reason for access",
     "approval_status": "APPROVED/PENDING/DENIED"
   }
   ```typescript

2. **Modification Logs**
   ```json
   {
     "file": "file/path",
     "change_type": "type",
     "approval_reference": "reference",
     "security_impact": "assessment",
     "rollback_plan": "steps"
   }
   ```typescript

## Best Practices

1. **Logging Guidelines**
   - Be comprehensive
   - Include context
   - Track decisions
   - Note template usage
   - Document approvals

2. **Template Interaction**
   - Default to read-only
   - Request modifications
   - Document reasons
   - Track changes
   - Maintain versions 
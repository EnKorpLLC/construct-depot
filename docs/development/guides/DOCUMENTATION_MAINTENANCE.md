# Documentation Maintenance Guide
Last Updated: 2025-01-21 20:34

## Pre-Action Documentation Check

### 1. Search Existing Documentation
```bash
# Search for content in documentation
grep -r "search term" docs/

# Find files by name
find docs/ -name "*PATTERN*"

# Check recent changes
git log --since="1 week ago" -- docs/
```typescript

### 2. Review Process
1. Start with Root Documents:
   - Read `docs/README.md`
   - Check category-specific index files
   - Review referenced guides

2. Check Related Documentation:
   - Follow cross-references
   - Check dependent documents
   - Review similar implementations

3. Verify Documentation Status:
   - Check last updated timestamps
   - Verify cross-references are valid
   - Ensure consistency with current codebase

### 3. Documentation Location Standards
- API Documentation: `docs/api/endpoints/`
- Core Guides: `docs/core/`
- Development Guides: `docs/development/`
- Service Documentation: `docs/services/`
- Testing Documentation: `docs/testing/`

## Post-Action Documentation Update

### 1. Identify Affected Documentation
- Direct Documentation:
  - Files we modified
  - Files we created
  - Files we referenced

- Related Documentation:
  - Parent documents
  - Referenced documents
  - Dependent documents

- Cross-Referenced Documentation:
  - Check incoming references
  - Update outgoing references
  - Verify reference integrity

### 2. Update Process
1. Update Content:
   ```markdown
   # Document Title
   Last Updated: YYYY-MM-DD HH:mm

   ## Overview
   Brief description of changes/updates

   ## Changes
   - List major changes
   - Update relevant sections
   - Add new information
   ```typescript

2. Update Metadata:
   - Timestamps (YYYY-MM-DD HH:mm format)
   - Version numbers (if applicable)
   - Contributors (if tracking)

3. Cross-Reference Updates:
   - Update incoming links
   - Fix outgoing links
   - Verify reference integrity

### 3. Verification Checklist
- [ ] All timestamps current
- [ ] Cross-references valid
- [ ] Formatting consistent
- [ ] Content accurate
- [ ] Examples working
- [ ] Links functional

## Documentation Standards

### 1. File Naming
- Use UPPERCASE for main words
- Use underscores for spaces
- Include category prefix if applicable
- Examples:
  - `QUICK_START.md`
  - `API_REFERENCE.md`
  - `DEPLOYMENT_GUIDE.md`

### 2. Content Structure
```markdown
# Title
Last Updated: YYYY-MM-DD HH:mm

## Overview
Brief description

## Sections
### Section Title
Content

## Related Documents
- [Document Name](relative/path/to/document.md)
```typescript

### 3. Formatting Rules
- Use ATX-style headers (#)
- Use code blocks with language
- Use relative links
- Include timestamps
- Consistent spacing

### 4. Cross-Referencing
- Use relative paths
- Include section anchors
- Verify links work
- Example:
  ```markdown
  [Setup Guide](../guides/QUICK_START.md#installation)
  ```typescript

## Maintenance Best Practices

### 1. Regular Reviews
- Weekly check for outdated content
- Monthly comprehensive review
- Quarterly deep cleanup

### 2. Version Control
- Commit message format:
  ```typescript
  docs: update [DOCUMENT] with [CHANGE]
  
  - Detail changes made
  - Reason for changes
  - Related documents updated
  ```typescript

### 3. Collaboration
- Use pull requests for major changes
- Request reviews when needed
- Document decisions
- Update team on changes

## Common Tasks

### 1. Adding New Documentation
1. Check for existing similar docs
2. Follow naming conventions
3. Use standard templates
4. Update parent documents
5. Verify cross-references

### 2. Updating Existing Documentation
1. Check last modified date
2. Review related documents
3. Update timestamps
4. Verify all references
5. Test all examples

### 3. Removing Documentation
1. Check for references
2. Update dependent docs
3. Archive if needed
4. Update indexes
5. Remove cross-references 
# DRY Principle - Coding Standards

## Always Follow DRY (Don't Repeat Yourself) Principle

When creating components and code, always prioritize the DRY principle to maintain clean, maintainable, and scalable codebases.

### Key Guidelines

#### 1. Identify Duplicate Code Early
- Look for repeated patterns, especially in UI components
- Watch for similar logic across different files
- Identify common styling patterns and behaviors

#### 2. Extract Shared Components
- Create reusable components for common UI patterns (search inputs, buttons, modals, etc.)
- Use proper TypeScript interfaces for component props
- Make components flexible with optional props and customizable behavior

#### 3. Shared Utilities and Functions
- Extract common business logic into utility functions
- Create shared hooks for common state management patterns
- Use shared constants for repeated values

#### 4. Component Design Principles
- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Build complex components by composing simpler ones
- **Prop Interface Design**: Create clean, intuitive APIs for components
- **Flexibility**: Allow customization through props without breaking core functionality

#### 5. Examples of Good DRY Practices
- Shared SearchInput component (instead of duplicate search implementations)
- Reusable Button components with variant props
- Common form validation logic
- Shared API service functions
- Consistent styling through CSS classes or styled-components

#### 6. Refactoring Strategy
- When you see duplicate code, immediately consider extraction
- Start with the simplest shared component and iterate
- Ensure the abstraction makes sense and isn't over-engineered
- Test that the refactored code works identically to the original

#### 7. Benefits of Following DRY
- **Maintainability**: Changes only need to be made in one place
- **Consistency**: Ensures uniform behavior and appearance
- **Reduced Bugs**: Less code means fewer places for bugs to hide
- **Faster Development**: Reusable components speed up feature development
- **Better Testing**: Shared components can be thoroughly tested once

### Implementation Checklist
- [ ] Scan for duplicate code patterns
- [ ] Extract into shared components/utilities
- [ ] Create proper TypeScript interfaces
- [ ] Test that functionality remains identical
- [ ] Document the shared component's API
- [ ] Update all usage locations to use the shared version

Always prioritize DRY principles in code reviews and when implementing new features.
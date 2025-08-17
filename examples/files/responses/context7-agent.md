I'm sorry, it seems there might have been an issue with accessing the Shadcn UI documentation. The system appears to have encountered a rate limit error when trying to retrieve the library documentation.

However, based on my knowledge of Shadcn UI, here's what I can tell you about theme colors:

**Shadcn UI Theme Colors Options**

Shadcn UI uses Tailwind CSS under the hood, so it supports all standard Tailwind color palette options. When working with themes in Shadcn UI, you typically have several approaches:

1. **Default Color Scheme**
   - Primary: Blue (`blue-600` by default)
   - Secondary: Gray (`gray-700`)
   - Success: Green (`green-500`)
   - Warning: Yellow (`yellow-500`)
   - Danger: Red (`red-500`)
   - Background: White/light gray

2. **Customization Methods**
   - Modify `tailwind.config.js` to customize the default color palette
   - Create custom color variables in your CSS
   - Use the `theme` configuration in your components

3. **Theme Configuration**
   ```javascript
   // Example tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           primary: '#3B82F6',
           secondary: '#64748B',
           success: '#10B981',
           warning: '#F59E0B',
           danger: '#EF4444'
         }
       }
     }
   }
   ```

4. **Component-Specific Theming**
   Many Shadcn components accept `className` props where you can apply custom color classes:
   ```jsx
   <Button className="bg-primary hover:bg-primary-dark">Click Me</Button>
   ```

Would you like me to try a different approach or provide more specific information about any aspect of Shadcn UI theming?
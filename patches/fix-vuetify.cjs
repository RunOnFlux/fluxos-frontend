/**
 * Vuetify Bug Fix Script
 *
 * This script fixes a known issue in Vuetify 3.8.x - 3.10.x where the CSS property
 * 'forced-color-adjust: preserve-parent-color' is invalid and causes Sass compilation
 * to fail. The valid values for this property are 'auto' or 'none'.
 *
 * This script automatically runs after npm install via the postinstall hook.
 * You can also run it manually with: npm run fix-vuetify
 *
 * See: https://github.com/vuetifyjs/vuetify/issues/...
 */

const fs = require('fs');
const path = require('path');

// Get project root (one level up from patches/)
const projectRoot = path.join(__dirname, '..');

// List of files to fix
const files = [
  'node_modules/vuetify/lib/labs/VIconBtn/VIconBtn.scss',
  'node_modules/vuetify/lib/components/VList/VListItem.sass',
  'node_modules/vuetify/lib/components/VChipGroup/VChipGroup.sass',
  'node_modules/vuetify/lib/components/VBtnToggle/VBtnToggle.sass',
  'node_modules/vuetify/lib/components/VBadge/VBadge.sass',
  'node_modules/vuetify/lib/components/VList/VListItem.css',
  'node_modules/vuetify/lib/labs/VIconBtn/VIconBtn.css',
  'node_modules/vuetify/lib/components/VChipGroup/VChipGroup.css',
  'node_modules/vuetify/lib/components/VBtnToggle/VBtnToggle.css',
  'node_modules/vuetify/lib/components/VBadge/VBadge.css'
];

let fixedCount = 0;
let errorCount = 0;

files.forEach(file => {
  const fullPath = path.join(projectRoot, file);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // For .sass files (indented syntax), remove semicolon
    // For .scss and .css files, keep semicolon
    if (file.endsWith('.sass')) {
      content = content.replace(/forced-color-adjust:\s*preserve-parent-color;?/g, 'forced-color-adjust: none');
    } else {
      content = content.replace(/forced-color-adjust:\s*preserve-parent-color;?/g, 'forced-color-adjust: none;');
    }

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Fixed: ${file}`);
      fixedCount++;
    } else {
      console.log(`  Already fixed: ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
    errorCount++;
  }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
if (errorCount > 0) {
  console.log(`✗ ${errorCount} errors`);
  process.exit(1);
}

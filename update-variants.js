const fs = require('fs');
const path = require('path');

const targetVariants = `const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
} as const;`;

const updateFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const regex = /const containerVariants\s*=\s*\{[\s\S]*?\} as const;\s*const itemVariants\s*=\s*\{[\s\S]*?\} as const;/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, targetVariants);
    changed = true;
  } else {
    const regexContainer = /const containerVariants\s*=\s*\{[\s\S]*?\} as const;/g;
    if (regexContainer.test(content)) {
      content = content.replace(regexContainer, targetVariants);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('layout.tsx')) {
      updateFile(fullPath);
    }
  }
}

walk('c:/Project NextJS/Sistem Rekomendasi Penempatan Karyawan FNB/fnb-talent-system/src/app');
